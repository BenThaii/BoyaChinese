/**
 * ChapterFilter Service
 * 
 * Filters vocabulary based on user-selected chapter range.
 * Provides chapter range validation and random character sampling for AI text generation.
 */

import { VocabularyEntryDAO } from '../models/VocabularyEntry';
import { getPool } from '../config/database';
import { RowDataPacket } from 'mysql2';

/**
 * Chapter range interface
 */
export interface ChapterRange {
  start: number;
  end: number;
}

/**
 * ChapterFilter class for filtering vocabulary by chapter range
 */
export class ChapterFilter {
  /**
   * Get vocabulary IDs within chapter range
   * @param username - Owner username
   * @param range - Chapter range (inclusive)
   * @returns Array of vocabulary entry IDs
   */
  static async getVocabularyInRange(username: string, range: ChapterRange): Promise<string[]> {
    const pool = getPool();
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM vocabulary_entries 
       WHERE username = ? AND chapter >= ? AND chapter <= ?
       ORDER BY chapter ASC, created_at ASC`,
      [username, range.start, range.end]
    );

    return rows.map(row => row.id as string);
  }

  /**
   * Get random sample of characters from chapter range
   * @param username - Owner username
   * @param range - Chapter range (inclusive)
   * @param count - Maximum number of characters to return (up to 300)
   * @returns Array of Chinese characters
   */
  static async getRandomCharacters(username: string, range: ChapterRange, count: number): Promise<string[]> {
    const pool = getPool();
    
    // Limit count to 300 as per requirements
    const limitedCount = Math.min(count, 300);
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT chinese_character FROM vocabulary_entries 
       WHERE username = ? AND chapter >= ? AND chapter <= ?
       ORDER BY RAND()
       LIMIT ?`,
      [username, range.start, range.end, limitedCount]
    );

    return rows.map(row => row.chinese_character as string);
  }

  /**
   * Validate chapter range
   * @param username - Owner username
   * @param range - Chapter range to validate
   * @returns True if range is valid and contains vocabulary, false otherwise
   */
  static async validateRange(username: string, range: ChapterRange): Promise<boolean> {
    // Check if range is logically valid
    if (range.start < 0 || range.end < 0) {
      return false;
    }
    
    if (range.start > range.end) {
      return false;
    }

    // Check if there is any vocabulary in the range
    const pool = getPool();
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM vocabulary_entries 
       WHERE username = ? AND chapter >= ? AND chapter <= ?`,
      [username, range.start, range.end]
    );

    const count = rows[0].count as number;
    return count > 0;
  }
}
