import type { NextRequest, NextResponse } from "next/server";

/** Number of promo cards in the rotation (Cardmaster, main site, blog). */
export const PROMO_ROTATION_COUNT = 3;

/** Cookie holding the last rotation offset served (round-robin counter). */
const COUNTER_COOKIE = "promo_rot";

/** Cookie name a Server Component reads to learn this request's offset. */
export const PROMO_ROTATION_COOKIE = COUNTER_COOKIE;

/**
 * Decides the promo-card rotation offset for this request.
 *
 * Even round-robin that advances one step on every request, so the leading
 * card visibly changes on each page load while every property gets the top
 * slot on an equal cycle. Seeded randomly for a brand-new visitor. The counter
 * is persisted in a long-lived cookie so it keeps advancing across visits.
 *
 * Must run in middleware — Server Components can read cookies but not set them.
 */
export function applyPromoRotation(request: NextRequest) {
  const prevRaw = request.cookies.get(COUNTER_COOKIE)?.value;
  const prev = prevRaw === undefined ? NaN : Number(prevRaw);
  const offset = Number.isInteger(prev)
    ? (((prev + 1) % PROMO_ROTATION_COUNT) + PROMO_ROTATION_COUNT) %
      PROMO_ROTATION_COUNT
    : Math.floor(Math.random() * PROMO_ROTATION_COUNT);

  // Make the new offset visible to the Server Component on THIS request.
  request.cookies.set(COUNTER_COOKIE, String(offset));

  return {
    offset,
    /** Persist the advanced counter onto the outgoing response. */
    write(response: NextResponse) {
      response.cookies.set(COUNTER_COOKIE, String(offset), {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    },
  };
}
