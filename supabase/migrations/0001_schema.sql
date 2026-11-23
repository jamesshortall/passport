-- ===========================================================================
-- AppPassport — core schema
-- Covers the full data model (core + Phase 2 tables) so no restructuring is
-- needed later. RLS policies live in 0002_rls.sql; triggers in 0003.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --- Enums -----------------------------------------------------------------
do $$ begin
  create type country_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_works as enum ('yes', 'no', 'partial');
exception when duplicate_object then null; end $$;

do $$ begin
  create type setup_effort as enum ('none', 'before_you_land', 'hard_needs_local_id');
exception when duplicate_object then null; end $$;

do $$ begin
  create type severity as enum ('blocked', 'unreliable', 'works_with_caveats', 'works_fine');
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open', 'reviewed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type proposal_status as enum ('pending', 'applied', 'rejected');
exception when duplicate_object then null; end $$;

-- --- profiles (linked to auth.users) ---------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  role user_role not null default 'user',
  approval_status approval_status not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- --- app_categories --------------------------------------------------------
create table if not exists public.app_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

-- --- apps (Phase 2 canonical app inventory) --------------------------------
create table if not exists public.apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid references public.app_categories(id) on delete set null,
  logo_url text,
  created_at timestamptz not null default now()
);

-- --- countries -------------------------------------------------------------
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  flag_emoji text,
  region text,
  status country_status not null default 'draft',
  country_alert text,
  country_alert_detail text,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists countries_status_idx on public.countries(status);
create index if not exists countries_region_idx on public.countries(region);

-- --- country_apps (one row per US-app -> local-alternative mapping) ---------
create table if not exists public.country_apps (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  category_id uuid not null references public.app_categories(id) on delete restrict,
  -- Phase 2: canonical app reference. Nullable so free-text still works during
  -- transition; us_app_name is kept as a denormalised display fallback.
  us_app_id uuid references public.apps(id) on delete set null,
  us_app_name text not null,
  us_app_works app_works not null default 'no',
  local_alternative_name text,
  why_short text not null,
  setup_effort setup_effort not null default 'none',
  detail_paragraph text,
  severity severity not null default 'works_fine',
  app_store_link text,
  last_verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists country_apps_country_idx on public.country_apps(country_id);
create index if not exists country_apps_category_idx on public.country_apps(category_id);
create index if not exists country_apps_app_idx on public.country_apps(us_app_id);

-- --- favorites (Phase 2: saved countries) ----------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_id uuid not null references public.countries(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, country_id)
);

-- --- change_log (Phase 2: update feed) -------------------------------------
create table if not exists public.change_log (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete cascade,
  app_id uuid references public.country_apps(id) on delete set null,
  change_summary text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);
create index if not exists change_log_changed_at_idx on public.change_log(changed_at desc);
create index if not exists change_log_country_idx on public.change_log(country_id);

-- --- reports (Phase 2: "report outdated") ----------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  country_apps_id uuid references public.country_apps(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  note text,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports(status);

-- --- refresh_proposals (AI-assisted refresh staged diffs) ------------------
-- Stores the AI-proposed field-level diff for an existing country. Nothing
-- here is ever auto-published; an admin approves/rejects fields, then the
-- approved values are written to live country_apps rows by server code.
create table if not exists public.refresh_proposals (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  -- proposed diff: [{ country_apps_id, field, old_value, new_value }, ...]
  -- (country_apps_id null => a brand-new proposed entry)
  proposed jsonb not null,
  status proposal_status not null default 'pending',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create index if not exists refresh_proposals_country_idx on public.refresh_proposals(country_id);
create index if not exists refresh_proposals_status_idx on public.refresh_proposals(status);
