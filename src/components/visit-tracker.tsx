"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const OPT_OUT_KEY = "dcs-no-track";

function optedOut(): boolean {
  try {
    // Visiting any page with ?notrack=1 once stops counting this browser
    // (the owner's own visits); ?notrack=0 turns counting back on.
    const p = new URLSearchParams(window.location.search).get("notrack");
    if (p === "1") window.localStorage.setItem(OPT_OUT_KEY, "1");
    if (p === "0") window.localStorage.removeItem(OPT_OUT_KEY);
    return window.localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

function send(payload: Record<string, string>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon && navigator.sendBeacon("/api/track", new Blob([body], { type: "text/plain" }))) return;
  } catch { /* fall through */ }
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

/** Records a checkout attempt for the funnel (called from the cart). */
export function trackCheckoutStart() {
  if (typeof window === "undefined" || optedOut()) return;
  send({ path: window.location.pathname, event: "checkout" });
}

/**
 * Cookieless page-view counter (see /api/track). Sends the first page's
 * referrer / utm_source so Command Centre can show where visitors come from.
 */
export function VisitTracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || optedOut()) return;
    const payload: Record<string, string> = { path: pathname };
    if (first.current) {
      first.current = false;
      payload.ref = document.referrer || "";
      payload.utm = new URLSearchParams(window.location.search).get("utm_source") || "";
    }
    send(payload);
  }, [pathname]);

  return null;
}
