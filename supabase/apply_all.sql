-- ==========================================================================
-- AppPassport — combined migration script (apply once, top to bottom).
-- Paste into the Supabase SQL Editor for the AppPassport project and Run.
-- Equivalent to running migrations/0001..0007 in order.
-- ==========================================================================

-- ----- migrations/0001_schema.sql -----
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


-- ----- migrations/0002_rls.sql -----
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


-- ----- migrations/0003_functions_triggers.sql -----
-- ===========================================================================
-- AppPassport — functions & triggers
-- ===========================================================================

-- --- Create a pending profile row automatically on every new signup --------
-- Applies to BOTH email/password and OAuth (Google) signups. Never
-- auto-approves — approval_status defaults to 'pending'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, approval_status, role)
  values (new.id, new.email, 'pending', 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- Keep countries.last_updated fresh on any change -----------------------
create or replace function public.touch_country_last_updated()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

drop trigger if exists trg_country_touch on public.countries;
create trigger trg_country_touch
  before update on public.countries
  for each row execute function public.touch_country_last_updated();

-- --- Bump last_verified_at + parent country whenever a country_app changes --
create or replace function public.touch_country_app_verified()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.last_verified_at = now();
  return new;
end;
$$;

drop trigger if exists trg_country_app_touch on public.country_apps;
create trigger trg_country_app_touch
  before update on public.country_apps
  for each row execute function public.touch_country_app_verified();

-- --- Promote a user to admin by email (run once for the first admin) --------
-- Usage:  select public.promote_to_admin('jim@shortall.us');
create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where email = target_email limit 1;
  if uid is null then
    raise exception 'No auth user with email %', target_email;
  end if;

  insert into public.profiles (user_id, email, role, approval_status, reviewed_at)
  values (uid, target_email, 'admin', 'approved', now())
  on conflict (user_id)
  do update set role = 'admin', approval_status = 'approved', reviewed_at = now();
end;
$$;


-- ----- migrations/0004_seed.sql -----
-- ===========================================================================
-- AppPassport — seed data
--
-- NOTE: This is PLACEHOLDER research for demonstration. App-availability facts
-- change quickly (VPN access, payment rails, etc.). Verify against live
-- research before treating any of this as launch-ready. Jim's real research
-- summary should replace these rows.
-- ===========================================================================

-- --- Categories ------------------------------------------------------------
insert into public.app_categories (name, sort_order) values
  ('Payments', 10),
  ('Messaging', 20),
  ('Maps & Navigation', 30),
  ('Ride-hailing', 40),
  ('Internet Access', 50),
  ('Social Media Access', 60)
on conflict (name) do nothing;

-- --- Countries -------------------------------------------------------------
insert into public.countries (name, slug, flag_emoji, region, status, country_alert, country_alert_detail) values
  ('China', 'china', '🇨🇳', 'Asia', 'published',
    'China''s "Great Firewall" blocks most Western apps. Set up a VPN and local payment apps BEFORE you arrive — you cannot download them once inside.',
    'Google (Search, Maps, Gmail), WhatsApp, Instagram, Facebook, X/Twitter and many news sites are blocked. A reputable VPN installed before arrival is the usual workaround, though reliability varies and rules can change without notice. Mobile payment is dominated by Alipay and WeChat Pay; both now let foreign visitors link international cards, but set this up in advance.'),
  ('Thailand', 'thailand', '🇹🇭', 'Asia', 'published',
    null, null),
  ('Japan', 'japan', '🇯🇵', 'Asia', 'published',
    null, null),
  ('Mexico', 'mexico', '🇲🇽', 'North America', 'published',
    null, null),
  ('France', 'france', '🇫🇷', 'Europe', 'published',
    null, null),
  ('Germany', 'germany', '🇩🇪', 'Europe', 'published',
    'Germany is heavily cash-preferred. Many restaurants, bakeries and small shops still do not accept cards — carry euros in cash.',
    'Contactless and mobile payments have grown, but a surprising number of smaller businesses remain cash-only or card-only-above-a-minimum. Withdraw cash from bank ATMs to avoid poor exchange rates.'),
  ('Italy', 'italy', '🇮🇹', 'Europe', 'published',
    null, null),
  ('Spain', 'spain', '🇪🇸', 'Europe', 'published',
    null, null),
  ('Liberia', 'liberia', '🇱🇷', 'Africa', 'published',
    'Liberia runs largely on cash and mobile money. Card acceptance is rare outside major hotels, and digital coverage is limited — plan to carry US dollars and Liberian dollars.',
    'Point-of-sale card terminals are uncommon; USSD-based mobile money (e.g. carrier wallets) is far more widely used than app-based payments. Data coverage is patchy outside Monrovia, so download maps and essentials offline before you travel.')
on conflict (slug) do nothing;

-- --- Helper: seed country_apps via slug/name lookups -----------------------
-- China -------------------------------------------------------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  ((select id from countries where slug='china'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'partial', 'Alipay / WeChat Pay', 'Cards work at some spots, but locals pay by QR. Link a Visa/Mastercard inside Alipay or WeChat Pay before you go.',
   'before_you_land', 'works_with_caveats',
   'Alipay and WeChat Pay both support foreign cards for visitors now. Set it up before arrival; some small vendors are cash- or QR-only.'),
  ((select id from countries where slug='china'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'no', 'WeChat', 'WhatsApp is blocked by the firewall. Everyone in China uses WeChat for messaging.',
   'before_you_land', 'blocked',
   'WhatsApp, Messenger and Signal are unreliable-to-blocked. WeChat is the de-facto standard and also handles payments, so most travelers install it before arriving.'),
  ((select id from countries where slug='china'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'no', 'Amap (高德地图) / Apple Maps', 'Google Maps is blocked and inaccurate in China. Use Amap or Apple Maps.',
   'before_you_land', 'blocked',
   'Google services are blocked. Apple Maps works reasonably for visitors; Amap and Baidu Maps are the local standards but are Chinese-language first.'),
  ((select id from countries where slug='china'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'no', 'DiDi', 'Uber left China. DiDi is the dominant ride-hailing app and has an English interface.',
   'before_you_land', 'blocked', null),
  ((select id from countries where slug='china'), (select id from app_categories where name='Internet Access'),
   'Google / Gmail', 'no', 'VPN required', 'Google, Gmail and most Western sites are blocked. Install a trusted VPN before you arrive.',
   'before_you_land', 'blocked',
   'You cannot download most VPN apps once inside China, so install and test one before you fly. VPN reliability fluctuates, especially around sensitive dates.'),
  ((select id from countries where slug='china'), (select id from app_categories where name='Social Media Access'),
   'Instagram', 'no', null, 'Instagram, Facebook and X are blocked. Access requires a VPN.',
   'before_you_land', 'blocked', null);

-- Thailand ----------------------------------------------------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  ((select id from countries where slug='thailand'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'partial', 'LINE', 'WhatsApp works, but almost everyone in Thailand communicates on LINE — hotels and tour operators included.',
   'before_you_land', 'works_with_caveats', null),
  ((select id from countries where slug='thailand'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'no', 'Grab / Bolt', 'Uber merged into Grab in SE Asia. Use Grab (or Bolt) for rides and food delivery.',
   'before_you_land', 'blocked', null),
  ((select id from countries where slug='thailand'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works well in Thailand, including transit and Grab integration.',
   'none', 'works_fine', null),
  ((select id from countries where slug='thailand'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'partial', 'PromptPay QR', 'Cards work in cities, but street vendors and markets prefer PromptPay QR or cash.',
   'none', 'works_with_caveats', null);

-- Japan -------------------------------------------------------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  ((select id from countries where slug='japan'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'partial', 'LINE', 'WhatsApp works but is rarely used. LINE is the standard messaging app in Japan.',
   'before_you_land', 'works_with_caveats', null),
  ((select id from countries where slug='japan'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'yes', 'Suica (in Apple Wallet)', 'Apple Pay works, and you can add a Suica transit card to Apple Wallet for trains and convenience stores.',
   'before_you_land', 'works_fine',
   'Japan is still cash-friendly, but Apple Pay + Suica covers trains, vending machines and konbini. Add a Suica card in Apple Wallet before or on arrival.'),
  ((select id from countries where slug='japan'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works excellently in Japan, with detailed train and subway routing.',
   'none', 'works_fine', null),
  ((select id from countries where slug='japan'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'partial', 'GO / DiDi', 'Uber exists but mostly books regular taxis and is limited. The GO taxi app is more widely used.',
   'before_you_land', 'works_with_caveats', null);

-- Mexico ------------------------------------------------------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  ((select id from countries where slug='mexico'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'yes', 'DiDi', 'Uber works well in most Mexican cities. DiDi is a common, often cheaper alternative.',
   'none', 'works_fine', null),
  ((select id from countries where slug='mexico'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'yes', null, 'WhatsApp is the default way people communicate in Mexico — businesses included.',
   'none', 'works_fine', null),
  ((select id from countries where slug='mexico'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works well; download offline maps for rural areas with spotty coverage.',
   'none', 'works_fine', null),
  ((select id from countries where slug='mexico'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'partial', 'Cash (pesos)', 'Cards and Apple Pay work in cities, but markets, taxis and small towns are cash-first.',
   'none', 'works_with_caveats', null);

-- France / Germany / Italy / Spain (EU, per-country) ----------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  -- France
  ((select id from countries where slug='france'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'yes', null, 'Apple Pay and contactless cards are widely accepted across France.',
   'none', 'works_fine', null),
  ((select id from countries where slug='france'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'yes', 'Bolt / FREE NOW', 'Uber works in Paris and major cities; Bolt and FREE NOW are common alternatives.',
   'none', 'works_fine', null),
  ((select id from countries where slug='france'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works well, including SNCF trains and Paris Métro routing.',
   'none', 'works_fine', null),
  ((select id from countries where slug='france'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'yes', null, 'WhatsApp is widely used across France for personal and some business messaging.',
   'none', 'works_fine', null),
  -- Germany
  ((select id from countries where slug='germany'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'partial', 'Cash (euros)', 'Apple Pay works at chains, but many small shops and restaurants are cash-only. Carry euros.',
   'none', 'works_with_caveats',
   'Germany''s cash preference surprises many US visitors. Bakeries, some restaurants and market stalls may refuse cards entirely.'),
  ((select id from countries where slug='germany'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'partial', 'FREE NOW / Bolt', 'Uber operates in big cities but mainly dispatches licensed taxis. FREE NOW is widely used.',
   'none', 'works_with_caveats', null),
  ((select id from countries where slug='germany'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', 'DB Navigator', 'Google Maps works well; the DB Navigator app is best for national rail tickets and delays.',
   'none', 'works_fine', null),
  -- Italy
  ((select id from countries where slug='italy'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'yes', null, 'Apple Pay and contactless are broadly accepted; keep some cash for small cafés and rural spots.',
   'none', 'works_fine', null),
  ((select id from countries where slug='italy'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'partial', 'FREE NOW / itTaxi', 'Uber is limited (mostly Uber Black in a few cities). Locals use FREE NOW or itTaxi.',
   'none', 'works_with_caveats', null),
  ((select id from countries where slug='italy'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works well, including Trenitalia and city transit.',
   'none', 'works_fine', null),
  -- Spain
  ((select id from countries where slug='spain'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'yes', null, 'Apple Pay and contactless are widely accepted across Spain.',
   'none', 'works_fine', null),
  ((select id from countries where slug='spain'), (select id from app_categories where name='Ride-hailing'),
   'Uber', 'partial', 'Cabify / FREE NOW / Bolt', 'Uber works in Madrid and some cities but is restricted in others; Cabify is a strong local option.',
   'none', 'works_with_caveats', null),
  ((select id from countries where slug='spain'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'yes', null, 'Google Maps works well, including Renfe and metro routing.',
   'none', 'works_fine', null);

-- Liberia -----------------------------------------------------------------
insert into public.country_apps
  (country_id, category_id, us_app_name, us_app_works, local_alternative_name, why_short, setup_effort, severity, detail_paragraph)
values
  ((select id from countries where slug='liberia'), (select id from app_categories where name='Payments'),
   'Apple Pay', 'no', 'Cash / mobile money (USSD)', 'Card terminals are rare. Most transactions are cash (USD & LRD) or carrier mobile money via USSD codes.',
   'before_you_land', 'blocked',
   'Bring US dollars and exchange for Liberian dollars locally. Mobile money is common but runs over USSD, not apps — a local SIM helps.'),
  ((select id from countries where slug='liberia'), (select id from app_categories where name='Messaging'),
   'WhatsApp', 'yes', null, 'WhatsApp is the main way people communicate in Liberia where data is available.',
   'none', 'works_fine', null),
  ((select id from countries where slug='liberia'), (select id from app_categories where name='Maps & Navigation'),
   'Google Maps', 'partial', 'Offline maps (maps.me)', 'Coverage is thin outside Monrovia. Download offline maps before you travel.',
   'before_you_land', 'works_with_caveats', null),
  ((select id from countries where slug='liberia'), (select id from app_categories where name='Internet Access'),
   'Mobile data', 'partial', 'Local SIM (Orange / Lonestar)', 'Roaming is expensive and patchy. A local prepaid SIM is the practical option for data.',
   'before_you_land', 'works_with_caveats', null);


-- ----- migrations/0005_security_hardening.sql -----
-- ===========================================================================
-- AppPassport — security hardening (Supabase advisor follow-up)
--
-- PostgREST exposes every function in the `public` schema as an RPC endpoint.
-- These grants ensure privileged functions can't be called from the public API.
-- ===========================================================================

-- promote_to_admin must NOT be callable via the public REST API — otherwise any
-- anon/authenticated caller could escalate themselves to admin. Only the table
-- owner (SQL editor) or service_role should ever run it.
revoke all on function public.promote_to_admin(text) from public;
revoke all on function public.promote_to_admin(text) from anon;
revoke all on function public.promote_to_admin(text) from authenticated;

-- handle_new_user is a trigger function; it never needs to be RPC-callable.
-- Triggers run as the table owner, so revoking EXECUTE does not affect them.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- Note: is_admin() / is_approved() intentionally remain executable — RLS policy
-- evaluation requires it, and they only reveal the calling user's own status.


-- ----- migrations/0006_country_hero_image.sql -----
-- ===========================================================================
-- AppPassport — country hero images
-- Adds a hero/banner image URL to countries. Nullable; the UI falls back to a
-- branded gradient when null or if the image fails to load, so nothing breaks.
-- ===========================================================================

alter table public.countries add column if not exists hero_image_url text;

-- Curated Unsplash hero photos for the seed countries. Swap freely in /admin.
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1600&q=70' where slug='china';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1600&q=70' where slug='japan';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=70' where slug='thailand';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1600&q=70' where slug='mexico';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=70' where slug='france';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1600&q=70' where slug='germany';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&q=70' where slug='italy';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1600&q=70' where slug='spain';
update public.countries set hero_image_url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=70' where slug='liberia';


-- ----- migrations/0007_storage_country_heroes.sql -----
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


