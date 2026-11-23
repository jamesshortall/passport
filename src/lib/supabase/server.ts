import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 * Reads the auth session from cookies. Respects RLS as the logged-in user
 * (or anon). Use this for anything per-user (account, admin, favorites).
 * For public catalog reads that should be cacheable, use
 * `createSupabasePublicClient` from ./public instead.
 *
 * Async because `cookies()` is asynchronous in Next.js 15+.
 *
 * Note: the web app deliberately has NO service-role client — every write goes
 * through RLS as the signed-in admin, and privileged jobs live in edge functions.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled by the proxy instead — safe to ignore.
          }
        },
      },
    }
  );
}
