-- Trigger: auto-create a row in public.users whenever a new auth user is created.
-- This ensures public.users is always populated regardless of whether saveProfile() succeeds.
-- name and age remain null until the user completes registration via /api/user/profile.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
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
  for each row execute procedure public.handle_new_auth_user();
