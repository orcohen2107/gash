-- Add mode column to chat_messages to support per-mode conversation history
alter table public.chat_messages
  add column if not exists mode text not null default 'coach'
  check (mode in ('coach', 'practice', 'debrief-chat'));

-- Index for efficient per-user per-mode queries (history endpoint)
create index if not exists chat_messages_user_mode_created_idx
  on public.chat_messages (user_id, mode, created_at desc);

comment on column public.chat_messages.mode is
  'Coach tab mode: coach (free chat), practice (situation roleplay), debrief-chat (approach debrief)';
