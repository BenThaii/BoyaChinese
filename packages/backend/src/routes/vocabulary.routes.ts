/**
 * Vocabulary API Routes
 * 
 * Provides REST API endpoints for vocabulary management:
 * - GET /api/vocabulary/users - Get all users
 * - GET /api/vocabulary/shared - Get users with shared vocabulary for a chapter
 * - POST /api/:username/vocabulary - Create vocabulary entry
 * - GET /api/:username/vocabulary - Get vocabulary entries with optional chapter filtering
 * - GET /api/:username/vocabulary/chapters - Get available chapters
 * - GET /api/:username/vocabulary/:id - Get single vocabulary entry
 * - PUT /api/:username/vocabulary/:id - Update vocabulary entry
 * - DELETE /api/:username/vocabulary/:id - Delete vocabulary entry
 * - POST /api/:username/vocabulary/translate - Preview translations
 * - POST /api/:username/vocabulary/share - Share chapter vocabulary
 */

import { Router, Request, Response } from 'express';
import { vocabularyManager } from '../services/VocabularyManager';
import { VocabularyInput } from '../models/VocabularyEntry';

const router = Router();

/**
 * GET /api/vocabulary/users
 * 
 * Get all unique usernames that have vocabulary entries
 * Note: This must come before /:username routes to avoid matching "vocabulary" as a username
 */
router.get('/vocabulary/users', async (req: Request, res: Response) => {
  try {
    const usernames = await vocabularyManager.getAllUsers();
    res.json(usernames);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ error: 'Failed to get all users' });
  }
});

/**
 * POST /api/vocabulary/users
 * 
 * Create a new user
 * Note: This must come before /:username routes to avoid matching "vocabulary" as a username
 */
router.post('/vocabulary/users', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({ error: 'username is required' });
    }

    await vocabularyManager.createUser(username.trim());
    res.status(201).json({ username: username.trim(), message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * DELETE /api/vocabulary/users/:username
 * 
 * Delete a user
 * Note: This must come before /:username/vocabulary routes
 */
router.delete('/vocabulary/users/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    const deleted = await vocabularyManager.deleteUser(username);
    
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/vocabulary/shared
 * 
 * Get users who have shared vocabulary for a specific chapter
 * Note: This must come before /:username routes to avoid matching "vocabulary" as a username
 */
router.get('/vocabulary/shared', async (req: Request, res: Response) => {
  try {
    const { chapter } = req.query;

    if (!chapter) {
      return res.status(400).json({ error: 'chapter parameter is required' });
    }

    const chapterNum = parseInt(chapter as string, 10);

    if (isNaN(chapterNum) || chapterNum < 1) {
      return res.status(400).json({ error: 'chapter must be a positive integer' });
    }

    const usernames = await vocabularyManager.getSharedVocabularySources(chapterNum);
    res.json(usernames);
  } catch (error) {
    console.error('Error getting shared vocabulary sources:', error);
    res.status(500).json({ error: 'Failed to get shared vocabulary sources' });
  }
});

/**
 * POST /api/:username/vocabulary/batch
 * 
 * Batch upload multiple Chinese characters with automatic translation
 * Note: This must come before /:username/vocabulary POST route to avoid route conflict
 * 
 * Request body:
 * - characters: string (comma, semicolon, or newline separated Chinese characters)
 * - chapter: number (chapter to assign to all characters)
 * 
 * Response:
 * - 201: Array of created entries with success/failure status
 */
router.post('/:username/vocabulary/batch', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { characters, chapter } = req.body;

    console.log('[Batch Upload] Request from user:', username);
    console.log('[Batch Upload] Characters:', characters);
    console.log('[Batch Upload] Chapter:', chapter);

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    if (!characters || typeof characters !== 'string') {
      return res.status(400).json({ error: 'characters is required' });
    }

    if (!chapter || typeof chapter !== 'number' || chapter < 1) {
      return res.status(400).json({ error: 'chapter must be a positive integer' });
    }

    // Split by comma, semicolon, or newline and clean up
    const charArray = characters
      .split(/[,;，；\n\r]/) // Support both English and Chinese punctuation, plus newlines
      .map(char => char.trim())
      .filter(char => char.length > 0);

    console.log('[Batch Upload] Parsed characters:', charArray.length);

    if (charArray.length === 0) {
      return res.status(400).json({ error: 'No valid characters found' });
    }

    if (charArray.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 characters per batch' });
    }

    console.log('[Batch Upload] Processing in parallel batches...');
    
    // Process in parallel batches of 10 to avoid overwhelming the API
    const BATCH_SIZE = 10;
    const results = [];

    for (let i = 0; i < charArray.length; i += BATCH_SIZE) {
      const batch = charArray.slice(i, i + BATCH_SIZE);
      console.log(`[Batch Upload] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(charArray.length / BATCH_SIZE)}`);
      
      const batchPromises = batch.map(async (char) => {
        try {
          console.log(`[Batch Upload] Processing character: ${char}`);
          
          // Create entry with automatic translation
          const entry = await vocabularyManager.createEntry(username, {
            chineseCharacter: char,
            chapter: chapter
          });

          console.log(`[Batch Upload] ✓ Success: ${char}`);
          return {
            character: char,
            success: true,
            entry: entry
          };
        } catch (error) {
          console.error(`[Batch Upload] ✗ Failed: ${char}`, error);
          return {
            character: char,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[Batch Upload] Complete: ${successCount} success, ${failCount} failed`);

    res.status(201).json({
      total: charArray.length,
      success: successCount,
      failed: failCount,
      results: results
    });
  } catch (error) {
    console.error('Error in batch upload:', error);
    res.status(500).json({ error: 'Failed to process batch upload' });
  }
});

/**
 * POST /api/:username/vocabulary
 * 
 * Create new vocabulary entry with automatic translation for missing fields
 */
router.post('/:username/vocabulary', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const entry: VocabularyInput = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    if (!entry.chineseCharacter || typeof entry.chineseCharacter !== 'string') {
      return res.status(400).json({ error: 'chineseCharacter is required' });
    }

    if (!entry.chapter || typeof entry.chapter !== 'number' || entry.chapter < 1) {
      return res.status(400).json({ error: 'chapter must be a positive integer' });
    }

    const createdEntry = await vocabularyManager.createEntry(username, entry);
    res.status(201).json(createdEntry);
  } catch (error) {
    console.error('Error creating vocabulary entry:', error);
    res.status(500).json({ error: 'Failed to create vocabulary entry' });
  }
});

/**
 * GET /api/:username/vocabulary
 * 
 * Get vocabulary entries with optional chapter filtering
 */
router.get('/:username/vocabulary', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { chapterStart, chapterEnd } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    let chapterRange;
    if (chapterStart && chapterEnd) {
      const start = parseInt(chapterStart as string, 10);
      const end = parseInt(chapterEnd as string, 10);

      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ error: 'chapterStart and chapterEnd must be valid numbers' });
      }

      if (start < 1 || end < 1) {
        return res.status(400).json({ error: 'Chapter numbers must be positive integers' });
      }

      if (start > end) {
        return res.status(400).json({ error: 'chapterStart must be less than or equal to chapterEnd' });
      }

      chapterRange = { start, end };
    }

    const entries = await vocabularyManager.getEntries(username, chapterRange);
    res.json(entries);
  } catch (error) {
    console.error('Error getting vocabulary entries:', error);
    res.status(500).json({ error: 'Failed to get vocabulary entries' });
  }
});

/**
 * GET /api/:username/vocabulary/chapters
 * 
 * Get available chapters for a user
 * Note: This must come before /:id route to avoid matching "chapters" as an ID
 */
router.get('/:username/vocabulary/chapters', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    const chapters = await vocabularyManager.getAvailableChapters(username);
    res.json(chapters);
  } catch (error) {
    console.error('Error getting available chapters:', error);
    res.status(500).json({ error: 'Failed to get available chapters' });
  }
});

/**
 * POST /api/:username/vocabulary/translate
 * 
 * Preview translations for a Chinese character without saving
 * Note: This must come before /:id route to avoid matching "translate" as an ID
 */
router.post('/:username/vocabulary/translate', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { chineseCharacter, pinyin, modernVietnamese, englishMeaning } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    if (!chineseCharacter || typeof chineseCharacter !== 'string') {
      return res.status(400).json({ error: 'chineseCharacter is required' });
    }

    console.log(`Translating character: ${chineseCharacter}`);
    const preview = await vocabularyManager.previewTranslations(
      chineseCharacter,
      pinyin,
      modernVietnamese,
      englishMeaning
    );
    console.log('Translation successful:', preview);
    res.json(preview);
  } catch (error) {
    console.error('Error generating translation preview:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);
    res.status(500).json({ error: `Failed to generate translation preview: ${errorMessage}` });
  }
});

/**
 * POST /api/:username/vocabulary/share
 * 
 * Share chapter vocabulary from another user
 * Note: This must come before /:id route to avoid matching "share" as an ID
 */
router.post('/:username/vocabulary/share', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { sourceUsername, chapter } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    if (!sourceUsername || typeof sourceUsername !== 'string') {
      return res.status(400).json({ error: 'sourceUsername is required' });
    }

    if (!chapter || typeof chapter !== 'number' || chapter < 1) {
      return res.status(400).json({ error: 'chapter must be a positive integer' });
    }

    const copiedCount = await vocabularyManager.shareChapter(sourceUsername, username, chapter);
    res.json({ 
      message: 'Chapter vocabulary shared successfully',
      entriesCopied: copiedCount
    });
  } catch (error) {
    console.error('Error sharing chapter vocabulary:', error);
    res.status(500).json({ error: 'Failed to share chapter vocabulary' });
  }
});

/**
 * GET /api/:username/vocabulary/:id
 * 
 * Get single vocabulary entry by ID
 */
router.get('/:username/vocabulary/:id', async (req: Request, res: Response) => {
  try {
    const { username, id } = req.params;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const entry = await vocabularyManager.getEntry(username, id);

    if (!entry) {
      return res.status(404).json({ error: 'Vocabulary entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error getting vocabulary entry:', error);
    res.status(500).json({ error: 'Failed to get vocabulary entry' });
  }
});

/**
 * PUT /api/:username/vocabulary/:id
 * 
 * Update vocabulary entry with automatic translation for missing fields
 */
router.put('/:username/vocabulary/:id', async (req: Request, res: Response) => {
  try {
    const { username, id } = req.params;
    const updates = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    if (updates.chapter !== undefined) {
      if (typeof updates.chapter !== 'number' || updates.chapter < 1) {
        return res.status(400).json({ error: 'chapter must be a positive integer' });
      }
    }

    const updatedEntry = await vocabularyManager.updateEntry(username, id, updates);

    if (!updatedEntry) {
      return res.status(404).json({ error: 'Vocabulary entry not found' });
    }

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating vocabulary entry:', error);
    res.status(500).json({ error: 'Failed to update vocabulary entry' });
  }
});

/**
 * DELETE /api/:username/vocabulary/:id
 * 
 * Delete vocabulary entry
 */
router.delete('/:username/vocabulary/:id', async (req: Request, res: Response) => {
  try {
    const { username, id } = req.params;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid entry ID' });
    }

    const deleted = await vocabularyManager.deleteEntry(username, id);

    if (!deleted) {
      return res.status(404).json({ error: 'Vocabulary entry not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting vocabulary entry:', error);
    res.status(500).json({ error: 'Failed to delete vocabulary entry' });
  }
});

export default router;
