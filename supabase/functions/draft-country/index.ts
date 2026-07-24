// Supabase Edge Function: draft-country
// Researches a country's app landscape with Claude + web search and inserts a
// NEW country as status='draft'. NEVER auto-publishes — an admin reviews and
// flips status to 'published' after verifying the AI-generated content.
//
// Deploy:  supabase functions deploy draft-country
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// NOTE: The build spec requested this model id. Update to a current Claude
// model id if this one is retired.
const CLAUDE_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const CATEGORIES = [
  "Payments",
  "Messaging",
  "Maps & Navigation",
  "Ride-hailing",
  "Internet Access",
  "Social Media Access",
];

const SYSTEM_PROMPT = `You are a travel-tech researcher for US travelers. Using live web research,
produce an accurate, current snapshot of which US apps work in a given country and the local
alternatives to use instead. Be conservative: if something is uncertain or changes often (VPNs,
payment rails), say so in why_short and mark severity accordingly. Return ONLY valid JSON.`;

function userPrompt(country: string) {
  return `Research the current app landscape for a US traveler visiting ${country}.
Cover these categories where relevant: ${CATEGORIES.join(", ")}.

Return a JSON object with this exact shape:
{
  "country_alert": string | null,          // short prominent warning for the whole country, or null
  "country_alert_detail": string | null,   // optional longer paragraph, or null
  "apps": [
    {
      "category": one of ${JSON.stringify(CATEGORIES)},
      "us_app_name": string,               // e.g. "Apple Pay"
      "us_app_works": "yes" | "no" | "partial",
      "local_alternative_name": string | null,
      "why_short": string,                 // 1-2 lines, always shown
      "setup_effort": "none" | "before_you_land" | "hard_needs_local_id",
      "detail_paragraph": string | null,   // 1-2 paragraph deep dive
      "severity": "blocked" | "unreliable" | "works_with_caveats" | "works_fine"
    }
  ]
}
Only include categories that are actually relevant for this country.`;
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { country_name } = await req.json();
    if (!country_name) {
      return Response.json({ error: "country_name required" }, { status: 400 });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
    }

    // --- Call Claude with the web_search tool enabled ---------------------
    const aiRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
        messages: [{ role: "user", content: userPrompt(country_name) }],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return Response.json({ error: `Claude API error: ${t}` }, { status: 502 });
    }

    const aiJson = await aiRes.json();
    // Concatenate text blocks, then extract the JSON object.
    const text = (aiJson.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: "No JSON in model output", raw: text }, { status: 502 });
    }
    const parsed = JSON.parse(match[0]);

    // --- Insert as a DRAFT country via service role -----------------------
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const slug = slugify(country_name);
    const { data: country, error: cErr } = await supabase
      .from("countries")
      .insert({
        name: country_name,
        slug,
        status: "draft",
        country_alert: parsed.country_alert ?? null,
        country_alert_detail: parsed.country_alert_detail ?? null,
      })
      .select("id")
      .single();

    if (cErr) return Response.json({ error: cErr.message }, { status: 500 });

    // Map category names -> ids.
    const { data: cats } = await supabase.from("app_categories").select("id, name");
    const catId = new Map((cats ?? []).map((c: any) => [c.name, c.id]));

    const rows = (parsed.apps ?? [])
      .filter((a: any) => catId.has(a.category))
      .map((a: any) => ({
        country_id: country.id,
        category_id: catId.get(a.category),
        us_app_name: a.us_app_name,
        us_app_works: a.us_app_works ?? "no",
        local_alternative_name: a.local_alternative_name ?? null,
        why_short: a.why_short ?? "",
        setup_effort: a.setup_effort ?? "none",
        detail_paragraph: a.detail_paragraph ?? null,
        severity: a.severity ?? "works_fine",
      }));

    if (rows.length) {
      const { error: aErr } = await supabase.from("country_apps").insert(rows);
      if (aErr) return Response.json({ error: aErr.message }, { status: 500 });
    }

    return Response.json({ ok: true, country_id: country.id, apps: rows.length, status: "draft" });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
