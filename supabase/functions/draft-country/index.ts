// Supabase Edge Function: draft-country
// Researches a country's app landscape with OpenAI (web search enabled) and
// inserts a NEW country as status='draft'. NEVER auto-publishes — an admin
// reviews and flips status to 'published' after verifying the AI content.
//
// Deploy:  supabase functions deploy draft-country
// Secrets: supabase secrets set OPENAI_API_KEY=sk-...
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Uses the OpenAI Responses API with the built-in web_search tool.
// Update the model id if you prefer a different tier.
const OPENAI_MODEL = "gpt-4.1";
const OPENAI_URL = "https://api.openai.com/v1/responses";

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
payment rails), say so in why_short and mark severity accordingly. Return ONLY valid JSON, with no
markdown fences or commentary.`;

function userPrompt(country: string) {
  return `Research the current app landscape for a US traveler visiting ${country}.
Cover these categories where relevant: ${CATEGORIES.join(", ")}.

Return a JSON object with this exact shape:
{
  "flag_emoji": string,                     // the country's flag emoji, e.g. "🇻🇳"
  "region": string,                         // continent/region: one of "Africa", "Asia", "Europe", "North America", "South America", "Oceania", "Middle East"
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

// Aggregate assistant text from an OpenAI Responses API payload.
function extractText(aiJson: any): string {
  if (typeof aiJson.output_text === "string" && aiJson.output_text.length) {
    return aiJson.output_text;
  }
  let text = "";
  for (const item of aiJson.output ?? []) {
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const c of item.content) {
        if ((c.type === "output_text" || c.type === "text") && typeof c.text === "string") {
          text += c.text + "\n";
        }
      }
    }
  }
  return text;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // --- Service-role client (bypasses RLS for the admin check + inserts) --
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Gate: caller must be an approved admin (this costs OpenAI credits) --
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, approval_status")
      .eq("user_id", user.id)
      .single();
    if (!profile || profile.role !== "admin" || profile.approval_status !== "approved") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { country_name } = await req.json();
    if (!country_name) {
      return Response.json({ error: "country_name required" }, { status: 400 });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
    }

    // --- Call OpenAI with the web_search tool enabled ---------------------
    const aiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        tools: [{ type: "web_search" }],
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt(country_name) },
        ],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return Response.json({ error: `OpenAI API error: ${t}` }, { status: 502 });
    }

    const aiJson = await aiRes.json();
    const text = extractText(aiJson);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: "No JSON in model output", raw: text }, { status: 502 });
    }
    const parsed = JSON.parse(match[0]);

    // --- Insert as a DRAFT country via the service-role client above -------
    const slug = slugify(country_name);
    const { data: country, error: cErr } = await supabase
      .from("countries")
      .insert({
        name: country_name,
        slug,
        status: "draft",
        flag_emoji: parsed.flag_emoji ?? null,
        region: parsed.region ?? null,
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
