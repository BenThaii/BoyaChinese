# Requirements Document

## Introduction

This document specifies the requirements for a Chinese language learning application designed to help users learn Chinese vocabulary through flashcards, text comprehension exercises, and vocabulary management. The application supports multiple languages (English, Vietnamese) and integrates with external APIs for translation, AI-generated content, and text-to-speech functionality.

## Glossary

- **Application**: The Chinese language learning application system consisting of an iOS mobile app and web admin interface
- **iOS_App**: The native iPhone application for learning features (flashcards, text comprehension, pronunciation)
- **Web_Admin**: The web-based interface for vocabulary management, sharing, and database operations
- **User**: A person using the application to learn Chinese vocabulary
- **Word_Database**: The persistent storage system containing Chinese vocabulary entries
- **Vocabulary_Entry**: A single record in the Word_Database containing a Chinese character and its associated information
- **Flashcard_System**: The component that presents vocabulary for learning and testing (iOS_App)
- **Admin_Interface**: The web interface where users manage their vocabulary entries (Web_Admin)
- **User_Interface**: The iOS interface where users practice and learn vocabulary (iOS_App)
- **Database_Management_Interface**: The password-protected web interface for database backup and restore operations (Web_Admin)
- **TTS_Service**: The text-to-speech service using edge-tts
- **Translation_Service**: The Google Translate API integration
- **AI_Service**: The Google AI Studio API integration
- **Chapter_Filter**: The user-selected range of chapter numbers for practice
- **Chinese_Character**: The Chinese written form of a vocabulary entry
- **Pinyin**: The romanized pronunciation of a Chinese character
- **Han_Vietnamese**: The Vietnamese "tiếng Hán" meaning of a Chinese character
- **Modern_Vietnamese**: The contemporary Vietnamese meaning of a Chinese character
- **English_Meaning**: The English translation of a Chinese character
- **Learning_Note**: User-created notes associated with a vocabulary entry

## Requirements

### Requirement 1: Multi-Platform Access

**User Story:** As a user, I want to access learning features on my iPhone and manage vocabulary on the web, so that I can learn Chinese vocabulary anywhere and efficiently manage my content.

#### Acceptance Criteria

1. THE Application SHALL provide a native iOS mobile app for learning features (flashcards, text comprehension, pronunciation)
2. THE Application SHALL provide a web-based Admin_Interface for vocabulary management
3. THE iOS app SHALL be optimized for iPhone screen sizes and iOS design patterns
4. THE web Admin_Interface SHALL be accessible via web browsers on desktop and mobile devices

### Requirement 2: Vocabulary Data Storage

**User Story:** As a user, I want my vocabulary entries to contain comprehensive information, so that I can learn Chinese characters with multiple reference points.

#### Acceptance Criteria

1. THE Word_Database SHALL store Chinese_Character for each Vocabulary_Entry
2. THE Word_Database SHALL store Pinyin for each Vocabulary_Entry
3. THE Word_Database SHALL store English_Meaning for each Vocabulary_Entry
4. THE Word_Database SHALL store Han_Vietnamese for each Vocabulary_Entry
5. THE Word_Database SHALL store Modern_Vietnamese for each Vocabulary_Entry
6. THE Word_Database SHALL store Learning_Note for each Vocabulary_Entry
7. THE Word_Database SHALL store chapter number for each Vocabulary_Entry
8. THE Word_Database SHALL store username for each Vocabulary_Entry


### Requirement 3: External API Integration

**User Story:** As a user, I want the application to use external services for translation, content generation, and pronunciation, so that I have access to high-quality learning resources.

#### Acceptance Criteria

1. THE Application SHALL integrate with Google Translate API
2. THE Application SHALL integrate with Google AI Studio API
3. THE Application SHALL integrate with edge-tts for text-to-speech functionality

### Requirement 4: User Isolation

**User Story:** As a user, I want my own dedicated interface and vocabulary database, so that my learning progress is separate from other users.

#### Acceptance Criteria

1. THE iOS_App SHALL provide a unique User_Interface for each username
2. THE Web_Admin SHALL provide a unique Admin_Interface for each username
3. THE Word_Database SHALL isolate Vocabulary_Entry records by username
4. THE Application SHALL allow access without authentication

### Requirement 5: Chinese to Meanings Flashcard

**User Story:** As a user, I want to practice recognizing Chinese characters and recall their pronunciations and meanings, so that I can improve my reading comprehension.

#### Acceptance Criteria

1. WHEN the user selects Chinese to Meanings flashcard mode, THE Flashcard_System SHALL display a Chinese_Character
2. WHEN the user requests the answer, THE Flashcard_System SHALL display Pinyin and Han_Vietnamese and Modern_Vietnamese and English_Meaning and Learning_Note
3. THE Flashcard_System SHALL select vocabulary only from the Chapter_Filter range

### Requirement 6: English to Chinese Flashcard

**User Story:** As a user, I want to practice translating English words to Chinese, so that I can improve my vocabulary recall from English.

#### Acceptance Criteria

1. WHEN the user selects English to Chinese flashcard mode, THE Flashcard_System SHALL display English_Meaning
2. WHEN the user requests the answer, THE Flashcard_System SHALL display Chinese_Character and Pinyin
3. THE Flashcard_System SHALL select vocabulary only from the Chapter_Filter range

### Requirement 7: Vietnamese to Chinese Flashcard

**User Story:** As a user, I want to practice translating Vietnamese words to Chinese, so that I can improve my vocabulary recall from Vietnamese.

#### Acceptance Criteria

1. WHEN the user selects Vietnamese to Chinese flashcard mode, THE Flashcard_System SHALL display Modern_Vietnamese
2. WHEN the user requests the answer, THE Flashcard_System SHALL display Chinese_Character and Pinyin
3. THE Flashcard_System SHALL select vocabulary only from the Chapter_Filter range

### Requirement 8: AI-Generated Text Comprehension

**User Story:** As a user, I want to practice reading Chinese texts that use only vocabulary I'm learning, so that I can improve my reading comprehension at my current level.

#### Acceptance Criteria

1. WHEN the user accesses text comprehension mode, THE AI_Service SHALL generate Chinese text using only characters from the Word_Database
2. THE AI_Service SHALL limit generated text to a maximum of 40 words
3. THE AI_Service SHALL receive a maximum of 300 randomly selected characters from the Chapter_Filter range
4. THE iOS_App SHALL display the generated Chinese text
5. THE iOS_App SHALL display Pinyin for the generated text
6. WHEN the user taps a Chinese_Character, THE iOS_App SHALL display Han_Vietnamese and Modern_Vietnamese and English_Meaning and Learning_Note

### Requirement 9: Chapter-Based Filtering

**User Story:** As a user, I want to select which chapters to practice from, so that I can focus on specific sections of my textbook.

#### Acceptance Criteria

1. THE iOS_App SHALL provide a chapter range selector
2. WHEN the user selects a chapter range, THE Application SHALL store it as Chapter_Filter
3. THE Flashcard_System SHALL use only Vocabulary_Entry records within the Chapter_Filter range
4. THE AI_Service SHALL use only characters from Vocabulary_Entry records within the Chapter_Filter range

### Requirement 10: Text-to-Speech Pronunciation

**User Story:** As a user, I want to hear the pronunciation of Chinese characters, so that I can learn correct pronunciation.

#### Acceptance Criteria

1. WHENEVER a Chinese_Character is displayed in the iOS_App, THE iOS_App SHALL provide a pronunciation button
2. WHEN the user taps the pronunciation button, THE TTS_Service SHALL pronounce the Chinese_Character using edge-tts
3. THE TTS_Service SHALL use edge-tts voices for pronunciation

### Requirement 11: Vocabulary Upload and Management

**User Story:** As a user, I want to add new vocabulary entries to my database, edit existing entries, and use automatic translation, so that I can efficiently manage my learning material.

#### Acceptance Criteria

1. THE Web_Admin SHALL provide a vocabulary upload form
2. THE Web_Admin SHALL provide a vocabulary management page displaying all Vocabulary_Entry records for the current user
3. WHEN the user selects a Vocabulary_Entry, THE Web_Admin SHALL allow editing of all fields (Chinese_Character, Pinyin, English_Meaning, Han_Vietnamese, Modern_Vietnamese, Learning_Note, chapter number)
4. WHEN the user saves changes, THE Web_Admin SHALL update the Vocabulary_Entry in the Word_Database
5. WHEN the user submits a Chinese_Character, THE Web_Admin SHALL create a new Vocabulary_Entry
6. WHERE the user provides Han_Vietnamese, THE Web_Admin SHALL store it in the Vocabulary_Entry
7. WHERE the user provides Modern_Vietnamese, THE Web_Admin SHALL store it in the Vocabulary_Entry
8. WHERE the user provides English_Meaning, THE Web_Admin SHALL store it in the Vocabulary_Entry
9. THE Web_Admin SHALL associate the Vocabulary_Entry with the current username
10. THE vocabulary upload form SHALL provide an automatic translation button
11. WHEN the user enters a Chinese_Character and presses the automatic translation button, THE Translation_Service SHALL generate Modern_Vietnamese and English_Meaning
12. WHEN translations are generated, THE Web_Admin SHALL populate the Modern_Vietnamese and English_Meaning fields with the translated content
13. THE Web_Admin SHALL allow the user to review and modify the auto-generated translations before saving

### Requirement 13: Chapter Vocabulary Sharing

**User Story:** As a user, I want to import vocabulary from other users' chapters, so that I can quickly build my vocabulary database from shared resources.

#### Acceptance Criteria

1. THE Web_Admin SHALL display a list of all usernames with available vocabulary
2. WHEN the user selects another username, THE Web_Admin SHALL display all chapter numbers available for that username
3. WHEN the user selects a chapter number from another user, THE Web_Admin SHALL display all Vocabulary_Entry records for that chapter
4. WHEN the user confirms the import, THE Web_Admin SHALL copy all selected Vocabulary_Entry records to the current user's Word_Database
5. THE Web_Admin SHALL preserve all fields (Chinese_Character, Pinyin, English_Meaning, Han_Vietnamese, Modern_Vietnamese, Learning_Note, chapter number) during import
6. THE Web_Admin SHALL associate the imported Vocabulary_Entry records with the current username

### Requirement 12: Automatic Translation

**User Story:** As a user, I want the application to automatically translate vocabulary when I save without providing meanings, so that I can quickly add new words without manual translation.

#### Acceptance Criteria

1. WHEN the user saves a Vocabulary_Entry without Modern_Vietnamese, THE Translation_Service SHALL generate Modern_Vietnamese using Google Translate API
2. WHEN the user saves a Vocabulary_Entry without English_Meaning, THE Translation_Service SHALL generate English_Meaning using Google Translate API
3. THE Web_Admin SHALL store the generated translations in the Vocabulary_Entry

### Requirement 14: Database Backup and Restore

**User Story:** As an administrator, I want to export and import the entire database, so that I can backup and restore the application's data in case of conflicts or data loss.

#### Acceptance Criteria

1. THE Web_Admin SHALL provide a Database_Management_Interface accessible at a dedicated URL
2. THE Database_Management_Interface SHALL require password authentication
3. THE Database_Management_Interface SHALL accept the password "BoyaChineseBach" for access
4. WHEN the password is correct, THE Database_Management_Interface SHALL grant access to backup and restore functions
5. THE Database_Management_Interface SHALL provide a database export function
6. WHEN the user triggers export, THE Application SHALL generate a complete backup file containing all Vocabulary_Entry records from all users
7. THE Application SHALL include all fields (Chinese_Character, Pinyin, English_Meaning, Han_Vietnamese, Modern_Vietnamese, Learning_Note, chapter number, username) in the export file
8. THE Database_Management_Interface SHALL provide a database import function
9. WHEN the user uploads a backup file, THE Application SHALL validate the file format
10. WHEN the file is valid, THE Application SHALL erase all existing Vocabulary_Entry records from the Word_Database
11. WHEN the database is erased, THE Application SHALL restore all Vocabulary_Entry records from the backup file to the Word_Database
12. THE Application SHALL preserve data integrity during import and export operations
