-- Phase 6: Add missing column and mission persistence table

-- Fix 1: Add missing last_approach_date column to user_insights
alter table user_insights
  add column if not exists last_approach_date timestamptz;

-- Fix 2: Create weekly_missions table for mission persistence
create table if not exists weekly_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  target integer not null default 3,
  target_approach_type text not null,
  week_start date not null default date_trunc('week', current_date)::date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table weekly_missions enable row level security;
create policy "weekly_missions: owner access"
  on weekly_missions
  using (auth.uid() = user_id);
create policy "weekly_missions: owner insert"
  on weekly_missions
  for insert
  with check (auth.uid() = user_id);
create policy "weekly_missions: owner update"
  on weekly_missions
  for update
  using (auth.uid() = user_id);

create index weekly_missions_user_week_idx on weekly_missions(user_id, week_start desc);
