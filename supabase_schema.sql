-- Create the words table
create table public.words (
    id uuid primary key default gen_random_uuid(),
    word text not null unique,
    phonetic text not null,
    type text not null,
    definition text not null,
    narrative text not null,
    audio_url text not null,
    svg_elements jsonb not null, -- Stores raw inner SVG elements hierarchy
    quiz_questions jsonb not null, -- Stores array of active recall quiz questions
    created_at timestamp with time zone default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.words enable row level security;

-- Create a policy that allows anyone to read words (select policy)
create policy "Allow public read access to words" 
on public.words 
for select 
using (true);

-- Insert dummy data for ephemeral
insert into public.words (word, phonetic, type, definition, narrative, audio_url, svg_elements, quiz_questions)
values (
    'ephemeral',
    '/ɪˈfemərəl/',
    'adjective',
    'Lasting for a very short time; transient; fleeting.',
    'Think of the word **ephemeral** like the brief, beautiful journey of a **dandelion seed** floating in the wind. A sudden gust sweeps it into the sky, but its flight is momentary. Within seconds, it lands and dissolves into the earth. The entire beauty of its existence lies in how rapidly it passes. On VocabPod, we anchor this fleeting nature directly to the single **Terracotta Red** seed breaking away from the static cluster.',
    'https://www.w3schools.com/html/horse.mp3',
    '[
      {"tag": "path", "props": {"d": "M 200 280 Q 190 220 200 150", "fill": "none", "stroke": "#F5F5F7", "strokeWidth": "2.5", "strokeLinecap": "round", "opacity": "0.8"}},
      {"tag": "circle", "props": {"cx": "200", "cy": "150", "r": "8", "fill": "none", "stroke": "#F5F5F7", "strokeWidth": "2", "opacity": "0.8"}},
      {"tag": "line", "props": {"x1": "200", "y1": "142", "x2": "200", "y2": "110", "stroke": "#8E8E93", "strokeWidth": "1.5", "strokeLinecap": "round", "opacity": "0.5"}},
      {"tag": "line", "props": {"x1": "208", "y1": "150", "x2": "240", "y2": "150", "stroke": "#8E8E93", "strokeWidth": "1.5", "strokeLinecap": "round", "opacity": "0.5"}},
      {"tag": "line", "props": {"x1": "192", "y1": "150", "x2": "160", "y2": "150", "stroke": "#8E8E93", "strokeWidth": "1.5", "strokeLinecap": "round", "opacity": "0.5"}},
      {"tag": "line", "props": {"x1": "206", "y1": "144", "x2": "228", "y2": "122", "stroke": "#8E8E93", "strokeWidth": "1.5", "strokeLinecap": "round", "opacity": "0.5"}},
      {"tag": "line", "props": {"x1": "194", "y1": "144", "x2": "172", "y2": "122", "stroke": "#8E8E93", "strokeWidth": "1.5", "strokeLinecap": "round", "opacity": "0.5"}},
      {"tag": "line", "props": {"x1": "206", "y1": "156", "x2": "228", "y2": "178", "stroke": "#8E8E93", "strokeWidth": "1.5", "strokeLinecap": "round", "opacity": "0.5"}},
      {"tag": "line", "props": {"x1": "194", "y1": "156", "x2": "172", "y2": "178", "stroke": "#8E8E93", "strokeWidth": "1.5", "strokeLinecap": "round", "opacity": "0.5"}},
      {"tag": "circle", "props": {"cx": "200", "cy": "108", "r": "2.5", "fill": "#8E8E93", "opacity": "0.6"}},
      {"tag": "circle", "props": {"cx": "242", "cy": "150", "r": "2.5", "fill": "#8E8E93", "opacity": "0.6"}},
      {"tag": "circle", "props": {"cx": "158", "cy": "150", "r": "2.5", "fill": "#8E8E93", "opacity": "0.6"}},
      {"tag": "circle", "props": {"cx": "230", "cy": "120", "r": "2.5", "fill": "#8E8E93", "opacity": "0.6"}},
      {"tag": "circle", "props": {"cx": "170", "cy": "120", "r": "2.5", "fill": "#8E8E93", "opacity": "0.6"}},
      {
        "tag": "g",
        "props": {"stroke": "#E04B35", "strokeWidth": "2", "strokeLinecap": "round", "fill": "none"},
        "children": [
          {"tag": "path", "props": {"d": "M 200 150 Q 230 110 270 80"}},
          {"tag": "circle", "props": {"cx": "270", "cy": "80", "r": "4.5", "fill": "#E04B35", "stroke": "none"}},
          {"tag": "circle", "props": {"cx": "270", "cy": "80", "r": "10", "fill": "#E04B35", "fillOpacity": "0.15", "stroke": "none"}},
          {"tag": "path", "props": {"d": "M 200 150 Q 250 80 305 55", "strokeWidth": "2.5"}},
          {"tag": "circle", "props": {"cx": "305", "cy": "55", "r": "5", "fill": "#E04B35", "stroke": "none"}},
          {"tag": "circle", "props": {"cx": "305", "cy": "55", "r": "12", "fill": "#E04B35", "fillOpacity": "0.15", "stroke": "none"}},
          {"tag": "path", "props": {"d": "M 200 150 Q 260 140 325 125", "strokeWidth": "1.8"}},
          {"tag": "circle", "props": {"cx": "325", "cy": "125", "r": "4", "fill": "#E04B35", "stroke": "none"}},
          {"tag": "circle", "props": {"cx": "325", "cy": "125", "r": "8", "fill": "#E04B35", "fillOpacity": "0.15", "stroke": "none"}}
        ]
      }
    ]',
    '[
      {
        "question": "Which of the following is the best example of something ephemeral?",
        "options": [
          {"text": "A granite monument standing in a city square.", "isCorrect": false},
          {"text": "A delicate soap bubble floating in a summer breeze.", "isCorrect": true},
          {"text": "An ancient oak tree deep in a national forest.", "isCorrect": false},
          {"text": "A plastic bottle sitting in a recycling bin.", "isCorrect": false}
        ],
        "explanation": "A soap bubble is the definition of ephemeral—it exists for only a few seconds before popping and vanishing forever, unlike granite monuments or ancient trees which are built to last."
      }
    ]'
) ON CONFLICT (word) DO NOTHING;

-- Create user_progress table for tracking SRS learning states
create table public.user_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    word_slug text not null references public.words(word) on delete cascade,
    is_completed boolean default false,
    quiz_score smallint default 0,
    ease_factor real default 2.5,
    interval_days real default 1.0,
    last_reviewed_at timestamp with time zone default now(),
    next_review_due timestamp with time zone default now(),
    created_at timestamp with time zone default now() not null,
    
    unique(user_id, word_slug)
);

-- Enable RLS for user_progress
alter table public.user_progress enable row level security;

-- Policies for user_progress (Users can only see and edit their own progress)
create policy "Users can view own progress" 
on public.user_progress for select 
using (auth.uid() = user_id);

create policy "Users can insert own progress" 
on public.user_progress for insert 
with check (auth.uid() = user_id);

create policy "Users can update own progress" 
on public.user_progress for update 
using (auth.uid() = user_id) 
with check (auth.uid() = user_id);
