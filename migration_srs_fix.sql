-- ============================================================
-- VocabPod SRS & Data Integrity Migration
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================

-- 1. Add next_review_at to user_progress (the column the API writes to)
--    Note: schema had 'next_review_due' but API code uses 'next_review_at'
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS next_review_at timestamptz DEFAULT now();

-- Copy any data from next_review_due if that column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'next_review_due'
  ) THEN
    UPDATE public.user_progress
    SET next_review_at = next_review_due
    WHERE next_review_due IS NOT NULL;
  END IF;
END $$;

-- 2. Add review_count (total quiz attempts per word)
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- 3. Add xp_earned (XP awarded for this specific word, for weekly chart)
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS xp_earned integer DEFAULT 0;

-- 4. Add first_completed_at (timestamp of FIRST correct answer, for XP dedup)
--    NULL = word was never completed correctly before
--    Set = word was already learned, XP was already awarded
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS first_completed_at timestamptz;

-- Backfill first_completed_at for rows already marked is_completed = true
UPDATE public.user_progress
SET first_completed_at = last_reviewed_at
WHERE is_completed = true
  AND first_completed_at IS NULL;

-- 5. Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_xp integer default 0 not null,
  streak_count integer default 0 not null,
  last_active_date date,
  phone text,
  display_name text,
  total_words_learned integer default 0 not null,
  updated_at timestamptz default now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.user_profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.user_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.user_profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Add total_words_learned column to user_profiles if missing
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS total_words_learned integer DEFAULT 0;

-- 7. Backfill total_words_learned from existing progress data
UPDATE public.user_profiles up
SET total_words_learned = (
  SELECT COUNT(*) FROM public.user_progress upr
  WHERE upr.user_id = up.user_id AND upr.is_completed = true
)
WHERE up.total_words_learned = 0;

SELECT 'Migration complete.' as status;
