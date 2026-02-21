/**
 * VocabularyEntry Model
 * 
 * TypeScript interfaces and data access layer for vocabulary entries.
 * Implements CRUD operations with user isolation filtering.
 */

import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Input interface for creating or updating vocabulary entries
 */
export interface VocabularyInput {
  chineseCharacter: string;
  pinyin?: string;
  hanVietnamese?: string;
  modernVietnamese?: string;
  englishMeaning?: string;
  learningNote?: string;
  chapter: number;
}

/**
 * Complete vocabulary entry interface matching database schema
 */
export interface VocabularyEntry extends VocabularyInput {
  id: string;
  username: string;
  pinyin: string; // Required in full entry
  createdAt: Date;
  updatedAt: Date;
  sharedFrom?: string;
}

/**
 * Database row interface for type-safe queries
 */
interface VocabularyEntryRow extends RowDataPacket {
  id: string;
  username: string;
  chinese_character: string;
  pinyin: string;
  han_vietnamese: string | null;
  modern_vietnamese: string | null;
  english_meaning: string | null;
  learning_note: string | null;
  chapter: number;
  created_at: Date;
  updated_at: Date;
  shared_from: string | null;
}

/**
 * Convert database row to VocabularyEntry interface
 */
function rowToEntry(row: VocabularyEntryRow): VocabularyEntry {
  return {
    id: row.id,
    username: row.username,
    chineseCharacter: row.chinese_character,
    pinyin: row.pinyin,
    hanVietnamese: row.han_vietnamese || undefined,
    modernVietnamese: row.modern_vietnamese || undefined,
    englishMeaning: row.english_meaning || undefined,
    learningNote: row.learning_note || undefined,
    chapter: row.chapter,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sharedFrom: row.shared_from || undefined
  };
}

/**
 * Data Access Layer for VocabularyEntry
 */
export class VocabularyEntryDAO {
  /**
   * Create a new vocabulary entry
   * @param username - Owner username
   * @param entry - Vocabulary entry data
   * @returns Created vocabulary entry
   */
  static async create(username: string, entry: VocabularyInput): Promise<VocabularyEntry> {
    const pool = getPool();
    const id = uuidv4();
    
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO vocabulary_entries 
       (id, username, chinese_character, pinyin, han_vietnamese, modern_vietnamese, 
        english_meaning, learning_note, chapter, shared_from)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        username,
        entry.chineseCharacter,
        entry.pinyin || '',
        entry.hanVietnamese || null,
        entry.modernVietnamese || null,
        entry.englishMeaning || null,
        entry.learningNote || null,
        entry.chapter,
        null
      ]
    );

    // Fetch and return the created entry
    const created = await this.findById(username, id);
    if (!created) {
      throw new Error('Failed to create vocabulary entry');
    }
    
    return created;
  }

  /**
   * Find a vocabulary entry by ID with user isolation
   * @param username - Owner username
   * @param id - Entry ID
   * @returns Vocabulary entry or null if not found
   */
  static async findById(username: string, id: string): Promise<VocabularyEntry | null> {
    const pool = getPool();
    
    const [rows] = await pool.query<VocabularyEntryRow[]>(
      `SELECT * FROM vocabulary_entries WHERE id = ? AND username = ?`,
      [id, username]
    );

    if (rows.length === 0) {
      return null;
    }

    return rowToEntry(rows[0]);
  }

  /**
   * Find all vocabulary entries for a user with optional chapter filtering
   * @param username - Owner username
   * @param chapterStart - Optional start chapter (inclusive)
   * @param chapterEnd - Optional end chapter (inclusive)
   * @returns Array of vocabulary entries
   */
  static async findByUsername(
    username: string,
    chapterStart?: number,
    chapterEnd?: number
  ): Promise<VocabularyEntry[]> {
    const pool = getPool();
    let query = 'SELECT * FROM vocabulary_entries WHERE username = ?';
    const params: any[] = [username];

    if (chapterStart !== undefined && chapterEnd !== undefined) {
      query += ' AND chapter >= ? AND chapter <= ?';
      params.push(chapterStart, chapterEnd);
    } else if (chapterStart !== undefined) {
      query += ' AND chapter >= ?';
      params.push(chapterStart);
    } else if (chapterEnd !== undefined) {
      query += ' AND chapter <= ?';
      params.push(chapterEnd);
    }

    query += ' ORDER BY chapter ASC, created_at ASC';

    const [rows] = await pool.query<VocabularyEntryRow[]>(query, params);

    return rows.map(rowToEntry);
  }

  /**
   * Update a vocabulary entry with user isolation
   * @param username - Owner username
   * @param id - Entry ID
   * @param updates - Partial updates to apply
   * @returns Updated vocabulary entry or null if not found
   */
  static async update(
    username: string,
    id: string,
    updates: Partial<VocabularyInput>
  ): Promise<VocabularyEntry | null> {
    const pool = getPool();
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const params: any[] = [];

    if (updates.chineseCharacter !== undefined) {
      updateFields.push('chinese_character = ?');
      params.push(updates.chineseCharacter);
    }
    if (updates.pinyin !== undefined) {
      updateFields.push('pinyin = ?');
      params.push(updates.pinyin);
    }
    if (updates.hanVietnamese !== undefined) {
      updateFields.push('han_vietnamese = ?');
      params.push(updates.hanVietnamese || null);
    }
    if (updates.modernVietnamese !== undefined) {
      updateFields.push('modern_vietnamese = ?');
      params.push(updates.modernVietnamese || null);
    }
    if (updates.englishMeaning !== undefined) {
      updateFields.push('english_meaning = ?');
      params.push(updates.englishMeaning || null);
    }
    if (updates.learningNote !== undefined) {
      updateFields.push('learning_note = ?');
      params.push(updates.learningNote || null);
    }
    if (updates.chapter !== undefined) {
      updateFields.push('chapter = ?');
      params.push(updates.chapter);
    }

    if (updateFields.length === 0) {
      // No updates provided, return current entry
      return this.findById(username, id);
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Add WHERE clause parameters
    params.push(id, username);

    const query = `UPDATE vocabulary_entries SET ${updateFields.join(', ')} WHERE id = ? AND username = ?`;

    const [result] = await pool.query<ResultSetHeader>(query, params);

    if (result.affectedRows === 0) {
      return null;
    }

    // Fetch and return the updated entry
    return this.findById(username, id);
  }

  /**
   * Delete a vocabulary entry with user isolation
   * @param username - Owner username
   * @param id - Entry ID
   * @returns True if deleted, false if not found
   */
  static async delete(username: string, id: string): Promise<boolean> {
    const pool = getPool();
    
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM vocabulary_entries WHERE id = ? AND username = ?`,
      [id, username]
    );

    return result.affectedRows > 0;
  }

  /**
   * Get all unique chapters for a user
   * @param username - Owner username
   * @returns Array of chapter numbers
   */
  static async getChapters(username: string): Promise<number[]> {
    const pool = getPool();
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT chapter FROM vocabulary_entries WHERE username = ? ORDER BY chapter ASC`,
      [username]
    );

    return rows.map(row => row.chapter as number);
  }

  /**
   * Count vocabulary entries for a user in a specific chapter
   * @param username - Owner username
   * @param chapter - Chapter number
   * @returns Count of entries
   */
  static async countByChapter(username: string, chapter: number): Promise<number> {
    const pool = getPool();
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM vocabulary_entries WHERE username = ? AND chapter = ?`,
      [username, chapter]
    );

    return rows[0].count as number;
  }

  /**
   * Create a new vocabulary entry with shared_from field
   * @param username - Owner username
   * @param entry - Vocabulary entry data
   * @param sharedFrom - Original username if shared
   * @returns Created vocabulary entry
   */
  static async createShared(username: string, entry: VocabularyInput, sharedFrom: string): Promise<VocabularyEntry> {
    const pool = getPool();
    const id = uuidv4();
    
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO vocabulary_entries 
       (id, username, chinese_character, pinyin, han_vietnamese, modern_vietnamese, 
        english_meaning, learning_note, chapter, shared_from)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        username,
        entry.chineseCharacter,
        entry.pinyin || '',
        entry.hanVietnamese || null,
        entry.modernVietnamese || null,
        entry.englishMeaning || null,
        entry.learningNote || null,
        entry.chapter,
        sharedFrom
      ]
    );

    // Fetch and return the created entry
    const created = await this.findById(username, id);
    if (!created) {
      throw new Error('Failed to create shared vocabulary entry');
    }
    
    return created;
  }

  /**
   * Get all unique usernames who have vocabulary in a specific chapter
   * @param chapter - Chapter number
   * @returns Array of usernames
   */
  static async getUsersByChapter(chapter: number): Promise<string[]> {
    const pool = getPool();
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT username FROM vocabulary_entries WHERE chapter = ? ORDER BY username ASC`,
      [chapter]
    );

    return rows.map(row => row.username as string);
  }

  /**
   * Get all unique usernames that have vocabulary entries
   * @returns Array of all usernames sorted alphabetically
   */
  static async getAllUsers(): Promise<string[]> {
    const pool = getPool();
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT username FROM vocabulary_entries ORDER BY username ASC`
    );

    return rows.map(row => row.username as string);
  }
}
