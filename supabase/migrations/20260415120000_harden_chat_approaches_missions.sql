-- Harden core data constraints for chat, approaches, weekly missions, and trigger helpers.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

update public.approaches
set response = null
where response is not null
  and response not in ('positive', 'neutral', 'dismissive', 'ignored');

update public.weekly_missions
set target_approach_type = 'direct'
where target_approach_type not in ('direct', 'situational', 'humor', 'online');

with ranked_active_missions as (
  select
    id,
    row_number() over (
      partition by user_id, week_start
      order by created_at desc nulls last, id desc
    ) as rn
  from public.weekly_missions
  where completed = false
)
update public.weekly_missions wm
set
  completed = true,
  completed_at = coalesce(wm.completed_at, now())
from ranked_active_missions ranked
where wm.id = ranked.id
  and ranked.rn > 1;

alter table public.approaches
  add constraint approaches_response_check
  check (
    response is null
    or response in ('positive', 'neutral', 'dismissive', 'ignored')
  ) not valid;

alter table public.approaches
  validate constraint approaches_response_check;

alter table public.weekly_missions
  add constraint weekly_missions_target_approach_type_check
  check (target_approach_type in ('direct', 'situational', 'humor', 'online')) not valid;

alter table public.weekly_missions
  validate constraint weekly_missions_target_approach_type_check;

create unique index if not exists weekly_missions_user_active_week_unique
  on public.weekly_missions (user_id, week_start)
  where completed = false;

create index if not exists chat_messages_user_created_desc_idx
  on public.chat_messages (user_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_insights_updated_at on public.user_insights;
create trigger set_user_insights_updated_at
  before update on public.user_insights
  for each row execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, phone, created_at)
  values (
    new.id,
    new.phone,
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

drop function if exists public.handle_new_auth_user();
