# Security notes

What the app does to stay safe, and what to keep in mind when changing it.

## Dependencies
- Next.js 16 / React 19 / Sanity 6. Keep `npm audit` at **0 critical / 0 high**;
  `package.json` `overrides` pin a few transitive packages inside the Sanity CLI.
- Dependabot opens weekly PRs (`.github/dependabot.yml`), grouping minor/patch bumps.

## HTTP headers (`next.config.mjs`)
- HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  `X-Frame-Options: DENY`, and a Content-Security-Policy on every route.
  `poweredByHeader` is off.
- CSP allow-lists: images from Supabase Storage, Unsplash, loremflickr, Sanity CDN;
  connections to Supabase and Sanity; form posts to Supabase auth and Google OAuth.
  Scripts/styles need `'unsafe-inline'` for Next's bootstrap and Tailwind.
- `/embed/*` is the one route meant to be iframed anywhere: it gets
  `frame-ancestors *` and no `X-Frame-Options`. Keep it out of the site-wide rule.
- nginx must pass these headers through unchanged (`docs/DEPLOY-VPS.md`).

## Images
- `images.remotePatterns` is empty: every `next/image` source is a local
  `/brand/*` asset, so `/_next/image` cannot be used as an open proxy.
  Country hero photos use a plain `<img>`. Add a host here only for a real
  `next/image` use.

## Caching and per-user data
- Public pages are ISR-cached and read through the cookie-less anon client.
  Never read `cookies()` / the session in a component rendered on a cached
  page; use a client component (see `AuthNav`, `SaveCountryButton`).
- Admin content changes call `revalidatePublicContent()` in `src/app/admin/actions.ts`.

## Supabase
- The web app has **no service-role key**; all writes go through RLS as the
  signed-in admin. Privileged jobs run in Edge Functions.
- `profiles_insert_own` pins `role='user'` / `approval_status='pending'`
  (migration 0008), so a self-inserted profile can never be admin/approved.
- Edge functions:
  - `notify-approval`: admin JWT required; recipient looked up by `profile_id`.
  - `digest-favorites`: `x-cron-secret` must match `CRON_SECRET` (constant-time);
    deployed with `--no-verify-jwt`; queries bounded and paged.
  - `support-message`: CORS pinned to the site origin, 5 messages/hour/IP and
    60/hour globally via `public.consume_rate_limit` (migration 0009), input
    validated, optional Turnstile check when `TURNSTILE_SECRET` is set.
  - `draft-country`, `backfill-heroes`, `cache-heroes`: admin JWT required.
- Anonymous `reports` inserts are throttled by a trigger (migration 0010).

## Auth redirects
- `src/lib/safeRedirect.ts` is the single `next=` validator (path-only,
  same-origin, no `//` or `\` tricks). `/auth/callback` only redirects to
  allow-listed hosts and never echoes error text into the URL.

## Secrets
- Never commit `.env*` (except `.env.example`). Edge-function secrets are set
  with `supabase secrets set ...`, never from code.
