-- Gash (גש) — Initial Database Schema
-- Phase 01 Plan 01: Supabase Project Setup
-- Tables: users, approaches, chat_messages, user_insights
-- All tables have RLS enabled with auth.uid() = user_id policies

-- 1. Users table (mirrors auth.users with extra profile fields)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  name text,
  created_at timestamptz default now()
);

alter table users enable row level security;
create policy "users: owner access"
  on users
  using (auth.uid() = id);
create policy "users: owner insert"
  on users
  for insert
  with check (auth.uid() = id);

-- 2. Enums
create type approach_type as enum ('direct', 'situational', 'humor', 'online');
create type follow_up_type as enum ('meeting', 'text', 'instagram', 'nothing');

-- 3. Approaches table
create table if not exists approaches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  location text,
  approach_type approach_type not null,
  opener text,
  response text,
  chemistry_score integer check (chemistry_score between 1 and 10),
  follow_up follow_up_type,
  notes text,
  created_at timestamptz default now()
);

alter table approaches enable row level security;
create policy "approaches: owner access"
  on approaches
  using (auth.uid() = user_id);
create policy "approaches: owner insert"
  on approaches
  for insert
  with check (auth.uid() = user_id);
create policy "approaches: owner update"
  on approaches
  for update
  using (auth.uid() = user_id);
create policy "approaches: owner delete"
  on approaches
  for delete
  using (auth.uid() = user_id);

-- Index for journal queries (user's approaches sorted by date)
create index approaches_user_date_idx on approaches(user_id, date desc);

-- 4. Chat messages table
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table chat_messages enable row level security;
create policy "chat_messages: owner access"
  on chat_messages
  using (auth.uid() = user_id);
create policy "chat_messages: owner insert"
  on chat_messages
  for insert
  with check (auth.uid() = user_id);

-- Index for chat history queries (last N messages)
create index chat_messages_user_created_idx on chat_messages(user_id, created_at);

-- 5. User insights table
create table if not exists user_insights (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_mission jsonb,
  missions_completed integer default 0,
  streak integer default 0,
  last_analysis_at timestamptz,
  onboarding_data jsonb,
  updated_at timestamptz default now()
);

alter table user_insights enable row level security;
create policy "user_insights: owner access"
  on user_insights
  using (auth.uid() = user_id);
create policy "user_insights: owner insert"
  on user_insights
  for insert
  with check (auth.uid() = user_id);
create policy "user_insights: owner update"
  on user_insights
  for update
  using (auth.uid() = user_id);
