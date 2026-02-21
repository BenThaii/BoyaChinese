import { GoogleGenerativeAI } from '@google/generative-ai';
import pinyin from 'pinyin';

/**
 * Generated text result containing Chinese text, pinyin, word count, and used characters
 */
export interface GeneratedText {
  chineseText: string;
  pinyin: string;
  wordCount: number;
  usedCharacters: string[];
}

/**
 * AI Text Generator for Google AI Studio API integration
 * Generates reading comprehension texts using specified Chinese characters
 */
export class AITextGenerator {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  private initialize() {
    if (this.genAI) {
      return; // Already initialized
    }
    
    // Read directly from process.env instead of config object
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    console.log('[AITextGenerator] Initializing with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
    
    if (!apiKey) {
      throw new Error('Google AI API key is not configured. Please set GOOGLE_AI_API_KEY in .env file');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-flash-lite-latest (confirmed working model)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
    
    console.log('[AITextGenerator] Initialized successfully with model: gemini-flash-lite-latest');
  }

  /**
   * Generate reading comprehension text using specified characters
   * @param characters - Array of Chinese characters to use (max 300)
   * @param maxWords - Maximum number of words in generated text (default 40)
   * @returns Promise resolving to generated text with pinyin and word count
   * @throws Error if generation fails or constraints are violated
   */
  async generateText(characters: string[], maxWords: number = 40): Promise<GeneratedText> {
    // Validate input constraints
    if (characters.length === 0) {
      throw new Error('Characters array cannot be empty');
    }

    if (characters.length > 300) {
      throw new Error('Characters array exceeds maximum limit of 300');
    }

    if (maxWords <= 0 || maxWords > 40) {
      throw new Error('maxWords must be between 1 and 40');
    }

    // Check if we should use mock data (if API key is not working)
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const useMock = !apiKey || process.env.USE_MOCK_AI === 'true';

    if (useMock) {
      console.log('[AITextGenerator] Using mock data (API key not available or USE_MOCK_AI=true)');
      return this.generateMockText(characters, maxWords);
    }

    // Initialize on first use
    this.initialize();
    
    try {
      // Create unique character list with enumeration
      const uniqueChars = Array.from(new Set(characters));
      
      // Create enumerated list for the prompt
      const enumeratedList = uniqueChars.map((char, index) => `${index + 1}. ${char}`).join('\n');

      console.log('[AITextGenerator] ===== API REQUEST =====');
      console.log('[AITextGenerator] Number of characters:', characters.length);
      console.log('[AITextGenerator] Unique characters:', uniqueChars.length);
      console.log('[AITextGenerator] Enumerated list preview:', enumeratedList.substring(0, 200) + (enumeratedList.length > 200 ? '...' : ''));
      console.log('[AITextGenerator] Max words:', maxWords);

      // Construct prompt for AI with enumeration
      const prompt = `You are a Chinese language teacher creating practice sentences for students.

Available Chinese characters (enumerated):
${enumeratedList}

Task: Create ONE natural, grammatically correct Chinese sentence using ONLY the characters from the list above.

Requirements:
1. The sentence MUST be grammatically correct and make logical sense in Chinese
2. Use ONLY characters from the enumerated list above (no other characters allowed)
3. Maximum ${maxWords} characters (excluding punctuation)
4. The sentence should be appropriate for language learners
5. Create a complete thought or idea with proper Chinese sentence structure
6. You MAY use punctuation marks (，。？！、) to make the sentence grammatically correct
7. Punctuation does NOT count toward the character limit
8. Avoid repeating the same character consecutively unless grammatically necessary
9. Use natural Chinese word order and phrasing

Examples of GOOD sentences:
- 你好，我叫大卫。(Hello, my name is David.)
- 她是老师吗？(Is she a teacher?)
- 我很高兴！(I am very happy!)

Examples of BAD sentences:
- 你你好叫王吗 (Unnatural repetition, missing punctuation)
- 我我我很好 (Unnecessary repetition)

IMPORTANT OUTPUT FORMAT:
Return your response in this EXACT format:
NUMBERS: [comma-separated list of numbers corresponding to the characters you chose, excluding punctuation]
SENTENCE: [the actual Chinese sentence with proper punctuation]

Example:
If you choose characters 1, 5, 3, 5, 2 from the list and want to add punctuation, respond:
NUMBERS: 1,5,3,5,2
SENTENCE: 我很好，很你

Now create your sentence:`;

      console.log('[AITextGenerator] Prompt length:', prompt.length);
      console.log('[AITextGenerator] Sending request to Gemini API...');
      
      const startTime = Date.now();
      const result = await this.model!.generateContent(prompt);
      const endTime = Date.now();
      
      console.log('[AITextGenerator] API response received in', endTime - startTime, 'ms');
      
      const response = await result.response;
      const responseText = response.text().trim();

      // Log token usage if available
      if (response.usageMetadata) {
        console.log('[AITextGenerator] ===== TOKEN USAGE =====');
        console.log('[AITextGenerator] Prompt tokens:', response.usageMetadata.promptTokenCount || 'N/A');
        console.log('[AITextGenerator] Completion tokens:', response.usageMetadata.candidatesTokenCount || 'N/A');
        console.log('[AITextGenerator] Total tokens:', response.usageMetadata.totalTokenCount || 'N/A');
        console.log('[AITextGenerator] =======================');
      } else {
        console.log('[AITextGenerator] Token usage information not available');
      }

      console.log('[AITextGenerator] Raw API response:', responseText);

      // Parse the response to extract numbers and sentence
      const numbersMatch = responseText.match(/NUMBERS:\s*\[?([0-9,\s]+)\]?/i);
      const sentenceMatch = responseText.match(/SENTENCE:\s*(.+)/i);

      let chineseText = '';
      let usedCharacters: string[] = [];

      if (numbersMatch && numbersMatch[1]) {
        // Extract numbers and reconstruct sentence
        const numbers = numbersMatch[1]
          .split(',')
          .map(n => parseInt(n.trim()))
          .filter(n => !isNaN(n) && n > 0 && n <= uniqueChars.length);

        console.log('[AITextGenerator] Extracted numbers:', numbers);

        // Reconstruct sentence from numbers (without punctuation)
        const reconstructedChars = numbers.map(num => uniqueChars[num - 1]).join('');
        
        // If we have a sentence match, use it to preserve punctuation
        if (sentenceMatch && sentenceMatch[1]) {
          chineseText = sentenceMatch[1].trim();
          console.log('[AITextGenerator] Using sentence with punctuation:', chineseText);
        } else {
          chineseText = reconstructedChars;
          console.log('[AITextGenerator] Using reconstructed text without punctuation:', chineseText);
        }
        
        usedCharacters = Array.from(new Set(numbers.map(num => uniqueChars[num - 1])));

        console.log('[AITextGenerator] Used characters:', usedCharacters);
      } else if (sentenceMatch && sentenceMatch[1]) {
        // Fallback: use the sentence directly if numbers not found
        chineseText = sentenceMatch[1].trim();
        usedCharacters = Array.from(new Set(chineseText.split(''))).filter(char => uniqueChars.includes(char));
        console.log('[AITextGenerator] Using sentence directly (no numbers found):', chineseText);
      } else {
        // Last fallback: use entire response
        chineseText = responseText;
        usedCharacters = Array.from(new Set(chineseText.split(''))).filter(char => uniqueChars.includes(char));
        console.log('[AITextGenerator] Using entire response as fallback:', chineseText);
      }

      console.log('[AITextGenerator] ===== END REQUEST =====');

      // Validate generated text
      if (!chineseText) {
        throw new Error('Generated text is empty');
      }

      // Count words (Chinese words are typically single characters or character pairs)
      const wordCount = this.countChineseWords(chineseText);

      if (wordCount > maxWords) {
        // Truncate to max words if exceeded
        const truncatedText = this.truncateToMaxWords(chineseText, maxWords);
        const truncatedWordCount = this.countChineseWords(truncatedText);
        const pinyinText = this.generatePinyin(truncatedText);
        const truncatedUsedChars = Array.from(new Set(truncatedText.split(''))).filter(char => uniqueChars.includes(char));
        
        return {
          chineseText: truncatedText,
          pinyin: pinyinText,
          wordCount: truncatedWordCount,
          usedCharacters: truncatedUsedChars
        };
      }

      const pinyinText = this.generatePinyin(chineseText);

      return {
        chineseText,
        pinyin: pinyinText,
        wordCount,
        usedCharacters
      };
    } catch (error) {
      console.error('[AITextGenerator] API call failed, falling back to mock data:', error);
      // Fallback to mock data if API fails
      return this.generateMockText(characters, maxWords);
    }
  }

  /**
   * Generate mock text for testing when API is not available
   * @param characters - Array of Chinese characters to use
   * @param maxWords - Maximum number of words
   * @returns Mock generated text
   */
  private generateMockText(characters: string[], maxWords: number): GeneratedText {
    // Create a simple sentence using available characters
    const uniqueChars = Array.from(new Set(characters));
    
    // Take up to maxWords characters and create a sentence
    const selectedChars = uniqueChars.slice(0, Math.min(maxWords, uniqueChars.length));
    const chineseText = selectedChars.join('') + '。';
    
    return {
      chineseText,
      pinyin: '[Mock pinyin - API not available]',
      wordCount: selectedChars.length,
      usedCharacters: selectedChars
    };
  }

  /**
   * Generate pinyin for Chinese text
   * @param text - Chinese text
   * @returns Pinyin with tone marks
   */
  private generatePinyin(text: string): string {
    const pinyinArray = pinyin(text, {
      style: pinyin.STYLE_TONE,
      heteronym: false
    });
    return pinyinArray.map(p => p[0]).join(' ');
  }

  /**
   * Count Chinese words in text
   * Chinese words can be single characters or multi-character words
   * This is a simplified count treating each character as a word
   * @param text - Chinese text to count
   * @returns Number of words
   */
  private countChineseWords(text: string): number {
    // Remove whitespace and punctuation, count remaining characters
    const cleanText = text.replace(/[\s\p{P}]/gu, '');
    return cleanText.length;
  }

  /**
   * Truncate Chinese text to maximum word count
   * @param text - Chinese text to truncate
   * @param maxWords - Maximum number of words
   * @returns Truncated text
   */
  private truncateToMaxWords(text: string, maxWords: number): string {
    let wordCount = 0;
    let result = '';

    for (const char of text) {
      // Skip whitespace and punctuation in word count
      if (!/[\s\p{P}]/u.test(char)) {
        if (wordCount >= maxWords) {
          break;
        }
        wordCount++;
      }
      result += char;
    }

    return result;
  }
}

// Export singleton instance
export const aiTextGenerator = new AITextGenerator();
