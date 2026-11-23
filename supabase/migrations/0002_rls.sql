-- ===========================================================================
-- AppPassport — Row Level Security
--
-- Security model:
--   * Public (anon + authenticated) may READ only PUBLISHED countries and
--     their apps. Draft countries are excluded at the DB level, not the UI.
--   * Admins (profiles.role = 'admin') have full write access to content.
--   * Authenticated-only features (favorites) require an APPROVED profile.
--   * Anonymous "report outdated" submissions are allowed without an account.
-- ===========================================================================

-- --- Helper functions (SECURITY DEFINER to avoid RLS recursion) ------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
      and p.approval_status = 'approved'
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.approval_status = 'approved'
  );
$$;

-- --- Enable RLS everywhere --------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.app_categories    enable row level security;
alter table public.apps              enable row level security;
alter table public.countries         enable row level security;
alter table public.country_apps      enable row level security;
alter table public.favorites         enable row level security;
alter table public.change_log        enable row level security;
alter table public.reports           enable row level security;
alter table public.refresh_proposals enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select using (user_id = auth.uid() or public.is_admin());

-- The signup trigger inserts the row (SECURITY DEFINER), but also allow a user
-- to create their own profile row defensively.
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (user_id = auth.uid());

-- Only admins may change approval status / roles.
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- app_categories — public read, admin write
-- ---------------------------------------------------------------------------
drop policy if exists categories_select_all on public.app_categories;
create policy categories_select_all on public.app_categories
  for select using (true);

drop policy if exists categories_write_admin on public.app_categories;
create policy categories_write_admin on public.app_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- apps — public read, admin write
-- ---------------------------------------------------------------------------
drop policy if exists apps_select_all on public.apps;
create policy apps_select_all on public.apps
  for select using (true);

drop policy if exists apps_write_admin on public.apps;
create policy apps_write_admin on public.apps
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- countries — published readable by everyone; drafts admin-only
-- ---------------------------------------------------------------------------
drop policy if exists countries_select_published on public.countries;
create policy countries_select_published on public.countries
  for select using (status = 'published' or public.is_admin());

drop policy if exists countries_write_admin on public.countries;
create policy countries_write_admin on public.countries
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- country_apps — visible only when parent country is published (or admin)
-- ---------------------------------------------------------------------------
drop policy if exists country_apps_select_published on public.country_apps;
create policy country_apps_select_published on public.country_apps
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.countries c
      where c.id = country_apps.country_id
        and c.status = 'published'
    )
  );

drop policy if exists country_apps_write_admin on public.country_apps;
create policy country_apps_write_admin on public.country_apps
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- favorites — an APPROVED user manages only their own rows
-- ---------------------------------------------------------------------------
drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites
  for select using (user_id = auth.uid() and public.is_approved());

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites
  for insert with check (user_id = auth.uid() and public.is_approved());

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites
  for delete using (user_id = auth.uid() and public.is_approved());

-- ---------------------------------------------------------------------------
-- change_log — public read (powers /updates), admin write
-- ---------------------------------------------------------------------------
drop policy if exists change_log_select_all on public.change_log;
create policy change_log_select_all on public.change_log
  for select using (true);

drop policy if exists change_log_write_admin on public.change_log;
create policy change_log_write_admin on public.change_log
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- reports — anyone (incl. anonymous) may submit; only admins read/triage
-- ---------------------------------------------------------------------------
drop policy if exists reports_insert_anyone on public.reports;
create policy reports_insert_anyone on public.reports
  for insert with check (
    -- anonymous report: no user_id; account report: must be the caller
    user_id is null or user_id = auth.uid()
  );

drop policy if exists reports_select_admin on public.reports;
create policy reports_select_admin on public.reports
  for select using (public.is_admin());

drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- refresh_proposals — admin only
-- ---------------------------------------------------------------------------
drop policy if exists refresh_proposals_admin on public.refresh_proposals;
create policy refresh_proposals_admin on public.refresh_proposals
  for all using (public.is_admin()) with check (public.is_admin());
