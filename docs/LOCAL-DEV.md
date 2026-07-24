# Running AppPassport locally

Test the app on your desktop against the live Supabase project before deploying
to the VPS.

## Prerequisites

- **Node.js 20+** (`node -v` to check) — https://nodejs.org
- **Git**

## 1. Get the code

```bash
git clone https://github.com/jamesshortall/passport.git
cd passport
git checkout claude/apppassport-travel-app-4hlbc2   # or main once merged
```

## 2. Create `.env.local`

Create a file named `.env.local` in the project root. Get the anon/publishable
key from Supabase → Project Settings → API. Note `NEXT_PUBLIC_SITE_URL` is
`localhost` here (it's the production domain on the server).

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xkaeaupdopopjbhrxzsp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon / publishable key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Optional — only if testing server-side admin bypass locally:
# SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

`.env.local` is gitignored — never commit it.

## 3. Install & run

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. The country grid and country pages read
directly from Supabase, so they work immediately.

## What works locally

| Feature | Local status |
|---------|--------------|
| Home grid, search/filter, country pages | ✅ works now |
| `/apps`, `/apps/[slug]`, `/plan`, `/updates` | ✅ works now |
| Legal pages, cookie banner, `/embed/[slug]` | ✅ works now |
| Sign up / sign in | ⚙️ add `http://localhost:3000/auth/callback` to Supabase → Auth → URL Configuration → Redirect URLs. For quick tests, turn off "Confirm email" under Auth → Providers → Email. |
| `/admin` | 🔒 sign up, then promote your user: `select public.promote_to_admin('you@email');` in the SQL Editor |
| AI "Generate Draft", approval/digest emails | 🚫 need deployed Edge Functions + API keys (`ANTHROPIC_API_KEY`, `RESEND_API_KEY`) |

## Useful scripts

```bash
npm run dev        # local dev server (hot reload)
npm run build      # production build
npm start          # run the production build locally
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

## Production build smoke test

To mimic the server before deploying:

```bash
npm run build && npm start
```

Then open http://localhost:3000 — this runs the same optimized server the VPS
will use (see `docs/DEPLOY-VPS.md`).
