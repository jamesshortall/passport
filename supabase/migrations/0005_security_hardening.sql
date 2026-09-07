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
