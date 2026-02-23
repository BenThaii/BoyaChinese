/**
 * Text Comprehension API Routes
 * 
 * Provides REST API endpoints for text comprehension functionality:
 * - GET /api/:username/comprehension/generate - Generate reading comprehension text
 * - GET /api/:username/comprehension/character-info - Get character details
 */

import { Router, Request, Response } from 'express';
import { aiTextGenerator } from '../services/AITextGenerator';
import { ChapterFilter, ChapterRange } from '../services/ChapterFilter';
import { VocabularyEntryDAO } from '../models/VocabularyEntry';

const router = Router();

/**
 * Cache for generated texts with TTL
 */
interface GeneratedTextCache {
  id: string;
  username: string;
  chapterRange: ChapterRange;
  chineseText: string;
  pinyin: string;
  wordCount: number;
  characterDetails: Map<string, any>;
  generatedAt: Date;
  expiresAt: Date;
}

// In-memory cache with TTL (5 minutes)
const textCache = new Map<string, GeneratedTextCache>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clean expired cache entries
 */
function cleanExpiredCache() {
  const now = new Date();
  for (const [key, value] of textCache.entries()) {
    if (value.expiresAt < now) {
      textCache.delete(key);
    }
  }
}

// Clean cache every minute
const cacheCleanupInterval = setInterval(cleanExpiredCache, 60 * 1000);

/**
 * Clear cache and stop cleanup interval (for testing)
 */
export function clearCache() {
  textCache.clear();
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
  }
}

/**
 * Generate cache key for text generation
 */
function generateCacheKey(username: string, chapterRange: ChapterRange): string {
  return `${username}:${chapterRange.start}-${chapterRange.end}`;
}

/**
 * GET /api/:username/comprehension/generate
 * 
 * Generate reading comprehension text using vocabulary from chapter range
 * 
 * Query Parameters:
 * - chapterStart: number (required)
 * - chapterEnd: number (required)
 * 
 * Response:
 * - 200: Generated text object with chineseText, pinyin, wordCount
 * - 400: Invalid parameters
 * - 404: No vocabulary found
 * - 500: Server error
 */
router.get('/:username/comprehension/generate', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { chapterStart, chapterEnd } = req.query;

    console.log(`[Comprehension] Generate request for user: ${username}, chapters: ${chapterStart}-${chapterEnd}`);

    // Validate username
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid username' 
      });
    }

    // Validate chapter range
    if (!chapterStart || !chapterEnd) {
      return res.status(400).json({ 
        error: 'chapterStart and chapterEnd parameters are required' 
      });
    }

    const start = parseInt(chapterStart as string, 10);
    const end = parseInt(chapterEnd as string, 10);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ 
        error: 'chapterStart and chapterEnd must be valid numbers' 
      });
    }

    if (start < 1 || end < 1) {
      return res.status(400).json({ 
        error: 'Chapter numbers must be positive integers' 
      });
    }

    if (start > end) {
      return res.status(400).json({ 
        error: 'chapterStart must be less than or equal to chapterEnd' 
      });
    }

    const chapterRange: ChapterRange = { start, end };

    // DISABLE CACHE - Always generate new sentences
    // Check cache first
    // const cacheKey = generateCacheKey(username, chapterRange);
    // const cached = textCache.get(cacheKey);
    
    // if (cached && cached.expiresAt > new Date()) {
    //   console.log('[Comprehension] Returning cached result');
    //   return res.json({
    //     chineseText: cached.chineseText,
    //     pinyin: cached.pinyin,
    //     wordCount: cached.wordCount,
    //     cached: true
    //   });
    // }

    // Validate chapter range has vocabulary
    console.log('[Comprehension] Validating chapter range...');
    const isValid = await ChapterFilter.validateRange(username, chapterRange);
    if (!isValid) {
      console.log('[Comprehension] No vocabulary found in chapter range');
      return res.status(404).json({ 
        error: 'No vocabulary found in specified chapter range' 
      });
    }

    // Get random characters from chapter range (max 300)
    console.log('[Comprehension] Getting random characters...');
    const characters = await ChapterFilter.getRandomCharacters(username, chapterRange, 300);
    console.log(`[Comprehension] Got ${characters.length} characters`);

    if (characters.length === 0) {
      return res.status(404).json({ 
        error: 'No vocabulary found in specified chapter range' 
      });
    }

    // Generate text using AI
    console.log('[Comprehension] Calling AI text generator...');
    const generatedText = await aiTextGenerator.generateText(characters, 40);
    console.log(`[Comprehension] Generated text: ${generatedText.chineseText.substring(0, 50)}...`);

    // Build character details map for quick lookup
    const characterDetails = new Map<string, any>();
    const uniqueChars = Array.from(new Set(generatedText.chineseText.split('')));
    
    for (const char of uniqueChars) {
      // Skip whitespace and punctuation
      if (/[\s\p{P}]/u.test(char)) {
        continue;
      }
      
      // Find vocabulary entry for this character
      const entries = await VocabularyEntryDAO.findByUsername(username);
      const entry = entries.find(e => e.chineseCharacter === char);
      
      if (entry) {
        characterDetails.set(char, {
          chineseCharacter: entry.chineseCharacter,
          pinyin: entry.pinyin,
          hanVietnamese: entry.hanVietnamese,
          modernVietnamese: entry.modernVietnamese,
          englishMeaning: entry.englishMeaning,
          learningNote: entry.learningNote
        });
      }
    }

    // DISABLE CACHE - Don't cache results so each request generates new sentence
    // Cache the generated text
    // const now = new Date();
    // const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);
    
    // textCache.set(cacheKey, {
    //   id: cacheKey,
    //   username,
    //   chapterRange,
    //   chineseText: generatedText.chineseText,
    //   pinyin: generatedText.pinyin,
    //   wordCount: generatedText.wordCount,
    //   characterDetails,
    //   generatedAt: now,
    //   expiresAt
    // });

    console.log('[Comprehension] Success! Returning generated text');
    res.json({
      chineseText: generatedText.chineseText,
      pinyin: generatedText.pinyin,
      wordCount: generatedText.wordCount,
      usedCharacters: generatedText.usedCharacters,
      cached: false
    });
  } catch (error) {
    console.error('[Comprehension] Error generating comprehension text:', error);
    
    if (error instanceof Error) {
      console.error('[Comprehension] Error message:', error.message);
      console.error('[Comprehension] Error stack:', error.stack);
      
      if (error.message.includes('No vocabulary found') || 
          error.message.includes('Invalid chapter range')) {
        return res.status(404).json({ 
          error: error.message 
        });
      }
      
      // Return more detailed error message
      return res.status(500).json({ 
        error: 'Failed to generate comprehension text',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate comprehension text' 
    });
  }
});

/**
 * GET /api/:username/comprehension/generate-batch
 * 
 * Generate multiple reading comprehension sentences using vocabulary from chapter range
 * 
 * Query Parameters:
 * - chapterStart: number (required)
 * - chapterEnd: number (required)
 * - count: number (optional, default 30, max 50)
 * 
 * Response:
 * - 200: Array of generated sentences with chineseText, pinyin, usedCharacters
 * - 400: Invalid parameters
 * - 404: No vocabulary found
 * - 500: Server error
 */
router.get('/:username/comprehension/generate-batch', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { chapterStart, chapterEnd, count } = req.query;

    console.log(`[Comprehension Batch] Generate request for user: ${username}, chapters: ${chapterStart}-${chapterEnd}, count: ${count || 30}`);

    // Validate username
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid username' 
      });
    }

    // Validate chapter range
    if (!chapterStart || !chapterEnd) {
      return res.status(400).json({ 
        error: 'chapterStart and chapterEnd parameters are required' 
      });
    }

    const start = parseInt(chapterStart as string, 10);
    const end = parseInt(chapterEnd as string, 10);
    const sentenceCount = count ? parseInt(count as string, 10) : 30;

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ 
        error: 'chapterStart and chapterEnd must be valid numbers' 
      });
    }

    if (start < 1 || end < 1) {
      return res.status(400).json({ 
        error: 'Chapter numbers must be positive integers' 
      });
    }

    if (start > end) {
      return res.status(400).json({ 
        error: 'chapterStart must be less than or equal to chapterEnd' 
      });
    }

    if (isNaN(sentenceCount) || sentenceCount < 1 || sentenceCount > 50) {
      return res.status(400).json({ 
        error: 'count must be between 1 and 50' 
      });
    }

    const chapterRange: ChapterRange = { start, end };

    // Validate chapter range has vocabulary
    console.log('[Comprehension Batch] Validating chapter range...');
    const isValid = await ChapterFilter.validateRange(username, chapterRange);
    if (!isValid) {
      console.log('[Comprehension Batch] No vocabulary found in chapter range');
      return res.status(404).json({ 
        error: 'No vocabulary found in specified chapter range' 
      });
    }

    // Get random characters from chapter range (max 300)
    console.log('[Comprehension Batch] Getting random characters...');
    const characters = await ChapterFilter.getRandomCharacters(username, chapterRange, 300);
    console.log(`[Comprehension Batch] Got ${characters.length} characters`);

    if (characters.length === 0) {
      return res.status(404).json({ 
        error: 'No vocabulary found in specified chapter range' 
      });
    }

    // Generate multiple sentences using AI
    console.log(`[Comprehension Batch] Calling AI text generator for ${sentenceCount} sentences...`);
    const generatedSentences = await aiTextGenerator.generateMultipleSentences(characters, sentenceCount);
    console.log(`[Comprehension Batch] Generated ${generatedSentences.length} sentences`);

    console.log('[Comprehension Batch] Success! Returning generated sentences');
    res.json(generatedSentences);
  } catch (error) {
    console.error('[Comprehension Batch] Error generating comprehension sentences:', error);
    
    if (error instanceof Error) {
      console.error('[Comprehension Batch] Error message:', error.message);
      console.error('[Comprehension Batch] Error stack:', error.stack);
      
      if (error.message.includes('No vocabulary found') || 
          error.message.includes('Invalid chapter range')) {
        return res.status(404).json({ 
          error: error.message 
        });
      }
      
      // Return more detailed error message
      return res.status(500).json({ 
        error: 'Failed to generate comprehension sentences',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate comprehension sentences' 
    });
  }
});

/**
 * GET /api/:username/comprehension/character-info
 * 
 * Get detailed information for a specific Chinese character
 * 
 * Query Parameters:
 * - character: string (required) - Single Chinese character
 * 
 * Response:
 * - 200: Character details object
 * - 400: Invalid parameters
 * - 404: Character not found
 * - 500: Server error
 */
router.get('/:username/comprehension/character-info', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { character } = req.query;

    // Validate username
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid username' 
      });
    }

    // Validate character parameter
    if (!character || typeof character !== 'string') {
      return res.status(400).json({ 
        error: 'character parameter is required' 
      });
    }

    if (character.length === 0) {
      return res.status(400).json({ 
        error: 'character cannot be empty' 
      });
    }

    // Find vocabulary entry for this character (can be single or multi-character)
    const entries = await VocabularyEntryDAO.findByUsername(username);
    const entry = entries.find(e => e.chineseCharacter === character);

    if (!entry) {
      return res.status(404).json({ 
        error: 'Character not found in vocabulary' 
      });
    }

    res.json({
      chineseCharacter: entry.chineseCharacter,
      pinyin: entry.pinyin,
      hanVietnamese: entry.hanVietnamese,
      modernVietnamese: entry.modernVietnamese,
      englishMeaning: entry.englishMeaning,
      isFavorite: entry.isFavorite,
      learningNote: entry.learningNote,
      chapter: entry.chapter
    });
  } catch (error) {
    console.error('Error getting character info:', error);
    res.status(500).json({ 
      error: 'Failed to get character information' 
    });
  }
});

export default router;
