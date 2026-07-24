# AppPassport 🛂

Which US apps actually work where you're going — and the local alternatives to
download before you fly. Part of **The Travel Technician** brand.

Live target: `passport.traveltechnician.info`

---

## Stack

- **Next.js 14 (App Router)** + React + TypeScript
- **Tailwind CSS**
- **Supabase** — Postgres, Auth, Edge Functions, Row Level Security
- Deploy target: **Ionos VPS** (Node + nginx + PM2) — see
  [`docs/DEPLOY-VPS.md`](docs/DEPLOY-VPS.md)

## Key architecture decision

Country pages are **server-rendered per request** (`export const dynamic =
"force-dynamic"`). There is intentionally **no `generateStaticParams`**, so a
country published in Supabase is live immediately — no redeploy. Confirm in the
build output that `/` and `/country/[slug]` are marked `ƒ (Dynamic)`.

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

supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
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
- The edge function uses the model id `claude-sonnet-4-6` as specified — update
  to a current Claude model id if needed.

## Scripts

```bash
npm run dev        # local dev
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```
