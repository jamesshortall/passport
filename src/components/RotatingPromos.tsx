"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Rotates the order of the sidebar promo cards on every page load, client-side.
 *
 * Doing this in the browser (rather than on the server) guarantees the order
 * actually changes on each load even if the HTML is cached by a CDN, nginx, or
 * the browser — server-side rotation gets frozen into whatever response is
 * cached. A localStorage counter advances one step per load, so exposure is an
 * even round-robin: each card takes the top slot in turn.
 *
 * The initial render (server + first client paint) uses the given order, so
 * there's no hydration mismatch; the rotation is applied right after mount.
 */
export default function RotatingPromos({ cards }: { cards: ReactNode[] }) {
  const [order, setOrder] = useState<ReactNode[]>(cards);

  useEffect(() => {
    const len = cards.length;
    if (len <= 1) return;
    const prev = Number(localStorage.getItem("promoRot"));
    const n = Number.isInteger(prev) ? prev : -1;
    const next = (n + 1) % len;
    localStorage.setItem("promoRot", String(next));
    setOrder([...cards.slice(next), ...cards.slice(0, next)]);
    // Rotate once per mount (page load); cards identity is stable per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{order}</>;
}
