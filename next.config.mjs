/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Country pages are rendered dynamically from Supabase per request.
  // We deliberately do NOT use generateStaticParams so new countries added
  // in Supabase go live immediately without a redeploy.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
