// Security-relevant configuration lives here; see docs/SECURITY.md.
const isDev = process.env.NODE_ENV === "development";

// Content Security Policy for the site.
// - 'unsafe-inline' for scripts/styles is required by Next.js' inline runtime
//   bootstrap and by Tailwind/inline style attributes; 'unsafe-eval' only in dev.
// - Image hosts are the ones the app actually renders from (Supabase Storage,
//   Unsplash heroes, legacy loremflickr placeholders, Sanity CDN).
// - connect-src covers Supabase (REST, auth, storage, realtime) and Sanity.
// - form-action allows the Supabase auth + Google OAuth redirects.
const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://loremflickr.com https://cdn.sanity.io",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sanity.io https://*.apicdn.sanity.io${
    isDev ? " ws: http://localhost:*" : ""
  }`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.supabase.co https://accounts.google.com",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: csp },
];

// The /embed widget is designed to be iframed by third-party blogs: it gets a
// minimal policy with frame-ancestors opened up and NO X-Frame-Options.
const embedHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors *; default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Every next/image source in the app is a local /brand asset; external
    // hero photos use a plain <img>. With no remote patterns the optimizer
    // refuses to fetch arbitrary URLs (no open image proxy / SSRF surface).
    remotePatterns: [],
    formats: ["image/webp"],
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      { source: "/((?!embed/).*)", headers: securityHeaders },
      { source: "/embed/:path*", headers: embedHeaders },
    ];
  },
};

export default nextConfig;
