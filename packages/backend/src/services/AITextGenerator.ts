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
 * Generated sentence for batch generation (simplified version without wordCount)
 */
export interface GeneratedSentence {
  chineseText: string;
  pinyin: string;
  usedCharacters: string[];
}

/**
 * AI Text Generator for Google AI Studio API integration
 * Generates reading comprehension texts using specified Chinese characters
 */
export interface GeneratedSentence {
  chineseText: string;
  pinyin: string;
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

    // this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    // console.log('[AITextGenerator] Initialized successfully with model: Gemini 2.5 Flash');

    
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
      // Required grammar words that should always be available
      const requiredWords = ['是', '吗', '的', '呢', '也', '这', '去', '有'];
      
      // Merge user characters with required words, removing duplicates
      const allCharacters = [...new Set([...characters, ...requiredWords])];
      
      // Create unique character list with enumeration
      const uniqueChars = Array.from(new Set(allCharacters));
      
      // Create enumerated list for the prompt
      const enumeratedList = uniqueChars.map((char, index) => `${index + 1}. ${char}`).join('\n');

      console.log('[AITextGenerator] ===== API REQUEST =====');
      console.log('[AITextGenerator] Number of user characters:', characters.length);
      console.log('[AITextGenerator] Number of required words added:', requiredWords.filter(w => !characters.includes(w)).length);
      console.log('[AITextGenerator] Total unique characters:', uniqueChars.length);
      console.log('[AITextGenerator] Enumerated list preview:', enumeratedList.substring(0, 200) + (enumeratedList.length > 200 ? '...' : ''));
      console.log('[AITextGenerator] Max words:', maxWords);

      // Construct prompt for AI with enumeration
      const prompt = `You are a professional Chinese language teacher creating beginner-level reading passages.

AVAILABLE CHARACTERS (YOU MUST USE ONLY THESE):
${enumeratedList}

CRITICAL RULE: You can ONLY use the exact characters listed above. DO NOT create new words by combining characters. DO NOT use any character not in this list.


TASK:
Create a SHORT, NATURAL Chinese reading passage.

CRITICAL: DO NOT just list random words! You MUST create REAL, MEANINGFUL sentences with proper grammar!

STRICT REQUIREMENTS:

1. only write one sentence
2. The sentence should connect logically and tell a simple story.
3. Maximum total characters: ${maxWords} (excluding punctuation).
5. You may use punctuations


FORBIDDEN PATTERNS:
- DO NOT combine characters to create new words not in the list
- DO NOT use characters not in the enumerated list (including measure words like 本, 个, 只 unless they're in the list)
- DO NOT just list random words without grammar (WRONG: 十就是我们电影院早东南 ❌)

NATURALNESS RULES:
1. Use simple, common sentence patterns, avoid complex grammar structures
2. Make sure sentences sound natural when read aloud
3. NEVER output random word lists - always create proper sentences with meaning!


SELF-CHECK BEFORE SUBMITTING:
1. Is every character in my sentence found in the numbered list above?
2. Are my sentences grammatically complete and natural?
3. Does the meaning of the sentence make sense?
8. Did I create REAL sentences with meaning, NOT just a random list of words?

OUTPUT FORMAT:

NUMBERS: [comma-separated indices of characters used, in order, excluding punctuation]
SENTENCE: [the Chinese passage with punctuation]

Example:
If the list has: 1.我 2.是 3.学生 4.他 5.很 6.好
And you write: 我是学生。他很好。
Then output:
NUMBERS: 1,2,3,4,5,6
SENTENCE: 我是学生。他很好。

REMEMBER: Create MEANINGFUL sentences with proper grammar, NOT random word lists!`;

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
        // Extract numbers for validation
        const numbers = numbersMatch[1]
          .split(',')
          .map((n: string) => parseInt(n.trim()))
          .filter((n: number) => !isNaN(n) && n > 0 && n <= uniqueChars.length);

        console.log('[AITextGenerator] Extracted numbers:', numbers);

        // If we have a sentence match, use it to preserve punctuation
        if (sentenceMatch && sentenceMatch[1]) {
          chineseText = sentenceMatch[1].trim();
          console.log('[AITextGenerator] Using sentence with punctuation:', chineseText);
        } else {
          // Reconstruct sentence from numbers (without punctuation)
          chineseText = numbers.map((num: number) => uniqueChars[num - 1]).join('');
          console.log('[AITextGenerator] Using reconstructed text without punctuation:', chineseText);
        }
      } else if (sentenceMatch && sentenceMatch[1]) {
        // Fallback: use the sentence directly if numbers not found
        chineseText = sentenceMatch[1].trim();
        console.log('[AITextGenerator] Using sentence directly (no numbers found):', chineseText);
        console.warn('[AITextGenerator] WARNING: No NUMBERS found in response, used characters may be inaccurate');
      } else {
        // Last fallback: use entire response
        chineseText = responseText;
        console.log('[AITextGenerator] Using entire response as fallback:', chineseText);
        console.warn('[AITextGenerator] WARNING: No structured response, used characters may be inaccurate');
      }

      // ALWAYS extract used characters from the actual Chinese text, not from NUMBERS
      // This ensures accuracy even if AI provides incorrect indices
      const chineseCharsOnly = chineseText.replace(/[\s\p{P}]/gu, '');
      
      // Find all vocabulary items (single or multi-character) that appear in the text
      // Sort by length (longest first) to match multi-character words before single characters
      const sortedUniqueChars = [...uniqueChars].sort((a, b) => b.length - a.length);
      
      usedCharacters = [];
      let remainingText = chineseCharsOnly;
      
      // Greedy matching: match longest words first
      while (remainingText.length > 0) {
        let matched = false;
        
        for (const char of sortedUniqueChars) {
          if (remainingText.startsWith(char)) {
            if (!usedCharacters.includes(char)) {
              usedCharacters.push(char);
            }
            remainingText = remainingText.slice(char.length);
            matched = true;
            break;
          }
        }
        
        // If no match found, skip this character (it might be punctuation or invalid)
        if (!matched) {
          remainingText = remainingText.slice(1);
        }
      }
      
      console.log('[AITextGenerator] Used characters extracted from text:', usedCharacters);

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
        
        // Recalculate used characters from the truncated text
        const truncatedCharsOnly = truncatedText.replace(/[\s\p{P}]/gu, '');
        const sortedUniqueChars = [...uniqueChars].sort((a, b) => b.length - a.length);
        
        const truncatedUsedCharacters: string[] = [];
        let remainingText = truncatedCharsOnly;
        
        while (remainingText.length > 0) {
          let matched = false;
          
          for (const char of sortedUniqueChars) {
            if (remainingText.startsWith(char)) {
              if (!truncatedUsedCharacters.includes(char)) {
                truncatedUsedCharacters.push(char);
              }
              remainingText = remainingText.slice(char.length);
              matched = true;
              break;
            }
          }
          
          if (!matched) {
            remainingText = remainingText.slice(1);
          }
        }
        
        return {
          chineseText: truncatedText,
          pinyin: pinyinText,
          wordCount: truncatedWordCount,
          usedCharacters: truncatedUsedCharacters
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
   * Generate multiple sentences in a single API call for batch processing
   * @param characters - Array of Chinese characters to use (max 300)
   * @param count - Number of sentences to generate (default 30)
   * @returns Promise resolving to array of generated sentences with pinyin and used characters
   * @throws Error if generation fails or constraints are violated
   */
  async generateMultipleSentences(characters: string[], count: number = 30): Promise<GeneratedSentence[]> {
    // Validate input constraints
    if (characters.length === 0) {
      throw new Error('Characters array cannot be empty');
    }

    if (characters.length > 300) {
      throw new Error('Characters array exceeds maximum limit of 300');
    }

    if (count <= 0 || count > 50) {
      throw new Error('count must be between 1 and 50');
    }

    // Check if we should use mock data
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const useMock = !apiKey || process.env.USE_MOCK_AI === 'true';

    if (useMock) {
      console.log('[AITextGenerator] Using mock data for multiple sentences (API key not available or USE_MOCK_AI=true)');
      return this.generateMockMultipleSentences(characters, count);
    }

    // Initialize on first use
    this.initialize();
    
    try {
      // Required grammar words that should always be available
      const requiredWords = ['是', '吗', '的', '呢', '也', '这', '去', '有'];
      
      // Merge user characters with required words, removing duplicates
      const allCharacters = [...new Set([...characters, ...requiredWords])];
      
      // Create unique character list with enumeration
      const uniqueChars = Array.from(new Set(allCharacters));
      
      // Create enumerated list for the prompt
      const enumeratedList = uniqueChars.map((char, index) => `${index + 1}. ${char}`).join('\n');

      console.log('[AITextGenerator] ===== BATCH API REQUEST =====');
      console.log('[AITextGenerator] Number of user characters:', characters.length);
      console.log('[AITextGenerator] Number of required words added:', requiredWords.filter(w => !characters.includes(w)).length);
      console.log('[AITextGenerator] Total unique characters:', uniqueChars.length);
      console.log('[AITextGenerator] Requested sentence count:', count);

      // Construct prompt for AI to generate multiple sentences
      const prompt = `You are a professional Chinese language teacher creating beginner-level reading passages.

AVAILABLE CHARACTERS (YOU MUST USE ONLY THESE):
${enumeratedList}

CRITICAL RULE: You can ONLY use the exact characters listed above. DO NOT create new words by combining characters. DO NOT use any character not in this list.

TASK:
Create ${count} SHORT, NATURAL Chinese sentences.

CRITICAL: DO NOT just list random words! You MUST create REAL, MEANINGFUL sentences with proper grammar!

STRICT REQUIREMENTS:
1. Generate EXACTLY ${count} sentences
2. Each sentence should be SHORT (maximum 40 characters excluding punctuation)
3. Each sentence should be MEANINGFUL and grammatically correct
4. Sentences should be DIVERSE - use different characters and patterns
5. You may use punctuation

FORBIDDEN PATTERNS:
- DO NOT combine characters to create new words not in the list
- DO NOT use characters not in the enumerated list
- DO NOT just list random words without grammar

NATURALNESS RULES:
1. Use simple, common sentence patterns
2. Make sure sentences sound natural when read aloud
3. NEVER output random word lists - always create proper sentences with meaning!

OUTPUT FORMAT (CRITICAL - FOLLOW EXACTLY):
For each sentence, output in this format:

SENTENCE_1: [Chinese sentence with punctuation]
SENTENCE_2: [Chinese sentence with punctuation]
...
SENTENCE_${count}: [Chinese sentence with punctuation]

Example for 3 sentences:
SENTENCE_1: 我是学生。
SENTENCE_2: 他很好。
SENTENCE_3: 这是我的书。

REMEMBER: Create ${count} MEANINGFUL sentences with proper grammar, NOT random word lists!`;

      console.log('[AITextGenerator] Prompt length:', prompt.length);
      console.log('[AITextGenerator] Sending batch request to Gemini API...');
      
      const startTime = Date.now();
      const result = await this.model!.generateContent(prompt);
      const endTime = Date.now();
      
      console.log('[AITextGenerator] Batch API response received in', endTime - startTime, 'ms');
      
      const response = await result.response;
      const responseText = response.text().trim();

      // Log token usage if available
      if (response.usageMetadata) {
        console.log('[AITextGenerator] ===== TOKEN USAGE =====');
        console.log('[AITextGenerator] Prompt tokens:', response.usageMetadata.promptTokenCount || 'N/A');
        console.log('[AITextGenerator] Completion tokens:', response.usageMetadata.candidatesTokenCount || 'N/A');
        console.log('[AITextGenerator] Total tokens:', response.usageMetadata.totalTokenCount || 'N/A');
        console.log('[AITextGenerator] =======================');
      }

      console.log('[AITextGenerator] Raw batch API response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

      // Parse the response to extract sentences
      const sentences: GeneratedSentence[] = [];
      const sentenceRegex = /SENTENCE_\d+:\s*(.+?)(?=SENTENCE_\d+:|$)/gs;
      const matches = [...responseText.matchAll(sentenceRegex)];

      console.log('[AITextGenerator] Found', matches.length, 'sentence matches');

      for (const match of matches) {
        const chineseText = match[1].trim();
        
        if (!chineseText) {
          console.warn('[AITextGenerator] Skipping empty sentence');
          continue;
        }

        // Extract used characters from the actual Chinese text
        const chineseCharsOnly = chineseText.replace(/[\s\p{P}]/gu, '');
        
        // Find all vocabulary items that appear in the text
        const sortedUniqueChars = [...uniqueChars].sort((a, b) => b.length - a.length);
        
        const usedCharacters: string[] = [];
        let remainingText = chineseCharsOnly;
        
        // Greedy matching: match longest words first
        while (remainingText.length > 0) {
          let matched = false;
          
          for (const char of sortedUniqueChars) {
            if (remainingText.startsWith(char)) {
              if (!usedCharacters.includes(char)) {
                usedCharacters.push(char);
              }
              remainingText = remainingText.slice(char.length);
              matched = true;
              break;
            }
          }
          
          // If no match found, skip this character
          if (!matched) {
            remainingText = remainingText.slice(1);
          }
        }

        const pinyinText = this.generatePinyin(chineseText);

        sentences.push({
          chineseText,
          pinyin: pinyinText,
          usedCharacters
        });
      }

      console.log('[AITextGenerator] Successfully parsed', sentences.length, 'sentences');
      console.log('[AITextGenerator] ===== END BATCH REQUEST =====');

      // Validate we got the expected number of sentences
      if (sentences.length === 0) {
        throw new Error('No sentences were generated');
      }

      if (sentences.length < count) {
        console.warn(`[AITextGenerator] Generated ${sentences.length} sentences, expected ${count}`);
      }

      return sentences;
    } catch (error) {
      console.error('[AITextGenerator] Batch API call failed, falling back to mock data:', error);
      // Fallback to mock data if API fails
      return this.generateMockMultipleSentences(characters, count);
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
   * Generate mock multiple sentences for testing when API is not available
   * @param characters - Array of Chinese characters to use
   * @param count - Number of sentences to generate
   * @returns Array of mock generated sentences
   */
  private generateMockMultipleSentences(characters: string[], count: number): GeneratedSentence[] {
    const uniqueChars = Array.from(new Set(characters));
    const sentences: GeneratedSentence[] = [];
    
    for (let i = 0; i < count; i++) {
      // Create varied sentences by using different character subsets
      const startIdx = (i * 5) % uniqueChars.length;
      const selectedChars = uniqueChars.slice(startIdx, startIdx + Math.min(10, uniqueChars.length - startIdx));
      const chineseText = selectedChars.join('') + '。';
      
      sentences.push({
        chineseText,
        pinyin: '[Mock pinyin - API not available]',
        usedCharacters: selectedChars
      });
    }
    
    return sentences;
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
