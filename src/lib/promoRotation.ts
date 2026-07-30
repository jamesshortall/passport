import type { NextRequest, NextResponse } from "next/server";

/** Number of promo cards in the rotation (Cardmaster, main site, blog). */
export const PROMO_ROTATION_COUNT = 3;

/** Session cookie: which offset is used for the current visit (stays fixed). */
const SESSION_COOKIE = "promo_rot";
/** Long-lived cookie: last offset served, so the next visit advances evenly. */
const PERSIST_COOKIE = "promo_rot_last";

/** Cookie name a Server Component reads to learn this request's offset. */
export const PROMO_ROTATION_COOKIE = SESSION_COOKIE;

/**
 * Decides the promo-card rotation offset for this request.
 *
 * Behaviour: even round-robin exposure, stable within a visit.
 *  - First-ever visitor: a random offset, so new visitors are spread evenly.
 *  - Returning visitor (new browsing session): advances one step round-robin,
 *    so each property gets the top slot on an equal cycle across visits.
 *  - Same visit (session cookie present): offset is left untouched, so cards
 *    never reshuffle on refresh or navigation.
 *
 * Must run in middleware — Server Components can read cookies but not set them.
 */
export function applyPromoRotation(request: NextRequest) {
  const current = request.cookies.get(SESSION_COOKIE)?.value;
  const currentOffset = current === undefined ? NaN : Number(current);
  const isNewVisit =
    !Number.isInteger(currentOffset) ||
    currentOffset < 0 ||
    currentOffset >= PROMO_ROTATION_COUNT;

  let offset = currentOffset;
  if (isNewVisit) {
    const lastRaw = request.cookies.get(PERSIST_COOKIE)?.value;
    const last = lastRaw === undefined ? NaN : Number(lastRaw);
    offset = Number.isInteger(last)
      ? (last + 1) % PROMO_ROTATION_COUNT
      : Math.floor(Math.random() * PROMO_ROTATION_COUNT);
    // Make the fresh offset visible to the Server Component on THIS request.
    request.cookies.set(SESSION_COOKIE, String(offset));
  }

  return {
    offset,
    /** Persist the decision onto the outgoing response (browser cookies). */
    write(response: NextResponse) {
      if (!isNewVisit) return;
      // Session cookie (no maxAge) → stable for the whole visit, then resets.
      response.cookies.set(SESSION_COOKIE, String(offset), {
        path: "/",
        sameSite: "lax",
      });
      // Long-lived counter → the next visit advances to the following card.
      response.cookies.set(PERSIST_COOKIE, String(offset), {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    },
  };
}
