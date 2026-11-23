// ESLint flat config (Next.js 16 dropped `next lint`; run `npm run lint`).
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Stylistic only: apostrophes/quotes in JSX text are safe as written.
      "react/no-unescaped-entities": "off",
      // Supabase join rows are loosely typed in a few places; surface, don't block.
      "@typescript-eslint/no-explicit-any": "warn",
      // Mount-time reads of browser state (localStorage, URL) into state are a
      // deliberate hydration-safe pattern here; flag for review rather than fail.
      "react-hooks/set-state-in-effect": "warn",
      // Fires on Date.now() in per-request Server Components, where it is correct.
      "react-hooks/purity": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    ".sanity/**",
    "next-env.d.ts",
    // Deno runtime — type-checked and linted by the Supabase CLI, not Node ESLint.
    "supabase/functions/**",
    // Service worker is plain browser JS served from /public.
    "public/**",
  ]),
]);
