-- Avatar uploads: a public storage bucket so users can set a profile photo.
--
-- The profile photo shown in the nav and on public profile pages is stored as
-- a public URL in profiles.avatar_url. The image bytes live here, in the
-- `avatars` storage bucket. Files are namespaced by user id
-- (`{auth.uid()}/{filename}`) so each user can only write to their own folder.

-- 1. Public-read bucket. Reads are public (profile photos are shown to anon
--    visitors on /user/[username]); writes are gated by the policies below.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2. Anyone may read avatar objects (bucket is public, but be explicit).
drop policy if exists "avatars_read_all" on storage.objects;
create policy "avatars_read_all" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

-- 3. A user may write ONLY within their own `{uid}/…` prefix. `storage.foldername`
--    returns the path segments; the first must equal the caller's uid.
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
