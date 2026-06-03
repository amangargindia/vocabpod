-- Add JSONB column to store overridden preview words
ALTER TABLE sales_config ADD COLUMN IF NOT EXISTS preview_words_data JSONB DEFAULT '[]'::jsonb;
