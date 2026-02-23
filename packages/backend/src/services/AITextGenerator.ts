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
  private currentModelName: string = '';
  
  // Model fallback order
  private readonly MODEL_FALLBACK_ORDER = [
    'gemini-flash-latest',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-flash-lite-latest'
  ];

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
    // Model will be selected dynamically with fallback
  }

  /**
   * Try to generate content with model fallback
   * Tries models in order: gemini-flash-latest, gemini-3-flash-preview, gemini-2.5-flash, gemini-flash-lite-latest
   * @param prompt - The prompt to send to the model
   * @returns Promise resolving to the model response
   * @throws Error if all models fail
   */
  private async generateContentWithFallback(prompt: string): Promise<any> {
    this.initialize();
    
    let lastError: Error | null = null;
    
    for (const modelName of this.MODEL_FALLBACK_ORDER) {
      try {
        console.log(`[AITextGenerator] Trying model: ${modelName}`);
        this.model = this.genAI!.getGenerativeModel({ model: modelName });
        this.currentModelName = modelName;
        
        const result = await this.model.generateContent(prompt);
        
        console.log(`[AITextGenerator] Successfully used model: ${modelName}`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`[AITextGenerator] Model ${modelName} failed:`, error.message);
        
        // If it's a quota error (429) or not found (404), try next model
        if (error.status === 429 || error.status === 404) {
          console.log(`[AITextGenerator] Falling back to next model...`);
          continue;
        }
        
        // For other errors, also try fallback
        console.log(`[AITextGenerator] Error with ${modelName}, trying next model...`);
      }
    }
    
    // All models failed
    console.error('[AITextGenerator] All models failed, last error:', lastError);
    throw lastError || new Error('All models failed');
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
      const requiredWords = ['是', '吗', '的', '呢', '也', '这', '去', '有', '你', '我', '他'];
      
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
      const result = await this.generateContentWithFallback(prompt);
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
      console.error('[AITextGenerator] API call failed:', error);
      if (error instanceof Error) {
        console.error('[AITextGenerator] Error message:', error.message);
        console.error('[AITextGenerator] Error stack:', error.stack);
      }
      console.error('[AITextGenerator] Falling back to mock data');
      // Fallback to mock data if API fails
      return this.generateMockText(characters, maxWords);
    }
  }

  /**
   * Generate sentences for multiple vocabulary groups in a single API call
   * This is optimized for the cron job to minimize API calls
   * @param vocabGroupsData - Array of objects containing characters for each vocab group
   *                          Each group should have 4 batches of 300 characters
   * @returns Promise resolving to map of vocabGroupId to array of generated sentences
   * @throws Error if generation fails
   */
  async generateForMultipleGroups(
    vocabGroupsData: Array<{
      vocabGroupId: number;
      batches: string[][]; // 4 batches, each with 300 characters
    }>
  ): Promise<Map<number, GeneratedSentence[]>> {
    // Validate input
    if (vocabGroupsData.length === 0) {
      throw new Error('vocabGroupsData cannot be empty');
    }

    for (const groupData of vocabGroupsData) {
      if (groupData.batches.length !== 4) {
        throw new Error(`Vocab group ${groupData.vocabGroupId} must have exactly 4 batches`);
      }
      for (let i = 0; i < groupData.batches.length; i++) {
        if (groupData.batches[i].length > 300) {
          throw new Error(`Vocab group ${groupData.vocabGroupId} batch ${i + 1} exceeds 300 characters`);
        }
      }
    }

    // Check if we should use mock data
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const useMock = !apiKey || process.env.USE_MOCK_AI === 'true';

    if (useMock) {
      console.log('[AITextGenerator] Using mock data for multiple groups (API key not available or USE_MOCK_AI=true)');
      return this.generateMockForMultipleGroups(vocabGroupsData);
    }

    // Initialize on first use
    this.initialize();

    try {
      console.log('[AITextGenerator] ===== MULTI-GROUP BATCH API REQUEST =====');
      console.log('[AITextGenerator] Number of vocab groups:', vocabGroupsData.length);
      console.log('[AITextGenerator] Total batches:', vocabGroupsData.length * 4);
      console.log('[AITextGenerator] Expected total sentences:', vocabGroupsData.length * 4 * 30);

      // Build the mega prompt for all groups and batches
      let promptSections: string[] = [];
      let sentenceCounter = 1;

      for (const groupData of vocabGroupsData) {
        for (let batchIndex = 0; batchIndex < groupData.batches.length; batchIndex++) {
          const characters = groupData.batches[batchIndex];
          
          // Required grammar words
          const requiredWords = ['是', '吗', '的', '呢', '也', '这', '去', '有'];
          const allCharacters = [...new Set([...characters, ...requiredWords])];
          const uniqueChars = Array.from(new Set(allCharacters));
          const enumeratedList = uniqueChars.map((char, index) => `${index + 1}. ${char}`).join('\n');

          promptSections.push(`
=== GROUP ${groupData.vocabGroupId}, BATCH ${batchIndex + 1} ===
AVAILABLE CHARACTERS:
${enumeratedList}

Generate 30 sentences using ONLY the characters listed above.
Output format:
SENTENCE_${sentenceCounter}: [sentence]
SENTENCE_${sentenceCounter + 1}: [sentence]
...
SENTENCE_${sentenceCounter + 29}: [sentence]
`);
          sentenceCounter += 30;
        }
      }

      const megaPrompt = `You are a professional Chinese language teacher creating beginner-level reading passages.

CRITICAL RULES:
1. You can ONLY use characters from the "AVAILABLE CHARACTERS" list for each group/batch
2. DO NOT combine characters to create new words not in the list
3. Create REAL, MEANINGFUL sentences with proper grammar
4. Each sentence should be SHORT (maximum 40 characters excluding punctuation)
5. Use simple, common sentence patterns

TASK:
Generate sentences for ${vocabGroupsData.length} vocabulary groups, each with 4 batches.
Total: ${vocabGroupsData.length * 4 * 30} sentences.

${promptSections.join('\n')}

REMEMBER: Create MEANINGFUL sentences with proper grammar, NOT random word lists!`;

      console.log('[AITextGenerator] Mega prompt length:', megaPrompt.length);
      console.log('[AITextGenerator] Sending mega batch request to Gemini API...');

      const startTime = Date.now();
      const result = await this.generateContentWithFallback(megaPrompt);
      const endTime = Date.now();

      console.log('[AITextGenerator] Mega batch API response received in', endTime - startTime, 'ms');

      const response = await result.response;
      const responseText = response.text().trim();

      // Log token usage
      if (response.usageMetadata) {
        console.log('[AITextGenerator] ===== TOKEN USAGE =====');
        console.log('[AITextGenerator] Prompt tokens:', response.usageMetadata.promptTokenCount || 'N/A');
        console.log('[AITextGenerator] Completion tokens:', response.usageMetadata.candidatesTokenCount || 'N/A');
        console.log('[AITextGenerator] Total tokens:', response.usageMetadata.totalTokenCount || 'N/A');
        console.log('[AITextGenerator] =======================');
      }

      console.log('[AITextGenerator] Raw mega batch API response length:', responseText.length);

      // Parse the response to extract sentences
      const sentenceRegex = /SENTENCE_\d+:\s*(.+?)(?=SENTENCE_\d+:|$)/gs;
      const matches = [...responseText.matchAll(sentenceRegex)];

      console.log('[AITextGenerator] Found', matches.length, 'sentence matches');

      // Group sentences by vocab group and batch
      const resultMap = new Map<number, GeneratedSentence[]>();
      let matchIndex = 0;

      for (const groupData of vocabGroupsData) {
        const groupSentences: GeneratedSentence[] = [];

        for (let batchIndex = 0; batchIndex < groupData.batches.length; batchIndex++) {
          const characters = groupData.batches[batchIndex];
          const requiredWords = ['是', '吗', '的', '呢', '也', '这', '去', '有'];
          const allCharacters = [...new Set([...characters, ...requiredWords])];
          const uniqueChars = Array.from(new Set(allCharacters));
          const sortedUniqueChars = [...uniqueChars].sort((a, b) => b.length - a.length);

          // Extract 30 sentences for this batch
          for (let i = 0; i < 30 && matchIndex < matches.length; i++, matchIndex++) {
            const chineseText = matches[matchIndex][1].trim();

            if (!chineseText) {
              console.warn('[AITextGenerator] Skipping empty sentence');
              continue;
            }

            // Extract used characters
            const chineseCharsOnly = chineseText.replace(/[\s\p{P}]/gu, '');
            const usedCharacters: string[] = [];
            let remainingText = chineseCharsOnly;

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
              if (!matched) {
                remainingText = remainingText.slice(1);
              }
            }

            const pinyinText = this.generatePinyin(chineseText);

            groupSentences.push({
              chineseText,
              pinyin: pinyinText,
              usedCharacters
            });
          }
        }

        resultMap.set(groupData.vocabGroupId, groupSentences);
        console.log(`[AITextGenerator] Parsed ${groupSentences.length} sentences for vocab group ${groupData.vocabGroupId}`);
      }

      console.log('[AITextGenerator] ===== END MULTI-GROUP BATCH REQUEST =====');

      return resultMap;
    } catch (error) {
      console.error('[AITextGenerator] Multi-group batch API call failed:', error);
      if (error instanceof Error) {
        console.error('[AITextGenerator] Error message:', error.message);
        console.error('[AITextGenerator] Error stack:', error.stack);
      }
      console.error('[AITextGenerator] Falling back to mock data');
      return this.generateMockForMultipleGroups(vocabGroupsData);
    }
  }

  /**
   * Generate mock sentences for multiple groups (fallback when API fails)
   */
  private generateMockForMultipleGroups(
    vocabGroupsData: Array<{
      vocabGroupId: number;
      batches: string[][];
    }>
  ): Map<number, GeneratedSentence[]> {
    const resultMap = new Map<number, GeneratedSentence[]>();

    for (const groupData of vocabGroupsData) {
      const groupSentences: GeneratedSentence[] = [];

      for (const batch of groupData.batches) {
        const uniqueChars = Array.from(new Set(batch));

        for (let i = 0; i < 30; i++) {
          const startIdx = (i * 5) % uniqueChars.length;
          const selectedChars = uniqueChars.slice(startIdx, startIdx + Math.min(10, uniqueChars.length - startIdx));
          const chineseText = selectedChars.join('') + '。';

          groupSentences.push({
            chineseText,
            pinyin: '[Mock pinyin - API not available]',
            usedCharacters: selectedChars
          });
        }
      }

      resultMap.set(groupData.vocabGroupId, groupSentences);
    }

    return resultMap;
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
      const result = await this.generateContentWithFallback(prompt);
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
      console.error('[AITextGenerator] Batch API call failed:', error);
      if (error instanceof Error) {
        console.error('[AITextGenerator] Error message:', error.message);
        console.error('[AITextGenerator] Error stack:', error.stack);
      }
      console.error('[AITextGenerator] Falling back to mock data');
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
