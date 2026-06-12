import { GoogleGenerativeAI } from '@google/generative-ai';
import pinyin from 'pinyin';
import { TranslationService } from './TranslationService';

/**
 * Generated sentence for batch generation
 */
export interface GeneratedSentence {
  chineseText: string;
  pinyin: string;
  englishMeaning?: string;
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
  private translationService: TranslationService;
  
  // Model fallback order — can be overridden at runtime
  private static _modelFallbackOrder: string[] = [
    'gemini-flash-latest',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-flash-lite-latest'
  ];
  private static _preferredModel: string | null = null;

  // Static config accessors
  static getModelConfig() {
    return {
      preferredModel: AITextGenerator._preferredModel,
      fallbackOrder: [...AITextGenerator._modelFallbackOrder],
      activeOrder: AITextGenerator._preferredModel
        ? [AITextGenerator._preferredModel, ...AITextGenerator._modelFallbackOrder.filter(m => m !== AITextGenerator._preferredModel)]
        : [...AITextGenerator._modelFallbackOrder],
    };
  }

  static setModelConfig({ preferredModel, fallbackOrder }: { preferredModel?: string; fallbackOrder?: string[] }) {
    if (preferredModel !== undefined) {
      AITextGenerator._preferredModel = preferredModel || null;
    }
    if (fallbackOrder !== undefined) {
      AITextGenerator._modelFallbackOrder = fallbackOrder;
    }
    console.log('[AITextGenerator] Model config updated:', AITextGenerator.getModelConfig());
  }

  private get MODEL_FALLBACK_ORDER(): string[] {
    const order = AITextGenerator._preferredModel
      ? [AITextGenerator._preferredModel, ...AITextGenerator._modelFallbackOrder.filter(m => m !== AITextGenerator._preferredModel)]
      : [...AITextGenerator._modelFallbackOrder];
    return order;
  }

  constructor(translationService?: TranslationService) {
    this.translationService = translationService || new TranslationService();
  }

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
  /**
   * Generate sentences for multiple vocabulary groups in a single API call
   * Uses rejection sampling: generates 75 sentences per batch, filters to 30 valid ones
   * This is optimized for the cron job to minimize API calls while ensuring quality
   * @param vocabGroupsData - Array of objects containing characters for each vocab group
   *                          Each group should have 4 batches of 300 characters
   * @returns Promise resolving to map of vocabGroupId to array of generated sentences (up to 30 per batch)
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
      console.log('[AITextGenerator] Target sentences (after rejection sampling):', vocabGroupsData.length * 4 * 30);
      console.log('[AITextGenerator] Generating candidates (75 per batch):', vocabGroupsData.length * 4 * 75);

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

Generate 75 sentences using ONLY the characters listed above.
Output format:
SENTENCE_${sentenceCounter}: [sentence]
SENTENCE_${sentenceCounter + 1}: [sentence]
...
SENTENCE_${sentenceCounter + 74}: [sentence]
`);
          sentenceCounter += 75;
        }
      }

      const megaPrompt = `You are a professional Chinese language teacher creating beginner-level reading passages.

CRITICAL RULES:
1. You can ONLY use characters from the "AVAILABLE CHARACTERS" list for each group/batch
2. DO NOT combine characters to create new words not in the list
3. Create REAL, MEANINGFUL sentences with proper grammar
4. Each sentence should be SHORT (maximum 40 characters excluding punctuation)
5. Use simple, common sentence patterns
6. SPECIAL HANDLING FOR PLACEHOLDERS: If a character contains "。。。" (three dots), you can fill in appropriate content:
   - Example: "太。。。了" → "太冷了", "太热了", "太好了", etc.
   - Example: "很。。。" → "很好", "很冷", "很热", etc.
   - The filled content should use characters from the available list when possible
   - This allows creating natural sentences with common patterns

TASK:
Generate sentences for ${vocabGroupsData.length} vocabulary groups, each with 4 batches.
Total: ${vocabGroupsData.length * 4 * 75} sentences.

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
      // Updated regex to stop at GROUP/BATCH markers or next SENTENCE
      const sentenceRegex = /SENTENCE_\d+:\s*(.+?)(?=\s*(?:===\s*GROUP|SENTENCE_\d+:|$))/gs;
      const matches = [...responseText.matchAll(sentenceRegex)];

      console.log('[AITextGenerator] ===== PARSING RESULTS =====');
      console.log('[AITextGenerator] Total sentence matches found:', matches.length);
      console.log('[AITextGenerator] Expected (75 per batch × 4 batches × 5 groups):', vocabGroupsData.length * 4 * 75);
      console.log('[AITextGenerator] Target after rejection (30 per batch):', vocabGroupsData.length * 4 * 30);
      
      // Write detailed parsing info to file for debugging
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(__dirname, '../../temp/parsing-log.txt');
      let logContent = `===== PARSING RESULTS =====\n`;
      logContent += `Total sentence matches found: ${matches.length}\n`;
      logContent += `Expected (75 per batch × 4 batches × 5 groups): ${vocabGroupsData.length * 4 * 75}\n`;
      logContent += `Target after rejection (30 per batch): ${vocabGroupsData.length * 4 * 30}\n\n`;

      // Group sentences by vocab group and batch
      const resultMap = new Map<number, GeneratedSentence[]>();
      let matchIndex = 0;

      for (const groupData of vocabGroupsData) {
        const groupSentences: GeneratedSentence[] = [];
        console.log(`[AITextGenerator] ----- Processing Vocab Group ${groupData.vocabGroupId} -----`);
        logContent += `----- Processing Vocab Group ${groupData.vocabGroupId} -----\n`;

        for (let batchIndex = 0; batchIndex < groupData.batches.length; batchIndex++) {
          const characters = groupData.batches[batchIndex];
          const requiredWords = ['是', '吗', '的', '呢', '也', '这', '去', '有'];
          const allCharacters = [...new Set([...characters, ...requiredWords])];
          const uniqueChars = Array.from(new Set(allCharacters));
          const sortedUniqueChars = [...uniqueChars].sort((a, b) => b.length - a.length);

          console.log(`[AITextGenerator]   Batch ${batchIndex + 1}: Starting at matchIndex ${matchIndex}`);
          logContent += `  Batch ${batchIndex + 1}: Starting at matchIndex ${matchIndex}\n`;

          // Parse up to 75 sentences for this batch (for rejection sampling)
          const batchCandidates: Array<GeneratedSentence & { invalidCharacters: string[] }> = [];
          
          for (let i = 0; i < 75 && matchIndex < matches.length; i++, matchIndex++) {
            const chineseText = matches[matchIndex][1].trim();

            if (!chineseText) {
              console.warn('[AITextGenerator] Skipping empty sentence');
              continue;
            }

            // Extract used characters and detect invalid ones
            const chineseCharsOnly = chineseText.replace(/[\s\p{P}]/gu, '');
            const usedCharacters: string[] = [];
            const invalidCharacters: string[] = [];
            let remainingText = chineseCharsOnly;

            // Helper function to check if a vocab word with placeholders matches the text
            const matchesWithPlaceholder = (vocabWord: string, text: string): { matches: boolean; length: number; matchedText: string } => {
              if (!vocabWord.includes('。。。')) {
                return { 
                  matches: text.startsWith(vocabWord), 
                  length: vocabWord.length,
                  matchedText: text.startsWith(vocabWord) ? text.substring(0, vocabWord.length) : ''
                };
              }
              
              const escapedWord = vocabWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regexPattern = escapedWord.replace(/。。。/g, '[^，。；？！]+');
              
              const regex = new RegExp(`^${regexPattern}`);
              const match = text.match(regex);
              
              return { 
                matches: match !== null, 
                length: match ? match[0].length : 0,
                matchedText: match ? match[0] : ''
              };
            };

            while (remainingText.length > 0) {
              let matched = false;
              for (const char of sortedUniqueChars) {
                const matchResult = matchesWithPlaceholder(char, remainingText);
                
                if (matchResult.matches) {
                  if (!usedCharacters.includes(char)) {
                    usedCharacters.push(char);
                  }
                  
                  // If this was a placeholder match, also extract vocabulary words from the matched text
                  if (char.includes('。。。') && matchResult.matchedText) {
                    let innerText = matchResult.matchedText;
                    while (innerText.length > 0) {
                      let innerMatched = false;
                      for (const innerChar of sortedUniqueChars) {
                        if (innerChar.includes('。。。')) continue;
                        
                        if (innerText.startsWith(innerChar)) {
                          if (!usedCharacters.includes(innerChar)) {
                            usedCharacters.push(innerChar);
                          }
                          innerText = innerText.slice(innerChar.length);
                          innerMatched = true;
                          break;
                        }
                      }
                      if (!innerMatched) {
                        innerText = innerText.slice(1);
                      }
                    }
                  }
                  
                  remainingText = remainingText.slice(matchResult.length);
                  matched = true;
                  break;
                }
              }
              if (!matched) {
                // Character not in available list - track it
                const invalidChar = remainingText[0];
                if (!invalidCharacters.includes(invalidChar)) {
                  invalidCharacters.push(invalidChar);
                }
                remainingText = remainingText.slice(1);
              }
            }

            const pinyinText = this.generatePinyin(chineseText);

            batchCandidates.push({
              chineseText,
              pinyin: pinyinText,
              usedCharacters,
              invalidCharacters
            });
          }

          // Rejection sampling: filter out sentences with invalid characters
          const validSentences = batchCandidates.filter(s => s.invalidCharacters.length === 0);
          const invalidSentences = batchCandidates.filter(s => s.invalidCharacters.length > 0);

          console.log(`[AITextGenerator]   Batch ${batchIndex + 1} RESULTS:`);
          console.log(`[AITextGenerator]     - Candidates parsed: ${batchCandidates.length}`);
          console.log(`[AITextGenerator]     - Valid sentences: ${validSentences.length}`);
          console.log(`[AITextGenerator]     - Invalid sentences: ${invalidSentences.length}`);
          console.log(`[AITextGenerator]     - Ended at matchIndex: ${matchIndex}`);
          
          logContent += `  Batch ${batchIndex + 1} RESULTS:\n`;
          logContent += `    - Candidates parsed: ${batchCandidates.length}\n`;
          logContent += `    - Valid sentences: ${validSentences.length}\n`;
          logContent += `    - Invalid sentences: ${invalidSentences.length}\n`;
          logContent += `    - Ended at matchIndex: ${matchIndex}\n`;

          // Log invalid sentences for debugging
          if (invalidSentences.length > 0) {
            console.warn(`[AITextGenerator]   ⚠️  Rejected ${invalidSentences.length} sentences with invalid characters:`);
            logContent += `    ⚠️  Rejected ${invalidSentences.length} sentences:\n`;
            invalidSentences.slice(0, 3).forEach(s => {
              console.warn(`[AITextGenerator]       - "${s.chineseText}" [Invalid chars: ${s.invalidCharacters.join(', ')}]`);
              logContent += `      - "${s.chineseText}" [Invalid: ${s.invalidCharacters.join(', ')}]\n`;
            });
            if (invalidSentences.length > 3) {
              console.warn(`[AITextGenerator]       ... and ${invalidSentences.length - 3} more`);
              logContent += `      ... and ${invalidSentences.length - 3} more\n`;
            }
          }

          // Take up to 30 valid sentences
          const selectedSentences = validSentences.slice(0, 30);
          console.log(`[AITextGenerator]     - Selected for storage: ${selectedSentences.length}/30`);
          
          // Remove invalidCharacters property before adding to results
          selectedSentences.forEach(s => {
            delete (s as any).invalidCharacters;
            groupSentences.push(s);
          });

          if (selectedSentences.length < 30) {
            console.warn(`[AITextGenerator]   ⚠️  WARNING: Only ${selectedSentences.length} valid sentences for batch ${batchIndex + 1} (target: 30)`);
          }
        }

        resultMap.set(groupData.vocabGroupId, groupSentences);
        console.log(`[AITextGenerator] Vocab Group ${groupData.vocabGroupId} COMPLETE: ${groupSentences.length} sentences (target: ${groupData.batches.length * 30})`);
        console.log(`[AITextGenerator] ----- End Vocab Group ${groupData.vocabGroupId} -----\n`);
        logContent += `Vocab Group ${groupData.vocabGroupId} COMPLETE: ${groupSentences.length} sentences\n\n`;
      }
      
      // Write log to file
      fs.writeFileSync(logPath, logContent);
      console.log(`[AITextGenerator] Detailed parsing log written to: ${logPath}`);

      console.log('[AITextGenerator] ===== END MULTI-GROUP BATCH REQUEST =====');
      console.log('[AITextGenerator] FINAL SUMMARY:');
      let totalGenerated = 0;
      for (const [groupId, sentences] of resultMap.entries()) {
        totalGenerated += sentences.length;
        console.log(`[AITextGenerator]   Group ${groupId}: ${sentences.length} sentences`);
      }
      console.log(`[AITextGenerator]   TOTAL: ${totalGenerated} sentences (target: ${vocabGroupsData.length * 4 * 30})`);
      console.log('[AITextGenerator] =====================================\n');

      // Translate all sentences to English in batch
      console.log('[AITextGenerator] ===== TRANSLATING SENTENCES TO ENGLISH =====');
      const allSentences: GeneratedSentence[] = [];
      for (const sentences of resultMap.values()) {
        allSentences.push(...sentences);
      }
      
      console.log(`[AITextGenerator] Translating ${allSentences.length} sentences...`);
      const chineseTexts = allSentences.map(s => s.chineseText);
      
      try {
        const translations = await this.translationService.batchTranslate(chineseTexts, 'en');
        
        // Assign translations back to sentences
        let translationIndex = 0;
        for (const sentences of resultMap.values()) {
          for (const sentence of sentences) {
            sentence.englishMeaning = translations[translationIndex++];
          }
        }
        
        console.log('[AITextGenerator] Translation completed successfully');
      } catch (error) {
        console.error('[AITextGenerator] Translation failed:', error);
        console.log('[AITextGenerator] Continuing without translations');
      }
      
      console.log('[AITextGenerator] ===== END TRANSLATION =====');

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
}

// Export singleton instance
export const aiTextGenerator = new AITextGenerator();
