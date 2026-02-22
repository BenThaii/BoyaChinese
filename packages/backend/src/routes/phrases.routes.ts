/**
 * Phrases API Routes
 * 
 * Provides REST API endpoints for pre-generated phrases feature:
 * - GET /api/phrases/vocab-groups - Get all vocab groups with sentence counts
 * - GET /api/phrases/sentences/:vocabGroupId - Get all sentences for a vocab group
 * - GET /api/phrases/character-info/:character - Get character details from vocabulary
 * - POST /api/phrases/generate - Manually trigger sentence generation
 */

import { Router, Request, Response } from 'express';
import { PhraseGeneratorService } from '../services/PhraseGeneratorService';
import { getPool } from '../config/database';
import { RowDataPacket } from 'mysql2';
import { translationService } from '../services/TranslationService';

const router = Router();
const phraseGenerator = new PhraseGeneratorService();

/**
 * GET /api/phrases/vocab-groups
 * 
 * Get all 5 vocab groups with chapter ranges and sentence counts
 * 
 * Response:
 * - 200: Array of vocab groups with id, chapterStart, chapterEnd, sentenceCount
 * - 500: Server error
 */
router.get('/phrases/vocab-groups', async (_req: Request, res: Response) => {
  try {
    // Get vocab groups from PhraseGeneratorService
    const vocabGroups = await phraseGenerator.getVocabGroups();
    
    // Query database to count sentences per group
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT vocab_group_id, COUNT(*) as count 
       FROM pre_generated_sentences 
       GROUP BY vocab_group_id`
    );
    
    // Create a map of vocab_group_id to sentence count
    const sentenceCounts = new Map<number, number>();
    rows.forEach((row) => {
      sentenceCounts.set(row.vocab_group_id, row.count);
    });
    
    // Build response with sentence counts
    const response = vocabGroups.map((group) => ({
      id: group.id,
      chapterStart: group.chapterStart,
      chapterEnd: group.chapterEndpoint,
      sentenceCount: sentenceCounts.get(group.id) || 0
    }));
    
    res.json(response);
  } catch (error) {
    console.error('Error getting vocab groups:', error);
    res.status(500).json({ error: 'Failed to get vocab groups' });
  }
});

/**
 * GET /api/phrases/sentences/:vocabGroupId
 * 
 * Get all sentences for a specific vocab group
 * 
 * Parameters:
 * - vocabGroupId: Integer 1-5 representing the vocab group
 * 
 * Response:
 * - 200: Array of sentences with all fields
 * - 400: Invalid vocabGroupId parameter
 * - 500: Server error
 */
router.get('/phrases/sentences/:vocabGroupId', async (req: Request, res: Response) => {
  try {
    const vocabGroupId = parseInt(req.params.vocabGroupId, 10);
    
    // Validate vocabGroupId (must be 1-5)
    if (isNaN(vocabGroupId) || vocabGroupId < 1 || vocabGroupId > 5) {
      return res.status(400).json({ error: 'Invalid vocabGroupId. Must be between 1 and 5.' });
    }
    
    // Query sentences from database
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, vocab_group_id, chinese_text, pinyin, used_characters, generation_timestamp
       FROM pre_generated_sentences
       WHERE vocab_group_id = ?
       ORDER BY generation_timestamp DESC`,
      [vocabGroupId]
    );
    
    // Format response
    const sentences = rows.map((row) => ({
      id: row.id,
      vocabGroupId: row.vocab_group_id,
      chineseText: row.chinese_text,
      pinyin: row.pinyin,
      // MySQL2 automatically parses JSON columns, so check if it's already an array
      usedCharacters: typeof row.used_characters === 'string' 
        ? JSON.parse(row.used_characters) 
        : row.used_characters,
      generationTimestamp: row.generation_timestamp
    }));
    
    res.json(sentences);
  } catch (error) {
    console.error('Error getting sentences:', error);
    res.status(500).json({ error: 'Failed to get sentences' });
  }
});

/**
 * GET /api/phrases/character-info/:character
 * 
 * Get character details from vocabulary database
 * 
 * Parameters:
 * - character: Chinese character to look up
 * 
 * Response:
 * - 200: Character details (chineseCharacter, pinyin, hanVietnamese, modernVietnamese, englishMeaning)
 * - 404: Character not found
 * - 500: Server error
 */
router.get('/phrases/character-info/:character', async (req: Request, res: Response) => {
  try {
    const character = req.params.character;
    
    // Query vocabulary database for character details
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT chinese_character, pinyin, han_vietnamese, modern_vietnamese, english_meaning
       FROM vocabulary_entries
       WHERE chinese_character = ?
       LIMIT 1`,
      [character]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const row = rows[0];
    const response = {
      chineseCharacter: row.chinese_character,
      pinyin: row.pinyin,
      hanVietnamese: row.han_vietnamese,
      modernVietnamese: row.modern_vietnamese,
      englishMeaning: row.english_meaning
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting character info:', error);
    res.status(500).json({ error: 'Failed to get character info' });
  }
});

/**
 * POST /api/phrases/generate
 * 
 * Manually trigger sentence generation for all vocab groups
 * 
 * Response:
 * - 200: Success status and message
 * - 503: Generation already in progress
 * - 500: Server error
 */
router.post('/phrases/generate', async (_req: Request, res: Response) => {
  try {
    // Trigger generation
    await phraseGenerator.generateAllSentences();
    
    res.json({ 
      success: true, 
      message: 'Sentence generation completed successfully' 
    });
  } catch (error) {
    console.error('Error generating sentences:', error);
    
    // Check if error is due to concurrent generation
    if (error instanceof Error && error.message.includes('already in progress')) {
      return res.status(503).json({ 
        success: false, 
        error: 'Generation already in progress' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate sentences' 
    });
  }
});

/**
 * POST /api/phrases/translate
 * 
 * Translate Chinese text to English
 * 
 * Request body:
 * - text: Chinese text to translate
 * 
 * Response:
 * - 200: { translation: string }
 * - 400: Missing text parameter
 * - 500: Server error
 */
router.post('/phrases/translate', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }
    
    const translation = await translationService.translateToEnglish(text);
    
    res.json({ translation });
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
});

export default router;
