import { createClient } from "next-sanity";
import { projectId, dataset, apiVersion, isSanityConfigured } from "./env";

// Only build a client when a project is configured. Reads use the CDN.
export const sanityClient = isSanityConfigured
  ? createClient({ projectId, dataset, apiVersion, useCdn: true, perspective: "published" })
  : null;

/**
 * Safe fetch: returns `fallback` when Sanity isn't configured, the query
 * errors, or nothing is found. Never throws — the site keeps working.
 */
export async function sanityFetch<T>(
  query: string,
  fallback: T,
  params: Record<string, unknown> = {}
): Promise<T> {
  if (!sanityClient) return fallback;
  try {
    const data = await sanityClient.fetch<T>(query, params, {
      next: { revalidate: 60 },
    });
    if (data === null || data === undefined) return fallback;
    if (Array.isArray(data) && data.length === 0) return fallback;
    return data;
  } catch (e) {
    console.error("sanityFetch error:", (e as Error).message);
    return fallback;
  }
}
