"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Heart, X } from "lucide-react";

/**
 * Opening-promotion bubble.
 *
 * A corner badge rather than a modal on load: the home page hero is the product
 * photo, and a dialog covering it would undo the reason it is there. The code
 * is printed on the Instagram artwork anyway, so there is nothing to gate — no
 * email is asked for, the code is simply handed over.
 *
 * TO TURN THE PROMOTION OFF: set `enabled: false`, or just leave it — `endsAt`
 * retires it on its own, which is the point. A promo nobody remembers to remove
 * is worse than no promo.
 */
// Wording tracks the launch artwork exactly. It has already changed twice
// (sitewide -> sitewide + free shipping -> minimum spend); if the artwork moves
// again, this object moves with it, or the site promises something the
// checkout will refuse.
const PROMO = {
  enabled: true,
  code: "WELCOME10",
  headline: "We're Open!",
  offer: "10% off orders over £25",
  /** Second tier. Requires `freeShippingThresholdGBP` = 50 in store settings. */
  note: "Spend £50+ and UK shipping is free too",
  /** Local date, end of day. After this the bubble never renders. */
  endsAt: "2026-10-31",
} as const;

/** "31 October" — the deadline is written once, in `endsAt`, and shown from there. */
function deadlineLabel(): string {
  const end = new Date(`${PROMO.endsAt}T23:59:59`);
  if (!Number.isFinite(end.getTime())) return "";
  return end.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function hasExpired(): boolean {
  const end = new Date(`${PROMO.endsAt}T23:59:59`);
  return Number.isFinite(end.getTime()) && Date.now() > end.getTime();
}

export function PromoBubble() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);


  async function copyCode() {
    try {
      await navigator.clipboard.writeText(PROMO.code);
      setCopied(true);
    } catch {
      // Insecure context or denied permission — the code is on screen to type.
    }
  }

  if (!PROMO.enabled || hasExpired()) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 print:hidden">
      {open ? (
        <div
          role="dialog"
          aria-label="Opening offer"
          className="w-[280px] rounded-3xl bg-surface-card border border-surface-line shadow-xl p-5 text-center relative animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close offer"
            className="absolute top-3 right-3 text-ink-soft hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <p className="font-display text-xl font-bold text-brand-600">
            {PROMO.headline}
          </p>
          <p className="text-ink-muted text-sm mt-1 mb-4">{PROMO.offer}</p>

          <button
            onClick={copyCode}
            className="w-full group flex items-center justify-center gap-2 rounded-full border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-2.5 transition-colors hover:border-brand-500 hover:bg-brand-100"
          >
            <span className="font-display font-bold tracking-wider text-brand-600">
              {PROMO.code}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-brand-600" />
            ) : (
              <Copy className="w-4 h-4 text-ink-soft group-hover:text-brand-600 transition-colors" />
            )}
          </button>

          <p className="text-[11px] text-ink-soft mt-2 h-4" aria-live="polite">
            {copied ? "Copied — paste it at checkout" : "Tap to copy"}
          </p>

          <p className="text-[11px] text-ink-soft mt-2 leading-snug">
            {PROMO.note}
          </p>
          <p className="text-[11px] text-brand-600/80 mt-1">
            Ends {deadlineLabel()}
          </p>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label={`${PROMO.offer} — get the code`}
          className="group relative w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-full bg-brand-500 text-white shadow-lg hover:bg-brand-600 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center leading-tight"
        >
          <Heart className="w-3 h-3 mb-0.5 fill-current opacity-80" />
          <span className="font-display text-base sm:text-lg font-bold">10%</span>
          <span className="text-[10px] tracking-[0.2em] uppercase opacity-90">
            Off
          </span>
        </button>
      )}
    </div>
  );
}
