-- ============================================================
-- VocabPod users_subscriptions Table + Complete Schema Fix
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / DO $$)
-- ============================================================

-- 1. Create users_subscriptions table if missing
CREATE TABLE IF NOT EXISTS public.users_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_customer_id text,
  razorpay_order_id text,
  razorpay_subscription_id text,
  is_premium boolean DEFAULT false NOT NULL,
  renews_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.users_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users_subscriptions' AND policyname = 'Users can view own subscription'
  ) THEN
    CREATE POLICY "Users can view own subscription"
      ON public.users_subscriptions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2. Ensure next_review_at exists on user_progress (from migration_srs_fix.sql)
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS next_review_at timestamptz DEFAULT now();

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS xp_earned integer DEFAULT 0;

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS first_completed_at timestamptz;

-- Backfill first_completed_at
UPDATE public.user_progress
SET first_completed_at = last_reviewed_at
WHERE is_completed = true AND first_completed_at IS NULL;

-- 3. Ensure user_profiles exists with all required columns
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer DEFAULT 0 NOT NULL,
  streak_count integer DEFAULT 0 NOT NULL,
  last_active_date date,
  phone text,
  display_name text,
  total_words_learned integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now(),
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

-- 4. Add missing columns to user_profiles if not present
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS total_words_learned integer DEFAULT 0;

-- 5. Ensure words table has optional columns used by the app
ALTER TABLE public.words ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE public.words ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.words ADD COLUMN IF NOT EXISTS is_free_preview boolean DEFAULT false;
ALTER TABLE public.words ADD COLUMN IF NOT EXISTS story text;
ALTER TABLE public.words ADD COLUMN IF NOT EXISTS real_life_usage jsonb;
ALTER TABLE public.words ADD COLUMN IF NOT EXISTS stickman_id text;
ALTER TABLE public.words ADD COLUMN IF NOT EXISTS custom_image_url text;
ALTER TABLE public.words ADD COLUMN IF NOT EXISTS custom_svg text;

-- 6. Backfill total_words_learned
UPDATE public.user_profiles up
SET total_words_learned = (
  SELECT COUNT(*) FROM public.user_progress upr
  WHERE upr.user_id = up.user_id AND upr.is_completed = true
)
WHERE up.total_words_learned = 0;

-- 7. Fix renews_at and razorpay_subscription_id columns in users_subscriptions (in case columns were missing)
ALTER TABLE public.users_subscriptions ADD COLUMN IF NOT EXISTS renews_at timestamptz;
ALTER TABLE public.users_subscriptions ADD COLUMN IF NOT EXISTS razorpay_subscription_id text;

SELECT 'Full schema migration complete.' as status;
