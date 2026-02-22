# Implementation Plan: Pre-Generated Phrases Feature

## Overview

This implementation plan breaks down the pre-generated phrases feature into discrete coding tasks. The feature automatically generates Chinese practice sentences every 4 hours using vocabulary from cumulative chapter ranges, stores them in MySQL, and presents them through an interactive React frontend.

Implementation follows this sequence: database schema → AI service modification → phrase generation service → scheduler → backend API → frontend UI → integration.

## Tasks

- [x] 1. Create database schema for sentence storage
  - Create migration file for `pre_generated_sentences` table
  - Add fields: id (VARCHAR 36), vocab_group_id (INT), chinese_text (TEXT), pinyin (TEXT), used_characters (JSON), generation_timestamp (TIMESTAMP)
  - Add index on vocab_group_id for efficient queries
  - Set charset to utf8mb4 with utf8mb4_unicode_ci collation
  - Run migration to create table
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 2. Modify AITextGenerator service for batch generation
  - [x] 2.1 Add generateMultipleSentences method to AITextGenerator
    - Create new method that accepts characters array and count parameter (default 30)
    - Modify AI prompt to request multiple sentences in single API call
    - Parse response to extract array of sentences with chineseText, pinyin, and usedCharacters
    - Maintain backward compatibility with existing generateText method
    - _Requirements: 3.4, 8.1, 8.2_
  
  - [x] 2.2 Write property test for batch generation
    - **Property 9: AITextGenerator Integration**
    - **Validates: Requirements 3.4, 8.1, 8.2**
  
  - [x] 2.3 Write unit tests for generateMultipleSentences
    - Test with 300 characters input
    - Test response parsing for 30 sentences
    - Test error handling for API failures
    - _Requirements: 3.4, 8.2_

- [ ] 3. Implement PhraseGeneratorService
  - [x] 3.1 Create PhraseGeneratorService class with vocab group logic
    - Implement getVocabGroups method to query 5 most recent chapters
    - Create VocabGroup interface with id, chapterStart, chapterEndpoint
    - Query vocabulary database for distinct chapters ordered descending
    - Return 5 vocab groups with cumulative ranges (chapter 1 to N)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.2 Write property tests for vocab group generation
    - **Property 1: Vocab Group Uniqueness**
    - **Validates: Requirements 1.2**
    - **Property 2: Cumulative Vocabulary Inclusion**
    - **Validates: Requirements 1.3**
    - **Property 3: Vocab Group Ordering**
    - **Validates: Requirements 1.4**
  
  - [x] 3.3 Implement batch generation logic
    - Create generateBatch method that selects 300 random characters
    - Call AITextGenerator.generateMultipleSentences with selected characters
    - Return array of 30 GeneratedSentence objects
    - _Requirements: 3.2, 3.3, 3.5_
  
  - [x] 3.4 Implement generateSentencesForGroup method
    - Generate 4 batches per vocab group (4 × 30 = 120 sentences)
    - Fetch vocabulary for chapter range 1 to chapterEndpoint
    - Call generateBatch 4 times with different random character selections
    - Aggregate results into single array of 120 sentences
    - _Requirements: 3.1, 3.6_
  
  - [x] 3.5 Write property tests for batch processing
    - **Property 7: Batch Character Selection**
    - **Validates: Requirements 3.2, 3.5**
    - **Property 8: Batch Sentence Count**
    - **Validates: Requirements 3.3**
    - **Property 10: Total Sentence Count Per Group**
    - **Validates: Requirements 3.6**
  
  - [x] 3.6 Implement database operations
    - Create deleteSentencesForGroup method with transaction support
    - Create storeSentences method to insert sentences with UUIDs
    - Implement transaction rollback on storage failure
    - Extract chineseText, pinyin, usedCharacters from AI response
    - _Requirements: 2.4, 4.6, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 3.7 Write property tests for sentence persistence
    - **Property 6: Sentence Replacement**
    - **Validates: Requirements 2.4, 4.6**
    - **Property 11: Complete Sentence Persistence**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
    - **Property 12: Complete Data Extraction**
    - **Validates: Requirements 8.3, 8.4, 8.5, 8.6**
  
  - [x] 3.8 Implement generateAllSentences orchestration method
    - Call getVocabGroups to get 5 groups
    - Loop through each group and call generateSentencesForGroup
    - Delete old sentences before storing new ones for each group
    - Add error handling with retry logic (3 attempts with exponential backoff)
    - Log generation status and errors
    - _Requirements: 2.2, 2.4_
  
  - [x] 3.9 Write unit tests for error handling
    - Test AI API failure retry logic
    - Test database transaction rollback
    - Test partial generation failure recovery
    - _Requirements: 2.2_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Create GenerationScheduler service
  - [x] 5.1 Implement GenerationScheduler with cron job
    - Create GenerationScheduler class using node-cron
    - Set cron expression to "0 */4 * * *" (every 4 hours)
    - Implement start method to begin scheduler
    - Implement stop method to halt scheduler
    - Implement triggerGeneration method for manual execution
    - Add mutex lock to prevent concurrent executions
    - _Requirements: 2.1, 2.3_
  
  - [x] 5.2 Write property test for scheduler timing
    - **Property 4: Scheduler Interval Consistency**
    - **Validates: Requirements 2.1**
  
  - [x] 5.3 Write unit tests for scheduler
    - Test cron job initialization
    - Test manual trigger functionality
    - Test concurrent execution prevention
    - Test scheduler start/stop
    - _Requirements: 2.1, 2.3_
  
  - [x] 5.4 Integrate scheduler with PhraseGeneratorService
    - Call PhraseGeneratorService.generateAllSentences on trigger
    - Add error handling and logging
    - Start scheduler on application startup
    - _Requirements: 2.2_
  
  - [x] 5.5 Write property test for complete group processing
    - **Property 5: Complete Group Processing**
    - **Validates: Requirements 2.2**

- [ ] 6. Create backend API routes
  - [x] 6.1 Create phrases.routes.ts with vocab groups endpoint
    - Create GET /api/phrases/vocab-groups endpoint
    - Return array of 5 vocab groups with id, chapterStart, chapterEnd, sentenceCount
    - Query database to count sentences per group
    - _Requirements: 5.2, 5.3_
  
  - [x] 6.2 Create sentences retrieval endpoint
    - Create GET /api/phrases/sentences/:vocabGroupId endpoint
    - Query pre_generated_sentences table by vocab_group_id
    - Return array of sentences with all fields (id, vocabGroupId, chineseText, pinyin, usedCharacters, generationTimestamp)
    - Add validation for vocabGroupId parameter (1-5)
    - _Requirements: 5.4, 5.5_
  
  - [x] 6.3 Create character info endpoint
    - Create GET /api/phrases/character-info/:character endpoint
    - Query vocabulary_entries table for character details
    - Return chineseCharacter, pinyin, hanVietnamese, modernVietnamese, englishMeaning
    - Handle missing characters gracefully
    - _Requirements: 6.5_
  
  - [x] 6.4 Create manual generation trigger endpoint
    - Create POST /api/phrases/generate endpoint
    - Call PhraseGeneratorService.generateAllSentences
    - Return success status and message
    - _Requirements: 2.2_
  
  - [x] 6.5 Write unit tests for API routes
    - Test vocab groups endpoint response format
    - Test sentences endpoint with valid/invalid vocab group IDs
    - Test character info endpoint with existing/missing characters
    - Test manual generation trigger
    - Test error responses (400, 404, 503)
    - _Requirements: 5.2, 5.3, 5.4, 6.5_
  
  - [x] 6.6 Register phrases routes in Express app
    - Import phrases.routes.ts in main app file
    - Mount routes at /api/phrases
    - Ensure no authentication middleware applied
    - _Requirements: 7.2_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Create PhrasesPage frontend component
  - [x] 8.1 Create PhrasesPage component structure
    - Create PhrasesPage.tsx in packages/frontend/src/pages
    - Set up component state for vocabGroups, sentences, selectedSentence, characterDetails, loading, error
    - Create TypeScript interfaces for VocabGroupResponse, SentenceResponse, CharacterInfo
    - _Requirements: 5.1_
  
  - [x] 8.2 Implement vocab groups display
    - Fetch vocab groups from GET /api/phrases/vocab-groups on mount
    - Display 5 vocab groups with chapter ranges (chapter 1 to N)
    - Use accordion or tabs for group organization
    - Show loading spinner during fetch
    - _Requirements: 5.2, 5.3_
  
  - [x] 8.3 Implement sentences display
    - Fetch sentences for each vocab group from GET /api/phrases/sentences/:vocabGroupId
    - Display 120 sentences per group in grid layout
    - Render sentences as clickable cards with Chinese text
    - Add hover effects for interactivity
    - _Requirements: 5.4, 5.5, 5.6_
  
  - [x] 8.4 Write property test for sentence display
    - **Property 13: Sentence Display Completeness**
    - **Validates: Requirements 5.4, 5.5, 5.6**
  
  - [x] 8.5 Implement character detail view
    - Create modal or expandable section for character details
    - Display pinyin for selected sentence
    - Display list of characters used in sentence
    - Fetch character info from GET /api/phrases/character-info/:character
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 8.6 Implement character information display
    - Display character details in table format matching AITestPage
    - Show chineseCharacter, pinyin, hanVietnamese, modernVietnamese, englishMeaning
    - Add pronunciation button for each character (reuse existing audio logic)
    - Handle missing fields with "N/A" display
    - _Requirements: 6.4, 6.5_
  
  - [x] 8.7 Write property tests for character detail view
    - **Property 14: Character Detail View Interaction**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - **Property 15: Character Information Completeness**
    - **Validates: Requirements 6.5**
  
  - [x] 8.8 Implement error handling and loading states
    - Add error message display with retry button
    - Show loading spinner during data fetch
    - Display empty state when no sentences available
    - Add network failure retry logic (2 attempts with 1s delay)
    - _Requirements: 5.1_
  
  - [x] 8.9 Write unit tests for PhrasesPage component
    - Test rendering with mock data
    - Test sentence click interaction
    - Test character detail modal show/hide
    - Test error states and retry functionality
    - Test loading states
    - _Requirements: 5.1, 6.1_

- [x] 9. Add PhrasesPage to application routing
  - Add route for /phrases in frontend router
  - Add navigation link to PhrasesPage in main menu
  - Ensure route is accessible without authentication
  - _Requirements: 5.1, 7.2_

- [ ] 10. Integration and final wiring
  - [x] 10.1 Test end-to-end generation flow
    - Manually trigger generation via POST /api/phrases/generate
    - Verify 5 vocab groups processed
    - Verify 120 sentences per group stored in database
    - Verify old sentences deleted before new ones inserted
    - _Requirements: 2.2, 2.4, 3.6_
  
  - [x] 10.2 Test frontend-backend integration
    - Load PhrasesPage in browser
    - Verify vocab groups displayed correctly
    - Click sentence and verify character details appear
    - Test pronunciation button functionality
    - Verify all 120 sentences displayed per group
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 10.3 Write integration tests
    - Test complete generation cycle
    - Test API endpoints with real database
    - Test frontend data flow with test backend
    - _Requirements: 2.2, 5.1_
  
  - [x] 10.4 Verify scheduler operation
    - Start application and verify scheduler starts
    - Wait for 4-hour interval or manually trigger
    - Verify generation completes successfully
    - Check logs for errors
    - _Requirements: 2.1, 2.3_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from design document
- Unit tests validate specific examples and edge cases
- The scheduler will run continuously once started, generating fresh sentences every 4 hours
- All database operations use transactions to ensure data consistency
- Frontend matches existing AITestPage format for character details
