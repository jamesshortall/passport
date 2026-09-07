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
