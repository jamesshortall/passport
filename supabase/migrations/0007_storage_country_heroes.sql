-- ===========================================================================
-- AppPassport — storage bucket for admin-uploaded country hero images
-- Public read (images render on public country pages); admin-only write.
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'country-heroes', 'country-heroes', true, 8388608,
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

drop policy if exists country_heroes_public_read on storage.objects;
create policy country_heroes_public_read on storage.objects
  for select using (bucket_id = 'country-heroes');

drop policy if exists country_heroes_admin_write on storage.objects;
create policy country_heroes_admin_write on storage.objects
  for all
  using (bucket_id = 'country-heroes' and public.is_admin())
  with check (bucket_id = 'country-heroes' and public.is_admin());
