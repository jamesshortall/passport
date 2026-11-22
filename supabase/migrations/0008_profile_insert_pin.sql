-- 0008: pin role / approval status on self-inserted profiles.
--
-- `profiles_insert_own` (0002) only checked `user_id = auth.uid()`. Profiles are
-- normally created by the signup trigger, but if a user ever inserts their own
-- row directly they must not be able to choose role='admin' or
-- approval_status='approved'. Pin every privileged column to its default.

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (
    user_id = auth.uid()
    and role = 'user'
    and approval_status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );
