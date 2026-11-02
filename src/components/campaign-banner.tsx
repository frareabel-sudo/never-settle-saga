"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { activeCampaign, type Campaign } from "@/lib/campaigns";

/**
 * The campaign is decided in the browser, after mount. Pages here are built
 * ahead of time, so deciding during the build would freeze whatever was live on
 * build day — a Black Friday banner baked in on the 25th would never appear,
 * and one baked in on the 30th would never leave.
 */
export function useActiveCampaign(): Campaign | null {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  useEffect(() => {
    setCampaign(activeCampaign());
  }, []);
  return campaign;
}

export function CopyCode({ code, dark = true }: { code: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Insecure context or denied permission — the code is on screen to type.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy code ${code}`}
      className={
        dark
          ? "w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[#F3B08A] px-5 py-3 min-h-[52px] text-left hover:bg-white/5 transition-colors"
          : "w-full flex items-center justify-center gap-2 rounded-full border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-2.5 hover:border-brand-500 hover:bg-brand-100 transition-colors"
      }
    >
      <span className={dark ? "text-sm text-[#E9DDD3]" : "sr-only"}>
        {copied ? "Copied — paste at checkout" : "Code · tap to copy"}
      </span>
      <span className="flex items-center gap-2">
        <span
          className={
            dark
              ? "font-display font-bold tracking-wider text-white text-lg"
              : "font-display font-bold tracking-wider text-brand-600"
          }
        >
          {code}
        </span>
        {copied ? (
          <Check className={dark ? "w-4 h-4 text-[#F3B08A]" : "w-4 h-4 text-brand-600"} />
        ) : (
          <Copy className={dark ? "w-4 h-4 text-[#C9B8AB]" : "w-4 h-4 text-ink-soft"} />
        )}
      </span>
    </button>
  );
}

/**
 * Dark campaign band. Deliberately NOT the cream of the rest of the site: for
 * the few days a sale runs, the band is meant to interrupt the page.
 */
export function CampaignBanner({ className = "" }: { className?: string }) {
  const c = useActiveCampaign();
  if (!c) return null;

  const [line1, line2] = c.headline.split("\n");
  const longOffer = c.offerBig.length > 5;

  return (
    <section
      aria-label={c.eyebrow}
      className={`bg-[#141110] text-[#FBF4EE] ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 grid gap-8 lg:grid-cols-[1.35fr_1fr] items-center">
        <div className="flex flex-col gap-4 sm:gap-5">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#F3B08A]">
            {c.eyebrow}
          </p>
          <h2 className="font-display font-black uppercase leading-[0.92] tracking-tight text-5xl sm:text-6xl lg:text-7xl">
            {line1}
            {line2 && (
              <>
                <br />
                {line2}
              </>
            )}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[#E9DDD3] max-w-xl">
            {c.blurb}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 mt-1">
            <Link
              href="/shop"
              style={{ backgroundColor: c.accent }}
              className="inline-flex items-center justify-center min-h-[52px] px-8 rounded-full text-white font-bold hover:opacity-90 transition-opacity"
            >
              {c.cta}
            </Link>
            {c.footnote && (
              <p className="text-sm text-[#C9B8AB]">{c.footnote}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-md lg:justify-self-end">
          <div
            style={{ backgroundColor: c.accent }}
            className="rounded-3xl px-7 py-7 sm:px-9 sm:py-8 flex flex-col gap-2"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFE7D9]">
              {c.offerLabel}
            </p>
            <p
              className={`font-display font-black uppercase leading-[0.95] text-white ${
                longOffer ? "text-4xl sm:text-5xl" : "text-7xl sm:text-8xl"
              }`}
            >
              {c.offerBig}
              {c.offerSmall && (
                <span className="text-2xl sm:text-3xl ml-2">{c.offerSmall}</span>
              )}
            </p>
            {c.offerNote && (
              <p className="text-base sm:text-lg text-[#FFF3EC]">{c.offerNote}</p>
            )}
          </div>
          {c.code && <CopyCode code={c.code} />}
        </div>
      </div>
    </section>
  );
}
