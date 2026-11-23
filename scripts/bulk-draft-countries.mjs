// Bulk AI-draft countries through the existing `draft-country` Edge Function.
// Each country lands as status='draft' for admin review — nothing auto-publishes.
//
// Run this ON THE VPS (it needs network + your OpenAI key set as a Supabase
// secret). It signs in as your admin account, then calls the Edge Function once
// per country with a delay between calls, skipping any country that already
// exists. Progress is logged so a partial run is easy to re-run.
//
// Usage (bash):
//   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... \
//   ADMIN_EMAIL=jim@shortall.us \
//   ADMIN_PASSWORD='your-password' \
//   node scripts/bulk-draft-countries.mjs
//
// Optional: DELAY_MS=4000 (default) — pause between countries.
import { createClient } from "@supabase/supabase-js";

const COUNTRIES = [
  "Canada", "Colombia", "Costa Rica", "Dominican Republic", "Greece",
  "Ireland", "Italy", "Jamaica", "Netherlands", "Portugal", "Switzerland",
  "United Kingdom", "El Salvador", "Bahamas", "Aruba", "Austria", "Peru",
  "Guatemala", "Australia", "Brazil", "Czech Republic", "Iceland", "Belgium",
  "Croatia", "Panama", "Denmark", "Hungary", "Norway", "Poland",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const delayMs = Number(process.env.DELAY_MS || 4000);

if (!url || !anon || !email || !password) {
  console.error("Missing env: need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_EMAIL, ADMIN_PASSWORD");
  process.exit(1);
}

const slugify = (n) => n.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const supabase = createClient(url, anon, { auth: { persistSession: false } });

  // 1) Sign in as admin so the Edge Function's admin check passes.
  const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr) {
    console.error("Admin sign-in failed:", authErr.message);
    process.exit(1);
  }
  console.log(`Signed in as ${email}\n`);

  // 2) Skip countries that already exist.
  const { data: existing } = await supabase.from("countries").select("slug");
  const have = new Set((existing ?? []).map((c) => c.slug));

  const results = { ok: [], skipped: [], failed: [] };

  for (const [i, name] of COUNTRIES.entries()) {
    const label = `[${i + 1}/${COUNTRIES.length}] ${name}`;
    if (have.has(slugify(name))) {
      console.log(`${label} — SKIP (already exists)`);
      results.skipped.push(name);
      continue;
    }
    try {
      const { data, error } = await supabase.functions.invoke("draft-country", {
        body: { country_name: name },
      });
      if (error || !data?.ok) {
        const msg = error?.message || data?.error || "unknown error";
        console.error(`${label} — FAIL: ${msg}`);
        results.failed.push({ name, msg });
      } else {
        console.log(`${label} — OK (draft, ${data.apps} apps)`);
        results.ok.push(name);
      }
    } catch (e) {
      console.error(`${label} — FAIL: ${e.message}`);
      results.failed.push({ name, msg: e.message });
    }
    if (i < COUNTRIES.length - 1) await sleep(delayMs);
  }

  console.log("\n──────── Summary ────────");
  console.log(`Drafted: ${results.ok.length}`);
  console.log(`Skipped (existing): ${results.skipped.length} ${results.skipped.join(", ") || ""}`);
  console.log(`Failed: ${results.failed.length}`);
  results.failed.forEach((f) => console.log(`  - ${f.name}: ${f.msg}`));
  if (results.failed.length) {
    console.log("\nRe-run failed ones individually from /admin → Generate Draft, or re-run this script (it skips ones that succeeded).");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
