import { translate } from '@vitalets/google-translate-api';

/**
 * Translation Service using Google Translate API (free) with fallback to mock translations
 * Provides methods to translate Chinese text to Vietnamese and English
 */
export class TranslationService {
  private useMock: boolean;

  constructor() {
    this.useMock = false;
    console.log('[Translation] Google Translate (free) initialized');
  }

  /**
   * Mock translation for testing when API is unavailable
   */
  private mockTranslate(text: string, target: 'vi' | 'en'): string {
    if (target === 'vi') {
      return `[Vietnamese translation of: ${text}]`;
    } else {
      return `[English translation of: ${text}]`;
    }
  }

  /**
   * Translate Chinese text to Vietnamese
   */
  async translateToVietnamese(chineseText: string): Promise<string> {
    if (this.useMock) {
      console.log('[Translation] Using mock translation for Vietnamese');
      return this.mockTranslate(chineseText, 'vi');
    }

    try {
      console.log(`[Translation] Translating to Vietnamese: ${chineseText}`);
      
      const result = await translate(chineseText, { from: 'zh-CN', to: 'vi' });
      
      console.log(`[Translation] Vietnamese result: ${result.text}`);
      return result.text;
    } catch (error: any) {
      console.error('[Translation] Google Translate API error (Vietnamese):', error.message);
      console.error('[Translation] Error details:', error);
      console.log('[Translation] Falling back to mock translation');
      this.useMock = true;
      return this.mockTranslate(chineseText, 'vi');
    }
  }

  /**
   * Translate Chinese text to English
   */
  async translateToEnglish(chineseText: string): Promise<string> {
    if (this.useMock) {
      console.log('[Translation] Using mock translation for English');
      return this.mockTranslate(chineseText, 'en');
    }

    try {
      console.log(`[Translation] Translating to English: ${chineseText}`);
      
      const result = await translate(chineseText, { from: 'zh-CN', to: 'en' });
      
      console.log(`[Translation] English result: ${result.text}`);
      return result.text;
    } catch (error: any) {
      console.error('[Translation] Google Translate API error (English):', error.message);
      console.error('[Translation] Error details:', error);
      console.log('[Translation] Falling back to mock translation');
      this.useMock = true;
      return this.mockTranslate(chineseText, 'en');
    }
  }

  /**
   * Batch translate multiple texts to a target language
   */
  async batchTranslate(texts: string[], targetLanguage: 'vi' | 'en'): Promise<string[]> {
    if (texts.length === 0) {
      return [];
    }

    if (this.useMock) {
      return texts.map(text => this.mockTranslate(text, targetLanguage));
    }

    try {
      const translations = await Promise.all(
        texts.map(async (text) => {
          if (targetLanguage === 'vi') {
            return await this.translateToVietnamese(text);
          } else {
            return await this.translateToEnglish(text);
          }
        })
      );
      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      this.useMock = true;
      return texts.map(text => this.mockTranslate(text, targetLanguage));
    }
  }
}

// Export singleton instance
export const translationService = new TranslationService();
