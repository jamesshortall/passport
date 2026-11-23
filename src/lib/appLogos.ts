// Best-effort mapping of a US-app / local-alternative name to a brand domain,
// so we can show a real logo next to it. Unknown apps fall back to a lettered
// avatar in the AppLogo component.

const RULES: { match: string[]; domain: string }[] = [
  { match: ["apple pay", "apple wallet", "suica", "apple"], domain: "apple.com" },
  { match: ["google maps", "gmail", "google"], domain: "google.com" },
  { match: ["whatsapp"], domain: "whatsapp.com" },
  { match: ["wechat"], domain: "wechat.com" },
  { match: ["alipay"], domain: "alipay.com" },
  { match: ["instagram"], domain: "instagram.com" },
  { match: ["facebook", "messenger"], domain: "facebook.com" },
  { match: ["x/twitter", "twitter", " x "], domain: "x.com" },
  { match: ["uber"], domain: "uber.com" },
  { match: ["didi"], domain: "didiglobal.com" },
  { match: ["grab"], domain: "grab.com" },
  { match: ["bolt"], domain: "bolt.eu" },
  { match: ["free now", "freenow"], domain: "free-now.com" },
  { match: ["cabify"], domain: "cabify.com" },
  { match: ["line"], domain: "line.me" },
  { match: ["amap", "高德"], domain: "amap.com" },
  { match: ["baidu"], domain: "baidu.com" },
  { match: ["maps.me"], domain: "maps.me" },
  { match: ["signal"], domain: "signal.org" },
  { match: ["db navigator", "deutsche bahn"], domain: "bahn.de" },
  { match: ["promptpay"], domain: "bot.or.th" },
  { match: ["telegram"], domain: "telegram.org" },
  { match: ["revolut"], domain: "revolut.com" },
  { match: ["wise"], domain: "wise.com" },
];

/** Resolve a brand domain for an app name, or null if we don't have one. */
export function domainForApp(name: string | null | undefined): string | null {
  if (!name) return null;
  const n = ` ${name.toLowerCase()} `;
  for (const rule of RULES) {
    if (rule.match.some((m) => n.includes(m))) return rule.domain;
  }
  return null;
}

/** A favicon/logo URL for a domain (Google's service — very high coverage). */
export function logoUrlForDomain(domain: string): string {
  return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
}
