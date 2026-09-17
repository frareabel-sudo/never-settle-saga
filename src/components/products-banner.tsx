"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion-wrapper";

const BANNER_SRC = "/images/banners/new-products.jpg";
const BANNER_ALT =
  "Never Settle Saga product range: personalised mugs, tumblers, notebooks, tote bags, keyrings and gift boxes";

/**
 * Wide showcase band for the current product range.
 *
 * The artwork is 2048x768 (8:3) and busy edge to edge, so nothing is written on
 * top of it — the copy sits above and below instead, and the image keeps its
 * full width on every breakpoint. Fixed heights with object-cover stop it from
 * collapsing to a 140px sliver on a phone.
 *
 * `variant="strip"` is the /shop version: image only, shorter, no heading or
 * CTA, because the page already carries both and the visitor is already here.
 */
export function ProductsBanner({
  variant = "section",
}: {
  variant?: "section" | "strip";
}) {
  if (variant === "strip") {
    return (
      <FadeIn delay={0.15}>
        <div className="relative rounded-2xl overflow-hidden border border-surface-line/40 shadow-sm">
          <div className="relative h-[150px] sm:h-[220px] lg:h-[300px]">
            <Image
              src={BANNER_SRC}
              alt={BANNER_ALT}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-[center_62%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface/30 via-transparent to-surface/30 pointer-events-none" />
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <section className="py-20 bg-surface relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-10">
          <p className="text-brand-600 text-xs uppercase tracking-[0.4em] mb-4">
            New In
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            The <span className="text-gradient">Collection</span>
          </h2>
          <p className="text-ink-soft max-w-xl mx-auto text-lg">
            Mugs, tumblers, planners, tote bags, keyrings and more — all
            personalised, all made by hand.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Link
            href="/shop"
            aria-label="Shop the full product collection"
            className="group block relative rounded-2xl overflow-hidden border border-surface-line/40 shadow-sm hover:shadow-lg transition-shadow duration-500"
          >
            <div className="relative h-[240px] sm:h-[320px] lg:h-[400px]">
              <Image
                src={BANNER_SRC}
                alt={BANNER_ALT}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
              />
              {/* Soft edge vignette so the artwork melts into the cream page */}
              <div className="absolute inset-0 bg-gradient-to-r from-surface/30 via-transparent to-surface/30 pointer-events-none" />
            </div>
          </Link>
        </FadeIn>

        <FadeIn delay={0.35}>
          <div className="mt-10 text-center">
            <Link href="/shop">
              <Button size="lg" className="gap-2 group">
                Shop the Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
