-- 0008: fixed-window rate limiting for public edge functions.
--
-- Edge functions are stateless, so counters live in Postgres. The table is
-- RLS-enabled with NO policies: only the service role (edge functions) can
-- touch it. `consume_rate_limit` increments the counter for `p_key` inside the
-- current window and returns true when the call is allowed.

create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  count        integer not null default 0
);

alter table public.rate_limits enable row level security;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now   timestamptz := now();
  v_count integer;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set count = case
          when r.window_start + make_interval(secs => p_window_seconds) <= v_now then 1
          else r.count + 1
        end,
        window_start = case
          when r.window_start + make_interval(secs => p_window_seconds) <= v_now then v_now
          else r.window_start
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Service role only; anon/authenticated must not call this directly.
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- Housekeeping: drop stale windows so the table stays small. Called
-- opportunistically by the edge function; safe to run anytime.
create or replace function public.purge_rate_limits(p_older_than_seconds integer default 86400)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits
  where window_start < now() - make_interval(secs => p_older_than_seconds);
$$;

revoke all on function public.purge_rate_limits(integer) from public, anon, authenticated;
grant execute on function public.purge_rate_limits(integer) to service_role;
