-- תמונת פרופיל: URL ציבורי אחרי העלאה ל-Storage
alter table public.users add column if not exists avatar_url text;

-- באקט ציבורי לקריאה; העלאה רק דרך השרת (service role)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- קריאה ציבורית לקבצים בבאקט (ה-URL ציבורי בכל מקרה)
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');
