# Services

This directory contains service layer components that integrate with external APIs and provide business logic.

## TranslationService

The `TranslationService` provides integration with Google Translate API for translating Chinese text to Vietnamese and English.

### Features

- **Single Translation**: Translate individual Chinese texts to Vietnamese or English
- **Batch Translation**: Efficiently translate multiple texts in a single API call
- **Error Handling**: Graceful error handling with descriptive error messages
- **Type Safety**: Full TypeScript support with proper type definitions

### Usage

```typescript
import { translationService } from './services';

// Translate to Vietnamese
const vietnamese = await translationService.translateToVietnamese('你好');
// Result: "Xin chào"

// Translate to English
const english = await translationService.translateToEnglish('你好');
// Result: "Hello"

// Batch translate multiple texts
const texts = ['你好', '再见', '谢谢'];
const translations = await translationService.batchTranslate(texts, 'vi');
// Result: ["Xin chào", "Tạm biệt", "Cảm ơn"]
```

### Configuration

The service requires a Google Translate API key to be configured in the environment:

```bash
GOOGLE_TRANSLATE_API_KEY=your_api_key_here
```

### Error Handling

All methods throw descriptive errors when translation fails:

```typescript
try {
  const result = await translationService.translateToVietnamese('你好');
} catch (error) {
  console.error('Translation failed:', error.message);
  // Error message includes context: "Failed to translate to Vietnamese: [reason]"
}
```

### Testing

The service includes comprehensive unit tests covering:
- Successful translations (single and batch)
- Error handling scenarios
- Edge cases (empty strings, special characters, long text)
- API response variations

Run tests with:
```bash
npm test -- TranslationService.test.ts
```

### Implementation Details

- Uses `@google-cloud/translate` v2 API
- Source language is always set to `zh-CN` (Simplified Chinese)
- Batch translation optimizes API usage by sending multiple texts in one request
- Singleton instance exported for application-wide use


## FlashcardEngine

The `FlashcardEngine` manages flashcard presentation logic and vocabulary selection for three learning modes: Chinese→Meanings, English→Chinese, and Vietnamese→Chinese.

### Features

- **Three Flashcard Modes**: Support for different learning approaches
  - Chinese→Meanings: Display Chinese character, reveal all meanings
  - English→Chinese: Display English meaning, reveal Chinese and pinyin
  - Vietnamese→Chinese: Display Vietnamese meaning, reveal Chinese and pinyin
- **Random Selection**: Randomly selects vocabulary from chapter range
- **Chapter Filtering**: Integrates with ChapterFilter for focused learning
- **Stateful Caching**: Caches flashcard data between question and answer reveal

### Usage

```typescript
import { FlashcardEngine, FlashcardMode } from './services';

const username = 'student1';
const chapterRange = { start: 1, end: 5 };

// Get next flashcard for Chinese→Meanings mode
const flashcard = await FlashcardEngine.getNextCard(
  username,
  FlashcardMode.ChineseToMeanings,
  chapterRange
);

console.log(flashcard.question.displayText); // "你好"
console.log(flashcard.question.fieldType);   // "chinese"

// Reveal answer
const answer = await FlashcardEngine.revealAnswer(flashcard.id);
console.log(answer);
// {
//   chinese: "你好",
//   pinyin: "nǐ hǎo",
//   hanVietnamese: "nhĩ hảo",
//   modernVietnamese: "xin chào",
//   englishMeaning: "hello",
//   learningNote: "Common greeting"
// }
```

### Flashcard Modes

#### ChineseToMeanings
- **Question**: Chinese character
- **Answer**: Pinyin, Han Vietnamese, Modern Vietnamese, English meaning, learning note
- **Use Case**: Practice reading comprehension and character recognition

#### EnglishToChinese
- **Question**: English meaning
- **Answer**: Chinese character, pinyin
- **Use Case**: Practice vocabulary recall from English

#### VietnameseToChinese
- **Question**: Modern Vietnamese meaning
- **Answer**: Chinese character, pinyin
- **Use Case**: Practice vocabulary recall from Vietnamese

### API

```typescript
// Get next flashcard
static async getNextCard(
  username: string,
  mode: FlashcardMode,
  chapterRange: ChapterRange
): Promise<Flashcard>

// Reveal answer for flashcard
static async revealAnswer(flashcardId: string): Promise<FlashcardAnswer>

// Clear cached flashcards (for memory management)
static clearCache(): void
```

### Integration with ChapterFilter

The FlashcardEngine integrates with ChapterFilter to:
1. Validate chapter range before generating flashcards
2. Get vocabulary IDs within the specified chapter range
3. Ensure only vocabulary from selected chapters is used

### Error Handling

The service throws descriptive errors for various scenarios:

```typescript
try {
  const flashcard = await FlashcardEngine.getNextCard(username, mode, range);
} catch (error) {
  // Possible errors:
  // - "Invalid chapter range or no vocabulary available"
  // - "No vocabulary found in specified chapter range"
  // - "Selected vocabulary entry not found"
}

try {
  const answer = await FlashcardEngine.revealAnswer(flashcardId);
} catch (error) {
  // Possible error:
  // - "Flashcard not found or expired"
}
```

### Caching Behavior

- Flashcards are cached in memory when generated
- Cache is automatically cleaned up after revealing answer
- Use `clearCache()` to manually clear all cached flashcards
- Prevents memory leaks in long-running applications

### Testing

The service includes comprehensive unit tests covering:
- All three flashcard modes (question formatting and answer reveal)
- Random vocabulary selection
- Error handling (invalid range, no vocabulary, missing entry)
- Cache management (cleanup after reveal, manual clear)
- Integration with ChapterFilter
- Handling of optional fields

Run tests with:
```bash
npm test -- FlashcardEngine.test.ts
```

### Implementation Details

- Uses UUID for unique flashcard IDs
- Stateless service with static methods
- In-memory cache using Map for flashcard state
- Integrates with VocabularyEntryDAO for data access
- Validates chapter range before vocabulary selection


## DatabaseBackupManager

The `DatabaseBackupManager` provides password-protected database backup and restore functionality with data integrity validation.

### Features

- **Password Authentication**: Secure access with password "BoyaChineseBach"
- **Complete Database Export**: Export all vocabulary entries from all users
- **Database Restore**: Import and restore complete database from backup file
- **Data Integrity**: Checksum validation ensures backup file integrity
- **Format Validation**: Comprehensive validation of backup file structure

### Usage

```typescript
import { DatabaseBackupManager } from './services';

const manager = new DatabaseBackupManager();

// Authenticate admin access
const isAuthenticated = manager.authenticate('BoyaChineseBach');
if (!isAuthenticated) {
  throw new Error('Invalid password');
}

// Export database
const backupFile = await manager.exportDatabase();
// backupFile contains: version, exportedAt, vocabularyEntries, checksum

// Validate backup file
const validation = await manager.validateBackupFile(backupFile);
if (!validation.valid) {
  console.error('Invalid backup file:', validation.errors);
}

// Import and restore database
const result = await manager.importDatabase(backupFile);
if (result.success) {
  console.log(`Restored ${result.entriesRestored} entries`);
} else {
  console.error('Restore failed:', result.errors);
}
```

### Backup File Format

```typescript
interface BackupFile {
  version: string;           // Backup format version (currently "1.0")
  exportedAt: Date;          // Export timestamp
  vocabularyEntries: VocabularyEntry[];  // All vocabulary entries
  checksum: string;          // SHA-256 checksum for integrity
}
```

### Security

- Password authentication required for backup/restore operations
- Password: `BoyaChineseBach` (case-sensitive)
- Checksum validation prevents corrupted or tampered backups

### Data Integrity

The service ensures data integrity through:
- **Checksum Validation**: SHA-256 hash of backup data
- **Format Validation**: Validates all required fields in backup file
- **Entry Validation**: Validates each vocabulary entry structure
- **Atomic Restore**: Erases existing data before restoring from backup

### Error Handling

All operations provide detailed error information:

```typescript
// Validation errors
const validation = await manager.validateBackupFile(backupFile);
if (!validation.valid) {
  // validation.errors contains array of specific issues:
  // - "Missing version field"
  // - "Checksum mismatch - backup file may be corrupted"
  // - "Entry 0: Missing id field"
}

// Restore errors
const result = await manager.importDatabase(backupFile);
if (!result.success) {
  // result.errors contains array of error messages
  console.error('Restore failed:', result.errors);
}
```

### Testing

The service includes comprehensive unit tests covering:
- Password authentication (correct/incorrect passwords)
- Database export (all entries, empty database, field preservation)
- Backup file validation (format, checksum, entry structure)
- Database restore (successful restore, error handling)
- Integration scenarios (export/import cycle, multiple users)

Run tests with:
```bash
npm test -- DatabaseBackupManager.test.ts
```

### Implementation Details

- Uses direct database queries for complete data access
- Preserves all fields including timestamps and sharedFrom
- Exports entries ordered by username, chapter, created_at
- Restore operation is atomic: erases all data before importing
- Checksum calculated using SHA-256 hash of JSON-serialized data
