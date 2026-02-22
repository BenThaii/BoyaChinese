# Requirements Document

## Introduction

This document specifies the requirements for a pre-generated phrases feature that automatically generates Chinese practice sentences for vocabulary groups. The system generates sentences every 4 hours using vocabulary from cumulative chapter ranges, stores them in the database, and presents them to users with interactive learning features including pinyin and character details.

## Glossary

- **Phrase_Generator**: The automated system component that generates Chinese sentences using the AI_Service
- **Vocab_Group**: A collection of vocabulary entries representing cumulative vocabulary from chapter 1 to a specific chapter endpoint
- **Generation_Batch**: A set of 30 sentences generated using 300 randomly selected characters from a Vocab_Group
- **Sentence_Database**: The persistent storage system containing pre-generated Chinese sentences
- **Sentence_Entry**: A single record in the Sentence_Database containing a generated Chinese sentence and its associated metadata
- **Phrases_Page**: The web page where users view pre-generated sentences organized by Vocab_Group
- **AI_Service**: The Google Gemini API integration using the gemini-flash-lite-latest model
- **Generation_Scheduler**: The automated process that triggers sentence generation every 4 hours
- **Character_Detail_View**: The interactive display showing pinyin and character information when a user clicks a sentence
- **Word_Database**: The existing vocabulary database containing Chinese characters and their metadata
- **Chapter_Endpoint**: The final chapter number in a cumulative vocabulary range (chapters 1 through N)
- **AITextGenerator**: The existing service class that interfaces with the Google Gemini API

## Requirements

### Requirement 1: Vocabulary Group Definition

**User Story:** As a user, I want to practice sentences using vocabulary from cumulative chapter ranges, so that I can reinforce my learning from the beginning through recent chapters.

#### Acceptance Criteria

1. THE Application SHALL define exactly 5 Vocab_Group instances
2. THE Application SHALL assign each Vocab_Group a unique Chapter_Endpoint representing one of the 5 most recent chapters in the Word_Database
3. WHEN determining Vocab_Group membership, THE Application SHALL include all vocabulary entries from chapter 1 through the Chapter_Endpoint
4. THE Application SHALL order Vocab_Group instances by Chapter_Endpoint in ascending order

### Requirement 2: Automated Sentence Generation Schedule

**User Story:** As a user, I want fresh practice sentences generated automatically, so that I have new content to practice with regularly.

#### Acceptance Criteria

1. THE Generation_Scheduler SHALL trigger sentence generation every 4 hours
2. WHEN the Generation_Scheduler triggers, THE Phrase_Generator SHALL generate sentences for all 5 Vocab_Group instances
3. THE Generation_Scheduler SHALL operate continuously without requiring manual intervention
4. WHEN new sentences are generated, THE Phrase_Generator SHALL replace all existing Sentence_Entry records for each Vocab_Group

### Requirement 3: Batch-Based Sentence Generation

**User Story:** As a user, I want sentences generated using varied character selections, so that I practice with diverse vocabulary combinations.

#### Acceptance Criteria

1. WHEN generating sentences for a Vocab_Group, THE Phrase_Generator SHALL create exactly 4 Generation_Batch instances
2. FOR EACH Generation_Batch, THE Phrase_Generator SHALL randomly select exactly 300 characters from the Vocab_Group
3. FOR EACH Generation_Batch, THE Phrase_Generator SHALL generate exactly 30 sentences using the selected 300 characters
4. THE Phrase_Generator SHALL use the AITextGenerator service to generate sentences, but modify it so that the AI will return 30 sentences per API call.
5. THE Phrase_Generator SHALL pass the 300 selected characters to the AITextGenerator service
6. THE Phrase_Generator SHALL generate a total of 120 sentences per Vocab_Group (4 batches × 30 sentences)

### Requirement 4: Sentence Storage

**User Story:** As a user, I want generated sentences stored persistently, so that I can access them without regeneration delays.

#### Acceptance Criteria

1. THE Sentence_Database SHALL store the Chinese text for each Sentence_Entry
2. THE Sentence_Database SHALL store the Vocab_Group identifier for each Sentence_Entry
3. THE Sentence_Database SHALL store the generation timestamp for each Sentence_Entry
4. THE Sentence_Database SHALL store the pinyin for each Sentence_Entry
5. THE Sentence_Database SHALL store the list of characters used for each Sentence_Entry
6. WHEN the Phrase_Generator creates new sentences for a Vocab_Group, THE Application SHALL delete all existing Sentence_Entry records for that Vocab_Group before storing new sentences

### Requirement 5: Phrases Page Display

**User Story:** As a user, I want to view pre-generated sentences organized by vocabulary group, so that I can practice at my appropriate learning level.

#### Acceptance Criteria

1. THE Application SHALL provide a Phrases_Page accessible via web browser
2. THE Phrases_Page SHALL display all 5 Vocab_Group instances
3. FOR EACH Vocab_Group, THE Phrases_Page SHALL display the Chapter_Endpoint range (chapter 1 to N)
4. FOR EACH Vocab_Group, THE Phrases_Page SHALL display all 120 Sentence_Entry records
5. THE Phrases_Page SHALL display sentences in Chinese text
6. THE Phrases_Page SHALL make each sentence clickable for detailed view

### Requirement 6: Interactive Sentence Details

**User Story:** As a user, I want to see pinyin and character details when I click a sentence, so that I can understand pronunciation and meaning.

#### Acceptance Criteria

1. WHEN the user clicks a Sentence_Entry on the Phrases_Page, THE Application SHALL display the Character_Detail_View
2. THE Character_Detail_View SHALL display the pinyin for the sentence
3. THE Character_Detail_View SHALL display a list of all characters used in the sentence 
4. THE Character_Detail_View SHALL display character information in the same format as the existing AI test page (with pronunciation button)
5. FOR EACH character in the list, THE Character_Detail_View SHALL display the Chinese_Character and Pinyin and Han_Vietnamese and Modern_Vietnamese and English_Meaning from the Word_Database

### Requirement 7: Single User System

**User Story:** As the sole user, I want the system to work without user authentication, so that I can access phrases immediately. There should be no user drop-down selection list for vocab management and for AI test page, etc.

#### Acceptance Criteria

1. THE Application SHALL generate sentences for a single user without requiring authentication
2. THE Phrases_Page SHALL be accessible without login
3. THE Sentence_Database SHALL store all Sentence_Entry records without user association

### Requirement 8: AI Service Integration

**User Story:** As a user, I want sentences generated using the existing AI service, so that the quality and format are consistent with other features.

#### Acceptance Criteria

1. THE Phrase_Generator SHALL use the existing AITextGenerator service for sentence generation
2. THE Phrase_Generator SHALL invoke the AITextGenerator generateText method with the 300 selected characters
3. THE Phrase_Generator SHALL extract the chineseText field from the AITextGenerator response
4. THE Phrase_Generator SHALL extract the pinyin field from the AITextGenerator response
5. THE Phrase_Generator SHALL extract the usedCharacters field from the AITextGenerator response
6. THE Phrase_Generator SHALL store all extracted fields in the Sentence_Entry
