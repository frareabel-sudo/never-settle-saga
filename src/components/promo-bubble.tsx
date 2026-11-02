"use client";

import { useState } from "react";
import { Heart, X } from "lucide-react";
import { campaignEndLabel } from "@/lib/campaigns";
import { CopyCode, useActiveCampaign } from "@/components/campaign-banner";

/**
 * Corner promotion bubble.
 *
 * A corner badge rather than a modal on load: a dialog covering the hero would
 * undo the reason the hero is there. No email is asked for — the code is simply
 * handed over.
 *
 * It follows the campaign calendar in `src/lib/campaigns.ts`: Black Friday,
 * Christmas and Boxing Day each turn it on and off by date. Between campaigns
 * it does not render at all. (The opening WELCOME10 offer ended 31 October.)
 */
export function PromoBubble() {
  const c = useActiveCampaign();
  const [open, setOpen] = useState(false);

  if (!c) return null;

  const title = c.headline.replace("\n", " ");
  const offer = c.code
    ? `${c.offerBig} off ${c.offerLabel.toLowerCase()}`
    : `${c.offerBig} ${c.offerLabel.toLowerCase()}`;

  return (
    <div className="fixed bottom-4 right-4 z-40 print:hidden">
      {open ? (
        <div
          role="dialog"
          aria-label={title}
          className="w-[280px] rounded-3xl bg-surface-card border border-surface-line shadow-xl p-5 text-center relative animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close offer"
            className="absolute top-3 right-3 text-ink-soft hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <p className="font-display text-xl font-bold text-brand-600">{title}</p>
          <p className="text-ink-muted text-sm mt-1 mb-4">{offer}</p>

          {c.code ? (
            <>
              <CopyCode code={c.code} dark={false} />
              <p className="text-[11px] text-ink-soft mt-2">Tap to copy, paste at checkout</p>
            </>
          ) : (
            c.offerNote && <p className="text-sm text-ink-muted">{c.offerNote}</p>
          )}

          {c.footnote && (
            <p className="text-[11px] text-ink-soft mt-2 leading-snug">{c.footnote}</p>
          )}
          <p className="text-[11px] text-brand-600/80 mt-1">Ends {campaignEndLabel(c)}</p>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label={`${title}: ${offer}`}
          style={{ backgroundColor: c.accent }}
          className="group relative w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-full text-white shadow-lg hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center leading-tight"
        >
          <Heart className="w-3 h-3 mb-0.5 fill-current opacity-80" />
          <span className="font-display text-base sm:text-lg font-bold">{c.bubbleTop}</span>
          <span className="text-[10px] tracking-[0.2em] uppercase opacity-90">
            {c.bubbleBottom}
          </span>
        </button>
      )}
    </div>
  );
}
