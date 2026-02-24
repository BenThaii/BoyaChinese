-- Add english_meaning column to pre_generated_sentences table
-- This migration adds English translation support for batch-generated sentences

ALTER TABLE pre_generated_sentences 
ADD COLUMN IF NOT EXISTS english_meaning TEXT AFTER pinyin;
