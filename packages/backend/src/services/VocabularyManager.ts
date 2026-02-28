/**
 * VocabularyManager Service
 * 
 * Handles vocabulary CRUD operations with automatic translation for missing fields.
 * Implements user isolation and chapter filtering.
 */

import { VocabularyEntryDAO, VocabularyInput, VocabularyEntry } from '../models/VocabularyEntry';
import { TranslationService } from './TranslationService';
import { ChapterRange } from './ChapterFilter';
import { UserDAO } from '../models/User';
import pinyin from 'pinyin';

/**
 * Translation preview interface for manual translation before save
 */
export interface TranslationPreview {
  pinyin: string;
  modernVietnamese: string;
  englishMeaning: string;
}

/**
 * VocabularyManager class for managing vocabulary entries
 */
export class VocabularyManager {
  private translationService: TranslationService;

  constructor(translationService?: TranslationService) {
    this.translationService = translationService || new TranslationService();
  }

  /**
   * Create new vocabulary entry with automatic translation for missing fields
   * @param username - Owner username
   * @param entry - Vocabulary entry data
   * @returns Created vocabulary entry with translations
   */
  async createEntry(username: string, entry: VocabularyInput): Promise<VocabularyEntry> {
    // Apply automatic translation for missing fields before save
    const entryWithTranslations = await this.applyAutoTranslation(entry) as VocabularyInput;
    
    // Create entry in database
    return await VocabularyEntryDAO.create(username, entryWithTranslations);
  }

  /**
   * Get vocabulary entries for user with optional chapter filtering
   * @param username - Owner username
   * @param chapterRange - Optional chapter range filter
   * @returns Array of vocabulary entries
   */
  async getEntries(username: string, chapterRange?: ChapterRange): Promise<VocabularyEntry[]> {
    if (chapterRange) {
      return await VocabularyEntryDAO.findByUsername(
        username,
        chapterRange.start,
        chapterRange.end
      );
    }
    
    return await VocabularyEntryDAO.findByUsername(username);
  }

  /**
   * Get single vocabulary entry by ID
   * @param username - Owner username
   * @param entryId - Entry ID
   * @returns Vocabulary entry or null if not found
   */
  async getEntry(username: string, entryId: string): Promise<VocabularyEntry | null> {
    return await VocabularyEntryDAO.findById(username, entryId);
  }

  /**
   * Update existing vocabulary entry with automatic translation for missing fields
   * @param username - Owner username
   * @param entryId - Entry ID
   * @param updates - Partial updates to apply
   * @returns Updated vocabulary entry or null if not found
   */
  async updateEntry(
    username: string,
    entryId: string,
    updates: Partial<VocabularyInput>
  ): Promise<VocabularyEntry | null> {
    // Apply automatic translation for missing fields before save
    const updatesWithTranslations = await this.applyAutoTranslation(updates) as Partial<VocabularyInput>;
    
    // Update entry in database
    return await VocabularyEntryDAO.update(username, entryId, updatesWithTranslations);
  }

  /**
   * Delete vocabulary entry
   * @param username - Owner username
   * @param entryId - Entry ID
   * @returns True if deleted, false if not found
   */
  async deleteEntry(username: string, entryId: string): Promise<boolean> {
    return await VocabularyEntryDAO.delete(username, entryId);
  }

  /**
   * Generate translations without saving (for preview)
   * Only generates translations for fields that are blank/undefined
   * @param chineseCharacter - Chinese character to translate
   * @param existingPinyin - Existing pinyin value (if any)
   * @param existingVietnamese - Existing Vietnamese value (if any)
   * @param existingEnglish - Existing English value (if any)
   * @returns Translation preview with pinyin, Vietnamese and English meanings
   */
  async previewTranslations(
    chineseCharacter: string,
    existingPinyin?: string,
    existingVietnamese?: string,
    existingEnglish?: string
  ): Promise<TranslationPreview> {
    const result: TranslationPreview = {
      pinyin: existingPinyin || '',
      modernVietnamese: existingVietnamese || '',
      englishMeaning: existingEnglish || ''
    };

    // Only generate pinyin if not provided
    if (!existingPinyin) {
      const pinyinArray = pinyin(chineseCharacter, {
        style: pinyin.STYLE_TONE,
        heteronym: false
      });
      result.pinyin = pinyinArray.map(p => p[0]).join(' ');
    }

    // Only translate if fields are missing
    const needsVietnamese = !existingVietnamese;
    const needsEnglish = !existingEnglish;

    if (needsVietnamese && needsEnglish) {
      // Translate both in parallel
      const [modernVietnamese, englishMeaning] = await Promise.all([
        this.translationService.translateToVietnamese(chineseCharacter),
        this.translationService.translateToEnglish(chineseCharacter)
      ]);
      result.modernVietnamese = modernVietnamese;
      result.englishMeaning = englishMeaning;
    } else if (needsVietnamese) {
      result.modernVietnamese = await this.translationService.translateToVietnamese(chineseCharacter);
    } else if (needsEnglish) {
      result.englishMeaning = await this.translationService.translateToEnglish(chineseCharacter);
    }

    return result;
  }

  /**
   * Share chapter vocabulary from one user to another
   * Copies all vocabulary entries from source user's chapter to target user
   * Preserves all fields and sets shared_from to source username
   * @param sourceUsername - Username to copy vocabulary from
   * @param targetUsername - Username to copy vocabulary to
   * @param chapter - Chapter number to share
   * @returns Number of entries copied
   */
  async shareChapter(sourceUsername: string, targetUsername: string, chapter: number): Promise<number> {
    // Get all vocabulary entries from source user's chapter
    const sourceEntries = await VocabularyEntryDAO.findByUsername(sourceUsername, chapter, chapter);
    
    if (sourceEntries.length === 0) {
      return 0;
    }

    // Copy each entry to target user
    let copiedCount = 0;
    for (const entry of sourceEntries) {
      const newEntry: VocabularyInput = {
        chineseCharacter: entry.chineseCharacter,
        pinyin: entry.pinyin,
        hanVietnamese: entry.hanVietnamese,
        modernVietnamese: entry.modernVietnamese,
        englishMeaning: entry.englishMeaning,
        learningNote: entry.learningNote,
        chapter: entry.chapter
      };

      // Create entry with shared_from field set to source username
      await VocabularyEntryDAO.createShared(targetUsername, newEntry, sourceUsername);
      copiedCount++;
    }

    return copiedCount;
  }

  /**
   * Get available chapters for a user
   * @param username - Username to get chapters for
   * @returns Array of chapter numbers
   */
  async getAvailableChapters(username: string): Promise<number[]> {
    return await VocabularyEntryDAO.getChapters(username);
  }

  /**
   * Get users who have shared vocabulary for a specific chapter
   * @param chapter - Chapter number
   * @returns Array of usernames who have vocabulary in this chapter
   */
  async getSharedVocabularySources(chapter: number): Promise<string[]> {
    return await VocabularyEntryDAO.getUsersByChapter(chapter);
  }

  /**
   * Get all unique usernames that have vocabulary entries
   * @returns Array of all usernames sorted alphabetically
   */
  async getAllUsers(): Promise<string[]> {
    return await UserDAO.getAllUsers();
  }

  /**
   * Create a new user
   * @param username - Username to create
   */
  async createUser(username: string): Promise<void> {
    await UserDAO.createUser(username);
  }

  /**
   * Delete a user
   * @param username - Username to delete
   * @returns True if deleted, false if not found
   */
  async deleteUser(username: string): Promise<boolean> {
    return await UserDAO.deleteUser(username);
  }

  /**
   * Apply automatic translation for missing fields
   * @param entry - Vocabulary entry or partial updates
   * @returns Entry with translations applied
   * @private
   */
  private async applyAutoTranslation(
    entry: VocabularyInput | Partial<VocabularyInput>
  ): Promise<VocabularyInput | Partial<VocabularyInput>> {
    // Only translate if we have a Chinese character
    if (!entry.chineseCharacter) {
      return entry;
    }

    const result = { ...entry };

    // Generate pinyin if missing
    if (!entry.pinyin) {
      const pinyinArray = pinyin(entry.chineseCharacter, {
        style: pinyin.STYLE_TONE,
        heteronym: false
      });
      result.pinyin = pinyinArray.map(p => p[0]).join(' ');
    }

    const needsVietnamese = entry.modernVietnamese === undefined || entry.modernVietnamese === '';
    const needsEnglish = entry.englishMeaning === undefined || entry.englishMeaning === '';

    // If both fields are provided, no translation needed
    if (!needsVietnamese && !needsEnglish) {
      return result;
    }

    // Translate missing fields
    if (needsVietnamese && needsEnglish) {
      // Translate both in parallel
      const [modernVietnamese, englishMeaning] = await Promise.all([
        this.translationService.translateToVietnamese(entry.chineseCharacter),
        this.translationService.translateToEnglish(entry.chineseCharacter)
      ]);
      result.modernVietnamese = modernVietnamese;
      result.englishMeaning = englishMeaning;
    } else if (needsVietnamese) {
      result.modernVietnamese = await this.translationService.translateToVietnamese(
        entry.chineseCharacter
      );
    } else if (needsEnglish) {
      result.englishMeaning = await this.translationService.translateToEnglish(
        entry.chineseCharacter
      );
    }

    return result;
  }

  /**
   * Toggle favorite status for a vocabulary entry
   * @param username - Owner username
   * @param chineseCharacter - Chinese character to toggle
   * @returns Updated vocabulary entry or null if not found
   */
  async toggleFavorite(username: string, chineseCharacter: string): Promise<VocabularyEntry | null> {
    return await VocabularyEntryDAO.toggleFavorite(username, chineseCharacter);
  }

  async getRandomFavorite(username: string): Promise<VocabularyEntry | null> {
    return await VocabularyEntryDAO.getRandomFavorite(username);
  }

  async getRandomFavoriteByChapters(username: string, chapterStart?: number, chapterEnd?: number): Promise<VocabularyEntry | null> {
    return await VocabularyEntryDAO.getRandomFavoriteByChapters(username, chapterStart, chapterEnd);
  }

  async getRandomByChapters(username: string, chapterStart: number, chapterEnd: number): Promise<VocabularyEntry | null> {
    return await VocabularyEntryDAO.getRandomByChapters(username, chapterStart, chapterEnd);
  }
}

// Export singleton instance
export const vocabularyManager = new VocabularyManager();
