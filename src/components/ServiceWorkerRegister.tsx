"use client";

import { useEffect } from "react";

/** Registers the PWA service worker on the client. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration failed — app still works online */
      });
    }
  }, []);
  return null;
}
