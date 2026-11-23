// One-time import of AppPassport's current editorial content into Sanity.
//
// Usage:
//   NEXT_PUBLIC_SANITY_PROJECT_ID=xxxx \
//   NEXT_PUBLIC_SANITY_DATASET=production \
//   SANITY_WRITE_TOKEN=sk... \
//   node scripts/sanity-import.mjs
//
// The write token needs Editor permissions (Sanity → API → Tokens).
import { createClient } from "next-sanity";
import { readFileSync } from "node:fs";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN first.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2024-10-01", token, useCdn: false });

const LEGAL = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  cookies: "Cookie Policy",
  disclaimer: "Content Accuracy Disclaimer",
};

async function run() {
  const docs = [];

  // Legal pages from the committed markdown.
  for (const [slug, title] of Object.entries(LEGAL)) {
    const body = readFileSync(`content/legal/${slug}.md`, "utf8").replaceAll("{{DATE}}", "");
    docs.push({ _id: `legalPage-${slug}`, _type: "legalPage", title, slug, body });
  }

  // FAQ + changelog: read the compiled JSON emitted alongside this script.
  const seed = JSON.parse(readFileSync("scripts/sanity-seed.json", "utf8"));
  seed.faqs.forEach((f, i) =>
    docs.push({ _id: `faq-${i}`, _type: "faq", question: f.q, answer: f.a, order: (i + 1) * 10 })
  );
  seed.changelog.forEach((c, i) =>
    docs.push({ _id: `changelog-${i}`, _type: "changelogEntry", date: c.date, tag: c.tag, title: c.title, items: c.items })
  );

  const tx = client.transaction();
  docs.forEach((d) => tx.createOrReplace(d));
  await tx.commit();
  console.log(`Imported ${docs.length} documents into ${projectId}/${dataset}.`);
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
