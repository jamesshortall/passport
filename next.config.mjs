// Security-relevant configuration lives here; see docs/SECURITY.md.
const isDev = process.env.NODE_ENV === "development";

// Supabase origin for CSP connect-src and next/image. Derived from the env at
// build time; falls back to the project wildcard when the env isn't set
// (e.g. CI builds without secrets).
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();
const supabaseHost = supabaseOrigin ? new URL(supabaseOrigin).hostname : "*.supabase.co";
const supabaseConnect = supabaseOrigin
  ? [supabaseOrigin, supabaseOrigin.replace(/^https:/, "wss:")]
  : ["https://*.supabase.co", "wss://*.supabase.co"];

// Content Security Policy.
// - 'unsafe-inline' for scripts/styles is required by Next.js' inline runtime
//   bootstrap and by Tailwind/inline style attributes; 'unsafe-eval' only in dev.
// - img-src allows any https host because admins can point a country hero at
//   an arbitrary image URL; everything else is pinned to known origins.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseConnect.join(" ")}${isDev ? " ws: http://localhost:*" : ""}`,
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self'",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: csp },
];

// The /embed widget is designed to be iframed by third-party blogs, so it gets
// the same policy with frame-ancestors opened up and no X-Frame-Options.
const embedHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: csp.replace("frame-ancestors 'none'", "frame-ancestors *") },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Only hosts we actually serve through next/image. Anything else is
    // rejected by the optimizer instead of being fetched on our behalf.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/**" },
    ],
  },
  async headers() {
    return [
      { source: "/((?!embed/).*)", headers: securityHeaders },
      { source: "/embed/:path*", headers: embedHeaders },
    ];
  },
};

export default nextConfig;
