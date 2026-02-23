-- Add is_favorite column to vocabulary_entries table
USE chinese_learning_app;

ALTER TABLE vocabulary_entries 
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE AFTER learning_note;

-- Add index for faster favorite queries
CREATE INDEX idx_username_favorite ON vocabulary_entries(username, is_favorite);
