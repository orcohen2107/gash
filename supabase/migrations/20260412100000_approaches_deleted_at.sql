-- Soft delete: server filters with .is('deleted_at', null); DELETE sets deleted_at

alter table public.approaches
  add column if not exists deleted_at timestamptz null;

create index if not exists approaches_user_active_date_idx
  on public.approaches (user_id, date desc)
  where deleted_at is null;
