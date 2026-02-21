# Implementation Plan: Chinese Learning App

## Overview

This implementation plan breaks down the Chinese Learning App into discrete coding tasks. The application consists of:
1. **Backend API**: TypeScript/Node.js RESTful API with MySQL database
2. **iOS Mobile App**: Native iOS app (SwiftUI or React Native) for learning features
3. **Web Admin Interface**: React/Vue web app for vocabulary management

The implementation follows a bottom-up approach: core data models and services first, then API endpoints, and finally client applications.

Key features include vocabulary CRUD operations with full editing capabilities, manual translation preview functionality, password-protected database backup/restore, flashcard learning modes, AI-generated text comprehension, and vocabulary sharing between users.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create monorepo structure with backend, ios-app, and web-admin packages
  - Initialize TypeScript configuration for backend and web-admin
  - Set up database connection (MySQL)
  - Install backend dependencies: Express, database client, Google APIs, edge-tts wrapper
  - Configure environment variables for API keys
  - _Requirements: 1.1, 1.3, 1.4, 3.1, 3.2, 3.3_

- [x] 2. Implement database schema and models
  - [x] 2.1 Create vocabulary_entries table with all required fields
    - Implement SQL migration for vocabulary_entries table
    - Add indexes for username and chapter queries
    - Include all fields: id, username, chinese_character, pinyin, han_vietnamese, modern_vietnamese, english_meaning, learning_note, chapter, created_at, updated_at, shared_from
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  
  - [x] 2.2 Create vocabulary_sharing table for tracking shared vocabulary
    - Implement SQL migration for vocabulary_sharing table
    - Add unique constraint for source/target/chapter combination
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [x] 2.3 Implement VocabularyEntry TypeScript model and data access layer
    - Create TypeScript interfaces matching database schema
    - Implement CRUD operations: create, read, update, delete
    - Add user isolation filtering for all queries
    - _Requirements: 2.1-2.8, 4.3, 11.3, 11.4_

- [x] 3. Implement external service integrations
  - [x] 3.1 Create Translation Service wrapper for Google Translate API
    - Implement translateToVietnamese and translateToEnglish methods
    - Add batch translation support for efficiency
    - Add error handling for API failures
    - _Requirements: 3.1, 11.10, 11.11, 11.12, 12.1, 12.2_
  
  - [x] 3.2 Create AI Text Generator wrapper for Google AI Studio API
    - Implement generateText method with character constraints
    - Enforce 40-word maximum limit
    - Handle up to 300 input characters
    - _Requirements: 3.2, 8.1, 8.2, 8.3_
  
  - [x] 3.3 Create TTS Service wrapper for edge-tts
    - Implement pronounce method returning audio data
    - Configure Chinese voice selection
    - _Requirements: 3.3, 10.2, 10.3_

- [x] 4. Implement Chapter Filter component
  - [x] 4.1 Create ChapterFilter class with range validation
    - Implement getVocabularyInRange method
    - Implement getRandomCharacters method for AI text generation
    - Add chapter range validation
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 5. Implement Vocabulary Manager component
  - [x] 5.1 Create VocabularyManager class with full CRUD operations
    - Implement createEntry with automatic translation for missing fields on save
    - Implement getEntries with chapter filtering
    - Implement getEntry for single vocabulary retrieval
    - Implement updateEntry to modify all fields of existing entries
    - Implement deleteEntry to remove vocabulary entries
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 12.1, 12.2, 12.3_
  
  - [x] 5.2 Implement manual translation preview functionality
    - Implement previewTranslations method that generates translations without saving
    - Return TranslationPreview with modernVietnamese and englishMeaning
    - Allow user to review translations before committing to database
    - _Requirements: 11.10, 11.11, 11.12, 11.13_
  
  - [x] 5.3 Implement vocabulary sharing functionality
    - Implement shareChapter method to copy vocabulary between users
    - Implement getAvailableChapters method
    - Implement getSharedVocabularySources method
    - Preserve all fields during import and set shared_from
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 6. Implement Database Backup Manager component
  - [x] 6.1 Create DatabaseBackupManager class with authentication
    - Implement authenticate method to validate password "BoyaChineseBach"
    - Implement exportDatabase method to generate complete backup file
    - Implement importDatabase method to restore from backup file
    - Implement validateBackupFile method to check file format
    - Include checksum validation for data integrity
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10, 14.11, 14.12_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Flashcard Engine component
  - [x] 8.1 Create FlashcardEngine class with mode-based card generation
    - Implement getNextCard method with random vocabulary selection
    - Implement mode-specific question formatting (Chinese→Meanings, English→Chinese, Vietnamese→Chinese)
    - Implement revealAnswer method with mode-specific answer fields
    - Integrate with ChapterFilter for vocabulary selection
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 9.3_

- [ ] 9. Implement backend API endpoints
  - [ ] 9.1 Create flashcard API endpoints
    - Implement GET /api/:username/flashcard/next endpoint
    - Implement GET /api/:username/flashcard/:id/answer endpoint
    - Add query parameter validation for mode and chapter range
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_
  
  - [ ] 9.2 Create vocabulary management API endpoints
    - Implement POST /api/:username/vocabulary endpoint for creating entries
    - Implement GET /api/:username/vocabulary endpoint with chapter filtering
    - Implement GET /api/:username/vocabulary/:id endpoint for single entry retrieval
    - Implement PUT /api/:username/vocabulary/:id endpoint for updating entries
    - Implement DELETE /api/:username/vocabulary/:id endpoint for deleting entries
    - Implement POST /api/:username/vocabulary/translate endpoint for manual translation preview
    - Implement GET /api/:username/vocabulary/chapters endpoint
    - Implement POST /api/:username/vocabulary/share endpoint
    - Implement GET /api/vocabulary/shared endpoint
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.10, 11.11, 11.12, 11.13, 13.1, 13.2, 13.3, 13.4_
  
  - [ ] 9.3 Create text comprehension API endpoints
    - Implement GET /api/:username/comprehension/generate endpoint
    - Implement GET /api/:username/comprehension/character-info endpoint
    - Cache generated texts with TTL
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 9.4 Create TTS API endpoint
    - Implement GET /api/tts/pronounce endpoint
    - Return audio URL or stream
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 9.5 Create database backup and restore API endpoints
    - Implement POST /api/admin/authenticate endpoint for password validation
    - Implement GET /api/admin/backup endpoint (requires authentication)
    - Implement POST /api/admin/restore endpoint (requires authentication)
    - Export all vocabulary entries with all fields to backup file
    - Import and replace all vocabulary entries from backup file
    - Include data integrity validation
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10, 14.11, 14.12_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement iOS Mobile App (Learning Features)
  - [x] 11.1 Set up iOS project structure
    - Create iOS app project (SwiftUI or React Native)
    - Configure API client for backend communication
    - Set up navigation structure (Flashcards, Comprehension, Settings)
    - _Requirements: 1.1, 1.3_
  
  - [x] 11.2 Implement chapter range selector
    - Create chapter start/end input UI
    - Store selected range in app state
    - _Requirements: 9.1, 9.2_
  
  - [x] 11.3 Implement flashcard mode selector
    - Create buttons for three flashcard modes
    - Display current mode selection
    - _Requirements: 5.1, 6.1, 7.1_
  
  - [x] 11.4 Implement flashcard display screen
    - Display question text based on mode
    - Implement "Show Answer" button
    - Display answer fields when revealed
    - Implement "Next Card" button
    - Integrate with chapter range selector
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_
  
  - [ ] 11.5 Add TTS pronunciation to flashcards
    - Display pronunciation button next to Chinese characters
    - Play audio when button is tapped
    - Handle audio playback with AVFoundation or React Native audio
    - _Requirements: 10.1, 10.2_
  
  - [x] 11.6 Implement text comprehension screen
    - Implement "Generate Text" button with chapter range integration
    - Display generated Chinese text
    - Display pinyin below Chinese text
    - Make each Chinese character tappable
    - Display popup/modal with character details (Han Vietnamese, Modern Vietnamese, English, notes)
    - Add pronunciation button to character popup
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2_

- [ ] 12. Implement Web Admin Interface (Management Features)
  - [x] 12.1 Set up web admin project structure
    - Create React/Vue project
    - Configure API client for backend communication
    - Set up routing (Vocabulary Management, Sharing, Database Admin)
    - Implement responsive layout with mobile support
    - _Requirements: 1.4_
  
  - [x] 12.2 Implement vocabulary upload form with manual translation preview
    - Implement form fields for all vocabulary entry fields
    - Add "Preview Translation" button that calls translation API without saving
    - Display preview translations in form fields for user review
    - Allow user to modify previewed translations before saving
    - Add "Save" button to create new entry with automatic translation for any remaining empty fields
    - _Requirements: 11.1, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11, 11.12, 11.13, 12.1, 12.2, 12.3_
  
  - [x] 12.3 Implement vocabulary management page with full editing
    - Display table of all vocabulary entries for current user
    - Implement inline editing for all fields: Chinese character, pinyin, Han Vietnamese, Modern Vietnamese, English meaning, learning note, chapter
    - Add "Edit" button to enable editing mode for each entry
    - Add "Save" button to persist changes via PUT endpoint
    - Add "Delete" button to remove entries via DELETE endpoint
    - Add chapter filtering dropdown
    - Display confirmation dialog before deletion
    - _Requirements: 11.2, 11.3, 11.4_
  
  - [x] 12.4 Implement vocabulary sharing interface
    - Display list of all usernames with available vocabulary
    - Implement username selection to show available chapters
    - Display vocabulary entries for selected chapter
    - Implement import confirmation and execution
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [x] 12.5 Implement password-protected database management page
    - Implement password input form at /database-admin route
    - Call POST /api/admin/authenticate endpoint
    - Display backup and restore functions after successful authentication
    - Show error message for incorrect password
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [x] 12.6 Implement database export functionality
    - Add "Export Database" button
    - Call GET /api/admin/backup endpoint
    - Generate complete backup file with all vocabulary entries and all fields
    - Trigger file download with timestamp in filename
    - Display success message
    - _Requirements: 14.5, 14.6, 14.7_
  
  - [x] 12.7 Implement database import functionality
    - Add file upload input for backup file
    - Validate uploaded file format on client side
    - Display confirmation dialog warning about data erasure
    - Call POST /api/admin/restore endpoint with backup file
    - Display progress indicator during restore
    - Display success message with number of entries restored
    - Display error messages if validation or restore fails
    - _Requirements: 14.8, 14.9, 14.10, 14.11, 14.12_

- [ ] 13. Implement user routing and isolation
  - [x] 13.1 Implement iOS app username configuration
    - Add username input/selection on first launch
    - Store username in app preferences
    - Pass username in all API calls
    - _Requirements: 4.1, 4.3_
  
  - [x] 13.2 Implement web admin username-based routing
    - Implement routes for /:username/admin (vocabulary management)
    - Implement routes for /:username/share (vocabulary sharing)
    - Implement route for /database-admin (backup/restore)
    - Extract username from URL path
    - Pass username to all backend API calls
    - _Requirements: 4.2, 4.3_

- [ ] 14. Final integration and testing
  - [ ] 14.1 Test iOS app end-to-end
    - Test all flashcard modes
    - Test text comprehension with character interaction
    - Test TTS pronunciation
    - Test chapter filtering
    - _Requirements: All iOS-related_
  
  - [ ] 14.2 Test web admin end-to-end
    - Test vocabulary CRUD operations
    - Test translation preview
    - Test vocabulary sharing
    - Test database backup/restore
    - _Requirements: All web admin-related_
  
  - [ ] 14.3 Add error handling and user feedback
    - Display error messages for API failures in both apps
    - Add success notifications for CRUD operations
    - Handle edge cases (empty vocabulary, invalid chapter ranges, network errors)
    - Add validation messages for form inputs
    - _Requirements: All_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The backend uses TypeScript/Node.js with Express
- The iOS app can be built with SwiftUI (native) or React Native (cross-platform)
- The web admin uses React or Vue.js
- External API keys must be configured before testing integration tasks
- Database must be set up before running any data-related tasks
- Backend API serves both iOS app and web admin with the same endpoints
