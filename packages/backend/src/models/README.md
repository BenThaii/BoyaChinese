# VocabularyEntry Model

This directory contains the data models and data access layers for the Chinese Learning App backend.

## VocabularyEntry

The `VocabularyEntry` model provides a complete data access layer for managing Chinese vocabulary entries with user isolation.

### Features

- **CRUD Operations**: Create, Read, Update, Delete vocabulary entries
- **User Isolation**: All operations automatically filter by username to ensure data privacy
- **Chapter Filtering**: Query entries by chapter range for focused learning
- **Type Safety**: Full TypeScript interfaces matching the database schema
- **Flexible Updates**: Update any combination of fields with partial updates

### Interfaces

#### VocabularyInput

Input interface for creating or updating vocabulary entries:

```typescript
interface VocabularyInput {
  chineseCharacter: string;      // Required: Chinese written form
  pinyin?: string;                // Optional: Romanized pronunciation
  hanVietnamese?: string;         // Optional: Vietnamese "tiếng Hán" meaning
  modernVietnamese?: string;      // Optional: Contemporary Vietnamese meaning
  englishMeaning?: string;        // Optional: English translation
  learningNote?: string;          // Optional: User notes
  chapter: number;                // Required: Chapter number
}
```

#### VocabularyEntry

Complete vocabulary entry interface with database fields:

```typescript
interface VocabularyEntry extends VocabularyInput {
  id: string;                     // UUID
  username: string;               // Owner username
  pinyin: string;                 // Required in full entry
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  sharedFrom?: string;           // Original username if shared
}
```

### API Methods

#### VocabularyEntryDAO.create()

Create a new vocabulary entry.

```typescript
static async create(
  username: string,
  entry: VocabularyInput
): Promise<VocabularyEntry>
```

**Parameters:**
- `username`: Owner username
- `entry`: Vocabulary entry data

**Returns:** Created vocabulary entry with generated ID and timestamps

**Example:**
```typescript
const entry = await VocabularyEntryDAO.create('john-doe', {
  chineseCharacter: '你好',
  pinyin: 'nǐ hǎo',
  modernVietnamese: 'xin chào',
  englishMeaning: 'hello',
  chapter: 1
});
```

#### VocabularyEntryDAO.findById()

Find a vocabulary entry by ID with user isolation.

```typescript
static async findById(
  username: string,
  id: string
): Promise<VocabularyEntry | null>
```

**Parameters:**
- `username`: Owner username
- `id`: Entry ID

**Returns:** Vocabulary entry or null if not found or belongs to different user

**Example:**
```typescript
const entry = await VocabularyEntryDAO.findById('john-doe', 'entry-uuid');
```

#### VocabularyEntryDAO.findByUsername()

Find all vocabulary entries for a user with optional chapter filtering.

```typescript
static async findByUsername(
  username: string,
  chapterStart?: number,
  chapterEnd?: number
): Promise<VocabularyEntry[]>
```

**Parameters:**
- `username`: Owner username
- `chapterStart`: Optional start chapter (inclusive)
- `chapterEnd`: Optional end chapter (inclusive)

**Returns:** Array of vocabulary entries sorted by chapter and creation date

**Examples:**
```typescript
// Get all entries
const all = await VocabularyEntryDAO.findByUsername('john-doe');

// Get entries in chapters 1-3
const filtered = await VocabularyEntryDAO.findByUsername('john-doe', 1, 3);

// Get entries from chapter 5 onwards
const fromChapter5 = await VocabularyEntryDAO.findByUsername('john-doe', 5);

// Get entries up to chapter 2
const upToChapter2 = await VocabularyEntryDAO.findByUsername('john-doe', undefined, 2);
```

#### VocabularyEntryDAO.update()

Update a vocabulary entry with user isolation.

```typescript
static async update(
  username: string,
  id: string,
  updates: Partial<VocabularyInput>
): Promise<VocabularyEntry | null>
```

**Parameters:**
- `username`: Owner username
- `id`: Entry ID
- `updates`: Partial updates to apply (any combination of fields)

**Returns:** Updated vocabulary entry or null if not found or belongs to different user

**Example:**
```typescript
const updated = await VocabularyEntryDAO.update('john-doe', 'entry-uuid', {
  englishMeaning: 'hi, hello',
  learningNote: 'Most common greeting'
});
```

#### VocabularyEntryDAO.delete()

Delete a vocabulary entry with user isolation.

```typescript
static async delete(
  username: string,
  id: string
): Promise<boolean>
```

**Parameters:**
- `username`: Owner username
- `id`: Entry ID

**Returns:** True if deleted, false if not found or belongs to different user

**Example:**
```typescript
const deleted = await VocabularyEntryDAO.delete('john-doe', 'entry-uuid');
```

#### VocabularyEntryDAO.getChapters()

Get all unique chapters for a user.

```typescript
static async getChapters(
  username: string
): Promise<number[]>
```

**Parameters:**
- `username`: Owner username

**Returns:** Array of chapter numbers sorted in ascending order

**Example:**
```typescript
const chapters = await VocabularyEntryDAO.getChapters('john-doe');
// Returns: [1, 2, 3, 5]
```

#### VocabularyEntryDAO.countByChapter()

Count vocabulary entries for a user in a specific chapter.

```typescript
static async countByChapter(
  username: string,
  chapter: number
): Promise<number>
```

**Parameters:**
- `username`: Owner username
- `chapter`: Chapter number

**Returns:** Count of entries in the chapter

**Example:**
```typescript
const count = await VocabularyEntryDAO.countByChapter('john-doe', 1);
// Returns: 25
```

### User Isolation

All methods enforce user isolation by filtering queries with the username parameter. This ensures:

- Users can only access their own vocabulary entries
- Users cannot view, update, or delete other users' entries
- No authentication is required at the data layer (handled by API layer)

### Database Schema

The model maps to the `vocabulary_entries` table:

```sql
CREATE TABLE vocabulary_entries (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  chinese_character VARCHAR(10) NOT NULL,
  pinyin VARCHAR(255) NOT NULL,
  han_vietnamese TEXT,
  modern_vietnamese TEXT,
  english_meaning TEXT,
  learning_note TEXT,
  chapter INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  shared_from VARCHAR(255),
  INDEX idx_username_chapter (username, chapter),
  INDEX idx_chapter (chapter)
);
```

### Testing

Tests are located in `VocabularyEntry.test.ts` and require a running MySQL database with the schema set up.

To run tests:
1. Ensure MySQL is running
2. Create the database: `CREATE DATABASE chinese_learning_app`
3. Configure `.env` file with database credentials
4. Run: `npm test`

### Usage Examples

See `VocabularyEntry.example.ts` for comprehensive usage examples.

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **2.1-2.8**: Store all vocabulary entry fields (Chinese character, pinyin, English, Han Vietnamese, Modern Vietnamese, learning note, chapter, username)
- **4.3**: User isolation filtering for all queries
- **11.3**: Update vocabulary entries (edit all fields)
- **11.4**: Save changes to vocabulary entries
