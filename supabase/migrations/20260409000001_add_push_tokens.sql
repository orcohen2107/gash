-- Issue #12: Remote push notifications — store Expo push tokens
-- Add column to users table to store Expo push token for sending remote notifications

alter table users add column if not exists expo_push_token text;

-- Add index for potential future queries by token
create index if not exists users_expo_push_token_idx on users(expo_push_token);

-- Create table for notification history (optional, for analytics/debugging)
create table if not exists push_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('streak_milestone', 'mission_new', 'insights_ready', 'engagement')),
  title text,
  body text,
  data jsonb,
  sent_at timestamptz default now(),
  delivered_at timestamptz
);

alter table push_notifications enable row level security;
create policy "push_notifications: owner access"
  on push_notifications
  using (auth.uid() = user_id);

-- Index for querying recent notifications
create index push_notifications_user_sent_idx on push_notifications(user_id, sent_at desc);
