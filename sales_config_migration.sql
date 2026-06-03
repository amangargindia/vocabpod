-- Migration: Create sales_config table for landing page content management
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS sales_config (
  id INT PRIMARY KEY DEFAULT 1,
  preview_word_ids TEXT[] DEFAULT '{}',
  screenshots JSONB DEFAULT '[]',
  founder_photo_url TEXT,
  intro_video_url TEXT,
  intro_video_hidden BOOLEAN DEFAULT false,
  faqs JSONB DEFAULT '[]',
  testimonials JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the single default config row
INSERT INTO sales_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Grant read access to anon (for the public landing page endpoint)
GRANT SELECT ON sales_config TO anon;
GRANT SELECT ON sales_config TO authenticated;
