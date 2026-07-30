import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { applyPromoRotation } from "@/lib/promoRotation";

export async function middleware(request: NextRequest) {
  // Decide the promo-card rotation before Supabase rebuilds the response, so
  // the offset cookie rides along with the same response and the request
  // carries it to the Server Component render.
  const rotation = applyPromoRotation(request);
  const response = await updateSession(request);
  rotation.write(response);
  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and the embed (kept lean/public).
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
