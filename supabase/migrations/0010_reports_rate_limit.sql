-- 0010: throttle anonymous "report outdated" submissions.
--
-- `reports` accepts inserts without an account, so a script could flood the
-- admin queue. Cap each country_apps entry at REPORTS_PER_MINUTE new reports
-- per minute; the trigger raises so the client gets a clear error.

create or replace function public.reports_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reports_per_minute constant integer := 5;
  recent integer;
begin
  if new.country_apps_id is null then
    return new;
  end if;
  select count(*) into recent
  from public.reports
  where country_apps_id = new.country_apps_id
    and created_at > now() - interval '1 minute';
  if recent >= reports_per_minute then
    raise exception 'Too many reports for this entry right now — please try again in a minute.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists reports_rate_limit_trg on public.reports;
create trigger reports_rate_limit_trg
  before insert on public.reports
  for each row execute function public.reports_rate_limit();
