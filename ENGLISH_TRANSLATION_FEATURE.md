# English Translation Feature for Batch Sentence Generation

## Overview
Added automatic English translation for all batch-generated sentences using Google Translate API.

## Changes Made

### 1. Database Schema Updates
- Added `english_meaning` column to `pre_generated_sentences` table
- Migration script: `packages/backend/database/add_english_meaning_column.sql`

### 2. Code Changes

#### AITextGenerator.ts
- Added `TranslationService` dependency injection
- Updated `GeneratedSentence` interface to include `englishMeaning?: string`
- Added batch translation after sentence generation in `generateSentencesForMultipleGroups()`
- Improved character validation logging to detect invalid characters

#### PhraseGeneratorService.ts
- Updated INSERT query to include `english_meaning` column
- Modified sentence storage to save English translations

#### phrases.routes.ts
- Updated SELECT query to retrieve `english_meaning` from database

#### database.ts
- Updated table creation to include `english_meaning` column

### 3. Bug Fixes
- Fixed regex parsing issue that was capturing GROUP/BATCH markers in sentences
- Added validation logging for sentences containing characters not in available list

## How It Works

1. **Sentence Generation**: AI generates Chinese sentences using available characters
2. **Batch Translation**: All generated sentences are translated to English using Google Translate API
3. **Storage**: Sentences are stored with:
   - Chinese text
   - Full pinyin
   - English meaning
   - Used characters
   - Vocab group ID
   - Generation timestamp

## Migration Instructions

### For Existing Databases
Run the migration script to add the column:
```sql
ALTER TABLE pre_generated_sentences 
ADD COLUMN IF NOT EXISTS english_meaning TEXT AFTER pinyin;
```

Or use the provided file:
```bash
mysql -u your_user -p your_database < packages/backend/database/add_english_meaning_column.sql
```

### For New Databases
The column will be created automatically when the database initializes.

## API Response Format

When fetching sentences from `/api/phrases/:vocabGroupId`, the response now includes:
```json
{
  "id": "uuid",
  "vocabGroupId": 1,
  "chineseText": "我们去学校。",
  "pinyin": "wǒ men qù xué xiào.",
  "englishMeaning": "We go to school.",
  "usedCharacters": ["我", "们", "去", "学", "校"],
  "generationTimestamp": "2024-01-01T00:00:00.000Z"
}
```

## Translation Service

Uses Google Cloud Translation API with fallback to mock translations if:
- API key is not configured
- API fails after 3 consecutive attempts
- Translation errors occur

## Testing

To test the feature:
1. Ensure `GOOGLE_TRANSLATE_API_KEY` or `GOOGLE_AI_API_KEY` is set in `.env`
2. Run batch sentence generation
3. Check console logs for translation progress
4. Query sentences to verify English meanings are stored

## Notes

- Translation happens after all sentences are generated (batch operation)
- If translation fails, sentences are still stored without English meanings
- The feature is backward compatible - existing sentences without translations will show `null` for `english_meaning`
