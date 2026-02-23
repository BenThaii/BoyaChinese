/**
 * PhraseGeneratorService
 * 
 * Orchestrates batch generation of Chinese practice sentences for vocabulary groups.
 * Each vocab group represents cumulative vocabulary from chapter 1 to a specific chapter endpoint.
 * The 5 vocab groups are based on the 5 most recent chapters in the database.
 */

import { getPool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AITextGenerator, GeneratedSentence } from './AITextGenerator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a vocabulary group with cumulative chapter range
 */
export interface VocabGroup {
  id: number;              // 1-5
  chapterStart: number;    // Always 1
  chapterEndpoint: number; // One of 5 most recent chapters
}

/**
 * Represents a sentence stored in the database
 */
export interface StoredSentence {
  id: string;
  vocabGroupId: number;
  chineseText: string;
  pinyin: string;
  usedCharacters: string[];
  generationTimestamp: Date;
}

/**
 * Service for generating pre-generated phrases for vocabulary groups
 */
export class PhraseGeneratorService {
  /**
   * Get 5 vocab groups based on the 5 most recent chapters in the database.
   * Each vocab group represents cumulative vocabulary from chapter 1 to a specific chapter endpoint.
   * 
   * @returns Array of 5 VocabGroup instances ordered by chapter endpoint ascending
   */
  async getVocabGroups(): Promise<VocabGroup[]> {
    const pool = getPool();
    
    // Query for 5 most recent distinct chapters, ordered descending
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT chapter 
       FROM vocabulary_entries 
       ORDER BY chapter DESC 
       LIMIT 5`
    );

    // Extract chapter numbers
    const chapters = rows.map(row => row.chapter as number);
    
    // If we have fewer than 5 chapters, return what we have
    if (chapters.length === 0) {
      return [];
    }

    // Reverse to get ascending order for vocab groups
    chapters.reverse();

    // Create vocab groups with cumulative ranges (chapter 1 to N)
    const vocabGroups: VocabGroup[] = chapters.map((chapterEndpoint, index) => ({
      id: index + 1,
      chapterStart: 1,
      chapterEndpoint
    }));

    return vocabGroups;
  }

  /**
   * Generate one batch of 30 sentences using 300 randomly selected characters.
   * 
   * @param characters - Array of exactly 300 characters to use for generation
   * @returns Array of 30 GeneratedSentence objects
   */
  async generateBatch(characters: string[]): Promise<GeneratedSentence[]> {
    if (characters.length !== 300) {
      throw new Error(`Expected exactly 300 characters, got ${characters.length}`);
    }

    const aiGenerator = new AITextGenerator();
    const sentences = await aiGenerator.generateMultipleSentences(characters, 30);

    return sentences;
  }

  /**
   * Generate 120 sentences for a vocabulary group (4 batches × 30 sentences).
   * Fetches vocabulary from chapters 1 through chapterEndpoint and randomly selects
   * 300 characters for each batch.
   * 
   * @param group - VocabGroup with chapter range to generate sentences for
   * @returns Array of 120 GeneratedSentence objects
   */
  async generateSentencesForGroup(group: VocabGroup): Promise<GeneratedSentence[]> {
    const pool = getPool();
    
    // Fetch all vocabulary characters for the chapter range (1 to chapterEndpoint)
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT chinese_character FROM vocabulary_entries 
       WHERE chapter >= ? AND chapter <= ?`,
      [group.chapterStart, group.chapterEndpoint]
    );

    const allCharacters = rows.map(row => row.chinese_character as string);

    if (allCharacters.length === 0) {
      throw new Error(`No vocabulary found for vocab group ${group.id} (chapters ${group.chapterStart}-${group.chapterEndpoint})`);
    }

    // Generate 4 batches of 30 sentences each
    const allSentences: GeneratedSentence[] = [];
    
    for (let i = 0; i < 4; i++) {
      // Randomly select 300 characters from the vocabulary
      // If we have fewer than 300 characters, we'll sample with replacement
      const selectedCharacters: string[] = [];
      for (let j = 0; j < 300; j++) {
        const randomIndex = Math.floor(Math.random() * allCharacters.length);
        selectedCharacters.push(allCharacters[randomIndex]);
      }

      // Generate batch of 30 sentences
      const batchSentences = await this.generateBatch(selectedCharacters);
      allSentences.push(...batchSentences);
    }

    return allSentences;
  }

  /**
   * Delete all existing sentences for a vocabulary group.
   * This operation is part of the sentence replacement process.
   * 
   * @param vocabGroupId - The vocab group ID (1-5) to delete sentences for
   * @param connection - Optional database connection for transaction support
   */
  async deleteSentencesForGroup(vocabGroupId: number, connection?: any): Promise<void> {
    const pool = getPool();
    const conn = connection || pool;

    await conn.query(
      'DELETE FROM pre_generated_sentences WHERE vocab_group_id = ?',
      [vocabGroupId]
    );
  }

  /**
   * Store generated sentences in the database with UUID generation.
   * Extracts chineseText, pinyin, and usedCharacters from AI response.
   * 
   * @param sentences - Array of GeneratedSentence objects from AITextGenerator
   * @param vocabGroupId - The vocab group ID (1-5) these sentences belong to
   * @param connection - Optional database connection for transaction support
   */
  async storeSentences(
    sentences: GeneratedSentence[], 
    vocabGroupId: number,
    connection?: any
  ): Promise<void> {
    const pool = getPool();
    const conn = connection || pool;

    // Prepare batch insert
    const values = sentences.map(sentence => [
      uuidv4(), // Generate UUID for each sentence
      vocabGroupId,
      sentence.chineseText,
      sentence.pinyin,
      JSON.stringify(sentence.usedCharacters)
    ]);

    if (values.length === 0) {
      return;
    }

    // Insert all sentences in a single query
    await conn.query(
      `INSERT INTO pre_generated_sentences 
       (id, vocab_group_id, chinese_text, pinyin, used_characters) 
       VALUES ?`,
      [values]
    );
  }

  /**
   * Replace all sentences for a vocabulary group with new generated sentences.
   * Uses database transaction to ensure atomicity - if storage fails, deletion is rolled back.
   * 
   * @param vocabGroupId - The vocab group ID (1-5) to replace sentences for
   * @param sentences - Array of new GeneratedSentence objects to store
   */
  async replaceSentencesForGroup(
    vocabGroupId: number,
    sentences: GeneratedSentence[]
  ): Promise<void> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Delete old sentences
      await this.deleteSentencesForGroup(vocabGroupId, connection);

      // Store new sentences
      await this.storeSentences(sentences, vocabGroupId, connection);

      // Commit transaction
      await connection.commit();
    } catch (error) {
      // Rollback on any error
      await connection.rollback();
      throw error;
    } finally {
      // Release connection back to pool
      connection.release();
    }
  }

  /**
   * Generate sentences for all 5 vocabulary groups in a SINGLE API call.
   * This is the main orchestration method optimized for cron job execution.
   * 
   * For each group:
   * 1. Prepares 4 batches of 300 characters each
   * 2. Sends all groups/batches in one API call
   * 3. Stores generated sentences for each group
   * 
   * Implements retry logic with exponential backoff (3 attempts: 1s, 2s, 4s delays).
   * Logs generation status and errors for monitoring.
   * 
   * @throws Error if all retry attempts fail
   */
  async generateAllSentences(): Promise<void> {
    console.log('[PhraseGenerator] Starting sentence generation for all vocab groups');
    
    // Get all 5 vocab groups
    const vocabGroups = await this.getVocabGroups();
    
    if (vocabGroups.length === 0) {
      console.warn('[PhraseGenerator] No vocab groups found - skipping generation');
      return;
    }

    console.log(`[PhraseGenerator] Found ${vocabGroups.length} vocab groups to process`);

    // Prepare data for all groups in a single API call
    await this.generateAllGroupsInSingleCall(vocabGroups);

    console.log('[PhraseGenerator] Successfully completed sentence generation for all vocab groups');
  }

  /**
   * Generate sentences for all vocab groups in a single API call with retry logic.
   * Implements exponential backoff: 1s, 2s, 4s delays between attempts.
   * 
   * @param vocabGroups - Array of VocabGroup to generate sentences for
   * @param maxAttempts - Maximum number of retry attempts (default: 3)
   * @throws Error if all retry attempts fail
   */
  private async generateAllGroupsInSingleCall(
    vocabGroups: VocabGroup[],
    maxAttempts: number = 3
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `[PhraseGenerator] Processing all ${vocabGroups.length} vocab groups in single API call - Attempt ${attempt}/${maxAttempts}`
        );

        // Prepare character batches for all groups
        const pool = getPool();
        const vocabGroupsData: Array<{
          vocabGroupId: number;
          batches: string[][];
        }> = [];

        for (const group of vocabGroups) {
          // Fetch all vocabulary characters for the chapter range (1 to chapterEndpoint)
          const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT chinese_character FROM vocabulary_entries 
             WHERE chapter >= ? AND chapter <= ?`,
            [group.chapterStart, group.chapterEndpoint]
          );

          const allCharacters = rows.map(row => row.chinese_character as string);

          if (allCharacters.length === 0) {
            throw new Error(`No vocabulary found for vocab group ${group.id} (chapters ${group.chapterStart}-${group.chapterEndpoint})`);
          }

          // Prepare 4 batches of 300 characters each
          const batches: string[][] = [];
          for (let i = 0; i < 4; i++) {
            const selectedCharacters: string[] = [];
            for (let j = 0; j < 300; j++) {
              const randomIndex = Math.floor(Math.random() * allCharacters.length);
              selectedCharacters.push(allCharacters[randomIndex]);
            }
            batches.push(selectedCharacters);
          }

          vocabGroupsData.push({
            vocabGroupId: group.id,
            batches
          });
        }

        // Generate all sentences in a single API call
        console.log('[PhraseGenerator] Calling AI text generator for all groups (single API call)...');
        const aiGenerator = new AITextGenerator();
        const resultMap = await aiGenerator.generateForMultipleGroups(vocabGroupsData);

        console.log(`[PhraseGenerator] Generated sentences for ${resultMap.size} vocab groups`);

        // Store sentences for each group
        for (const [vocabGroupId, sentences] of resultMap.entries()) {
          console.log(`[PhraseGenerator] Storing ${sentences.length} sentences for vocab group ${vocabGroupId}`);
          await this.replaceSentencesForGroup(vocabGroupId, sentences);
          console.log(`[PhraseGenerator] Successfully stored sentences for vocab group ${vocabGroupId}`);
        }

        // Success - exit retry loop
        return;

      } catch (error) {
        lastError = error as Error;
        
        console.error(
          `[PhraseGenerator] Error generating sentences for all groups ` +
          `(attempt ${attempt}/${maxAttempts}):`,
          error
        );

        // If this was the last attempt, don't wait
        if (attempt === maxAttempts) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(
          `[PhraseGenerator] Retrying all groups in ${delayMs}ms...`
        );
        
        await this.sleep(delayMs);
      }
    }

    // All attempts failed
    const errorMessage = 
      `Failed to generate sentences for all groups after ${maxAttempts} attempts. ` +
      `Last error: ${lastError?.message}`;
    
    console.error(`[PhraseGenerator] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  /**
   * Sleep utility for implementing retry delays.
   * 
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
