// Sanity configuration, read from env. If NEXT_PUBLIC_SANITY_PROJECT_ID is not
// set, the app treats Sanity as "not configured" and every page falls back to
// its built-in content — so the site works with or without Sanity.

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-01";

/** True once a Sanity project is connected. Gates all Sanity reads. */
export const isSanityConfigured = projectId.length > 0;
