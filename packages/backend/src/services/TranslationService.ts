import axios from 'axios';

/**
 * Translation Service using LibreTranslate API with fallback to mock translations
 * Provides methods to translate Chinese text to Vietnamese and English
 */
export class TranslationService {
  private apiUrl: string;
  private useMock: boolean;

  constructor() {
    // Use local LibreTranslate instance if available, otherwise use public API
    this.apiUrl = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000/translate';
    this.useMock = false;
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
      console.log(`[Translation] Using LibreTranslate URL: ${this.apiUrl}`);
      
      const response = await axios.post(this.apiUrl, {
        q: chineseText,
        source: 'zh',
        target: 'vi',
        format: 'text'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log(`[Translation] Vietnamese result: ${response.data.translatedText}`);
      return response.data.translatedText;
    } catch (error: any) {
      console.error('[Translation] LibreTranslate API error (Vietnamese):', error.response?.data || error.message);
      console.error('[Translation] Error details:', {
        url: this.apiUrl,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
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
      console.log(`[Translation] Using LibreTranslate URL: ${this.apiUrl}`);
      
      const response = await axios.post(this.apiUrl, {
        q: chineseText,
        source: 'zh',
        target: 'en',
        format: 'text'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log(`[Translation] English result: ${response.data.translatedText}`);
      return response.data.translatedText;
    } catch (error: any) {
      console.error('[Translation] LibreTranslate API error (English):', error.response?.data || error.message);
      console.error('[Translation] Error details:', {
        url: this.apiUrl,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
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
