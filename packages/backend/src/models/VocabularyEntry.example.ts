/**
 * VocabularyEntry Usage Examples
 * 
 * This file demonstrates how to use the VocabularyEntry data access layer.
 * These examples show the API but are not executable tests.
 */

import { VocabularyEntryDAO, VocabularyInput } from './VocabularyEntry';

/**
 * Example 1: Create a new vocabulary entry
 */
async function createVocabularyExample() {
  const username = 'john-doe';
  
  const newEntry: VocabularyInput = {
    chineseCharacter: '你好',
    pinyin: 'nǐ hǎo',
    hanVietnamese: 'nhĩ hảo',
    modernVietnamese: 'xin chào',
    englishMeaning: 'hello',
    learningNote: 'Common greeting in Chinese',
    chapter: 1
  };

  const created = await VocabularyEntryDAO.create(username, newEntry);
  console.log('Created entry:', created);
  // Returns: VocabularyEntry with id, timestamps, and all fields
}

/**
 * Example 2: Find entry by ID with user isolation
 */
async function findByIdExample() {
  const username = 'john-doe';
  const entryId = 'some-uuid';

  const entry = await VocabularyEntryDAO.findById(username, entryId);
  if (entry) {
    console.log('Found entry:', entry);
  } else {
    console.log('Entry not found or belongs to different user');
  }
}

/**
 * Example 3: Get all entries for a user
 */
async function findAllEntriesExample() {
  const username = 'john-doe';

  const entries = await VocabularyEntryDAO.findByUsername(username);
  console.log(`Found ${entries.length} entries for ${username}`);
}

/**
 * Example 4: Filter entries by chapter range
 */
async function filterByChapterExample() {
  const username = 'john-doe';
  const chapterStart = 1;
  const chapterEnd = 3;

  const entries = await VocabularyEntryDAO.findByUsername(
    username,
    chapterStart,
    chapterEnd
  );
  console.log(`Found ${entries.length} entries in chapters ${chapterStart}-${chapterEnd}`);
}

/**
 * Example 5: Update an entry
 */
async function updateEntryExample() {
  const username = 'john-doe';
  const entryId = 'some-uuid';

  const updates = {
    englishMeaning: 'hi, hello',
    learningNote: 'Updated: Most common greeting'
  };

  const updated = await VocabularyEntryDAO.update(username, entryId, updates);
  if (updated) {
    console.log('Updated entry:', updated);
  } else {
    console.log('Entry not found or belongs to different user');
  }
}

/**
 * Example 6: Delete an entry
 */
async function deleteEntryExample() {
  const username = 'john-doe';
  const entryId = 'some-uuid';

  const deleted = await VocabularyEntryDAO.delete(username, entryId);
  if (deleted) {
    console.log('Entry deleted successfully');
  } else {
    console.log('Entry not found or belongs to different user');
  }
}

/**
 * Example 7: Get available chapters for a user
 */
async function getChaptersExample() {
  const username = 'john-doe';

  const chapters = await VocabularyEntryDAO.getChapters(username);
  console.log('Available chapters:', chapters);
  // Returns: [1, 2, 3, 5] (sorted, unique chapter numbers)
}

/**
 * Example 8: Count entries in a chapter
 */
async function countByChapterExample() {
  const username = 'john-doe';
  const chapter = 1;

  const count = await VocabularyEntryDAO.countByChapter(username, chapter);
  console.log(`Chapter ${chapter} has ${count} entries`);
}

/**
 * Example 9: User isolation demonstration
 * 
 * User isolation ensures that users can only access their own vocabulary entries.
 * All methods automatically filter by username.
 */
async function userIsolationExample() {
  const user1 = 'alice';
  const user2 = 'bob';

  // Alice creates an entry
  const aliceEntry = await VocabularyEntryDAO.create(user1, {
    chineseCharacter: '学习',
    pinyin: 'xué xí',
    chapter: 1
  });

  // Bob cannot access Alice's entry
  const bobAttempt = await VocabularyEntryDAO.findById(user2, aliceEntry.id);
  console.log('Bob trying to access Alice\'s entry:', bobAttempt); // null

  // Bob cannot update Alice's entry
  const updateAttempt = await VocabularyEntryDAO.update(user2, aliceEntry.id, {
    englishMeaning: 'study'
  });
  console.log('Bob trying to update Alice\'s entry:', updateAttempt); // null

  // Bob cannot delete Alice's entry
  const deleteAttempt = await VocabularyEntryDAO.delete(user2, aliceEntry.id);
  console.log('Bob trying to delete Alice\'s entry:', deleteAttempt); // false
}

export {
  createVocabularyExample,
  findByIdExample,
  findAllEntriesExample,
  filterByChapterExample,
  updateEntryExample,
  deleteEntryExample,
  getChaptersExample,
  countByChapterExample,
  userIsolationExample
};
