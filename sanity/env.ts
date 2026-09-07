// Sanity configuration. Reads both prefixes so the SAME values work in two
// different runtimes:
//   * The Next.js website exposes NEXT_PUBLIC_* variables.
//   * The Sanity Studio (`sanity dev` / `sanity deploy`, a Vite app) only
//     exposes SANITY_STUDIO_* variables.
// Set both prefixes in .env.local (see docs/SANITY.md) and everything works.
//
// Nothing here throws — if no project is configured the app falls back to its
// built-in content.

export const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  "";

export const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  "production";

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-01";

/** True once a Sanity project is connected. Gates all Sanity reads. */
export const isSanityConfigured = projectId.length > 0;
