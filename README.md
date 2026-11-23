# AppPassport 🛂

Which US apps actually work where you're going — and the local alternatives to
download before you fly. Part of **The Travel Technician** brand.

Live target: `passport.traveltechnician.info`

---

## Stack

- **Next.js 16 (App Router)** + React 19 + TypeScript (Node 20.9+; Node 22 LTS recommended)
- **Tailwind CSS**
- **Supabase** — Postgres, Auth, Edge Functions, Row Level Security
- Deploy target: **Ionos VPS** (Node + nginx + PM2) — see
  [`docs/DEPLOY-VPS.md`](docs/DEPLOY-VPS.md). Run it locally first: [`docs/LOCAL-DEV.md`](docs/LOCAL-DEV.md)

## Key architecture decisions

**Public pages are cached (ISR).** `/`, `/country/[slug]`, `/apps`,
`/apps/[slug]`, `/updates` and `/embed/[slug]` use `export const revalidate =
300` and read through a cookie-less anon client (`src/lib/supabase/public.ts`),
so RLS only ever returns published content and nothing per-user lands in cached
HTML. Published slugs are pre-built (`generateStaticParams`) and
`dynamicParams = true` lets a newly published country render on first request;
admin actions call `revalidatePath` so edits are visible immediately. Confirm in
the build output that these routes are `○`/`●`, not `ƒ`. Per-user pages
(`/account`, `/admin`, `/support`, `/plan`, `/auth/callback`) stay dynamic.

**Auth state is client-side.** The header/footer never read the session on
the server; `src/components/AuthNav.tsx` resolves it in the browser.

**Security posture** (headers, CSP, image hosts, edge-function auth, rate
limits) is documented in [`docs/SECURITY.md`](docs/SECURITY.md).

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

### 1. Provision the database

Apply the migrations in `supabase/migrations/` **in order** to your Supabase
project (via the Supabase SQL editor, the CLI, or the MCP `apply_migration`
tool):

| File | Purpose |
|------|---------|
| `0001_schema.sql` | Tables + enums (core **and** Phase 2 tables) |
| `0002_rls.sql` | Row Level Security policies + `is_admin()` / `is_approved()` |
| `0003_functions_triggers.sql` | Signup→profile trigger, `last_updated` touches, `promote_to_admin()` |
| `0004_seed.sql` | Categories + **placeholder** seed countries |

> ⚠️ The seed data in `0004_seed.sql` is **placeholder research for demo
> purposes**. App-availability facts change fast — replace with verified
> research before launch.

### 2. Create the first admin

Sign up through the app (creates a `pending` profile), then run in the SQL
editor:

```sql
select public.promote_to_admin('jim@shortall.us');
```

That user is now an approved admin and can reach `/admin`.

### 3. Configure Auth providers

In the Supabase dashboard → Authentication:
- Enable **Email** (password) provider.
- Enable **Google** OAuth (add client ID/secret), redirect URL
  `https://<your-domain>/auth/callback`.

### 4. Deploy the Edge Functions (optional but needed for AI + email)

```bash
supabase functions deploy draft-country
supabase functions deploy notify-approval
supabase functions deploy digest-favorites

supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set RESEND_API_KEY=re_... RESEND_FROM="AppPassport <hello@traveltechnician.info>"
```

Schedule `digest-favorites` daily/weekly (Supabase scheduled functions / pg_cron)
— it batches favorite-country change digests, never one email per edit.

---

## What's built

### Core
- **`/`** — country grid with search + region filter (dynamic).
- **`/country/[slug]`** — country alert banner, category cards (works ✅/❌/⚠️,
  local alternative, why, setup-effort badge, severity tag), per-app "Learn
  more" expand, "last verified" date with a prominent link to the accuracy
  disclaimer, Save button.
- **`/admin`** — admin-only: pending-approval queue, publish/unpublish
  countries, "report outdated" queue, 90-day "needs review" list, "Generate
  Draft for New Country" (AI).
- **Auth** — email/password + Google OAuth; **approval workflow** (new signups
  are `pending`, gated at the RLS level, shown an "awaiting approval" screen).
- **Legal** — `/privacy`, `/terms`, `/cookies`, `/disclaimer` rendered from
  markdown in `content/legal/` (editable without code changes) + EU cookie
  banner.
- **Cross-promotion** — header brand badge, footer links (blog / main site /
  Cardmaster), distinct Cardmaster CTA card on home + country pages.

### Phase 2
- **`/apps`, `/apps/[slug]`** — app inventory + inverse (one app across every
  country).
- **`/plan`** — Trip Planner: pick 2+ countries → deduplicated "download before
  you fly" checklist + copy-as-checklist.
- **`/updates`** — reverse-chronological change feed (from `change_log`).
- **Report Outdated** — 👍/👎 control on each app card → `reports` queue.
- **Favorites + digests** — Save button (approved users) + `digest-favorites`
  edge function.
- **PWA** — `manifest.webmanifest` + `sw.js` cache-on-visit for country pages,
  "available offline" badge.
- **Embed** — `GET /embed/[slug]` returns a lean, standalone HTML card for
  external blogs with a "Powered by The Travel Technician" credit.

## Placeholder / follow-up items

- **Seed data** is illustrative — verify before launch.
- **Cardmaster** links + pitch copy are placeholders (Jim to supply URL/copy).
- **PWA icons** (`/public/icon-192.png`, `/icon-512.png`) referenced by the
  manifest still need to be added.
- The **AI-assisted Refresh** staged-diff review UI (per-field approve/reject
  against an existing country) has its schema (`refresh_proposals`) and edge
  flow scaffolded; the admin review screen is the next build step.
- The AI drafting edge function uses OpenAI (`gpt-4.1`, Responses API with web
  search) — set `OPENAI_API_KEY` and adjust the model id if needed.

## Scripts

```bash
npm run dev        # local dev
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint . (flat config in eslint.config.mjs)
npm audit          # dependency advisories — keep at 0 critical / 0 high
```
