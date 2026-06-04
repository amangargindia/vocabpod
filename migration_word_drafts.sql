-- Migration: Create word_drafts table for admin cross-device draft sync
-- Run this in the Supabase SQL editor

create table if not exists public.word_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null default '',
  status text not null default 'idea',
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, word)
);

-- Enable Row Level Security
alter table public.word_drafts enable row level security;

-- Admin users can only see and manage their own drafts
create policy "Admin can manage own drafts"
  on public.word_drafts
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists word_drafts_user_id_idx on public.word_drafts(user_id);
create index if not exists word_drafts_status_idx on public.word_drafts(status);
