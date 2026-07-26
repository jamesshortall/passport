# Sanity CMS (editorial content)

AppPassport uses **Sanity** to manage its editorial content — the **Legal
pages** (privacy / terms / cookies / disclaimer), the **FAQ**, and the **What's
New** changelog. Everything else (countries, app data, auth, favorites, AI
drafting) stays in **Supabase**.

**The app works with or without Sanity.** Until a project is connected, each
page falls back to its built-in content (the markdown files in `content/legal/`
and the arrays in `src/lib/supportContent.ts`). Connect Sanity and it takes
over automatically.

## 1. Create a Sanity project

```bash
npm create sanity@latest -- --project-plan free
# or manage projects at https://www.sanity.io/manage
```
Note the **Project ID** and **dataset** (usually `production`).

## 2. Add env vars

Add to `.env.local` (and to the server env when you deploy):

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

Rebuild (`npm run build`) — Next inlines `NEXT_PUBLIC_*` at build time.

## 3. Run the Studio (the editing UI)

The Studio config lives in this repo (`sanity.config.ts` + `sanity/schemaTypes/`).

- **Local:** `npm run studio:dev` → opens `http://localhost:3333`
- **Hosted (recommended):** `npm run studio:deploy` → hosts it at
  `https://<your-project>.sanity.studio` so you can edit from anywhere.

(You log into the Studio with your Sanity account — it's separate from the
AppPassport admin.)

## 4. Import your current content (optional, one-time)

So you don't retype anything, import the current Legal pages, FAQ, and changelog:

1. Create a **write token** in Sanity → API → Tokens (Editor role).
2. Run:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id \
SANITY_WRITE_TOKEN=sk_your_token \
npm run sanity:import
```

Now those documents exist in Sanity and are editable in the Studio.

## What's managed where

| Content | Source |
|---------|--------|
| Legal pages (privacy/terms/cookies/disclaimer) | **Sanity** `legalPage` (Markdown body) → falls back to `content/legal/*.md` |
| FAQ (Support Center) | **Sanity** `faq` → falls back to `supportContent.ts` |
| What's New changelog | **Sanity** `changelogEntry` → falls back to `supportContent.ts` |
| Countries, app data, auth, favorites, AI drafting | **Supabase** (unchanged) |

## Notes

- Reads are cached for 60s (ISR) and use the Sanity CDN.
- The Studio is **not** embedded in the Next app (that avoids a known Sanity
  SSR build issue). Use the hosted Studio from step 3 instead.
