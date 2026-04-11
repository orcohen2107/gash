-- expo_push_token is optional until the client registers for push notifications.
-- Partial profile upserts must not fail when this column is unset.
alter table public.users alter column expo_push_token drop not null;
