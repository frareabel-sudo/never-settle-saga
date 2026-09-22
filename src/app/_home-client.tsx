"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo, useRef } from "react";
import {
  ArrowRight,
  Star,
  Sparkles,
  Flame,
  Zap,
  Palette,
  PartyPopper,
  BookOpen,
  Users,
  Award,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion-wrapper";
import { Marquee } from "@/components/marquee";
import { type Product, type Testimonial } from "@/lib/data";
import { buildCategoryTree, parentOf } from "@/lib/category-tree";
import { isCorporate } from "@/lib/personalisation";
import { activeSeason, daysLeft, isSeasonCategory } from "@/lib/seasonal";
import type { LucideIcon } from "lucide-react";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";

/**
 * Icons for the categories we know about. Anything else gets `Sparkles` —
 * a new category should appear on the home page the day it is created, not
 * whenever someone remembers to edit this file.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  keychains: Zap,
  planners: BookOpen,
  organizer: Palette,
  "anti-stress": Heart,
  colouring: Palette,
  earrings: Sparkles,
  "eco-bag": Award,
  "home decor": Flame,
  kits: PartyPopper,
  articulados: Users,
};

const CARD_GRADIENTS = [
  "from-orange-500/20 to-brand-500/5",
  "from-purple-500/20 to-brand-500/5",
  "from-brand-500/20 to-brand-400/5",
  "from-emerald-500/20 to-brand-500/5",
  "from-pink-500/20 to-brand-500/5",
  "from-sky-500/20 to-brand-500/5",
];

/**
 * The six biggest real categories, by how many products are actually in them.
 *
 * This used to be a hand-written list of "disciplines" (Resin Printing,
 * Miniatures, Kit Party…) that no longer matched a single category in the
 * shop — the cards promised sections we do not stock and their Explore links
 * filtered to nothing. Deriving from the live catalogue means the promise and
 * the stock cannot drift apart again.
 */
function buildCraftCards(
  categories: string[],
  products: Product[],
  seasonCategory?: (name: string) => boolean,
) {
  const counts = new Map<string, number>();
  for (const p of products) {
    const owned =
      Array.isArray(p.categories) && p.categories.length > 0
        ? p.categories
        : [p.category];
    for (const c of owned) {
      if (!c) continue;
      const parent = parentOf(c);
      counts.set(parent, (counts.get(parent) ?? 0) + 1);
    }
  }

  // One picture per category, taken from the first product filed under it that
  // actually has a photo. No separate artwork to commission and nothing to keep
  // in sync: photograph a product, the tile updates itself.
  const images = new Map<string, string>();
  for (const p of products) {
    const src = p.images?.[0];
    if (!src) continue;
    const owned =
      Array.isArray(p.categories) && p.categories.length > 0
        ? p.categories
        : [p.category];
    for (const c of owned) {
      if (!c) continue;
      const parent = parentOf(c);
      if (!images.has(parent)) images.set(parent, src);
    }
  }

  return buildCategoryTree(categories)
    .map((node) => ({
      title: node.label,
      value: node.value,
      count: counts.get(node.value) ?? 0,
      image: images.get(node.value) ?? null,
    }))
    .filter((c) => c.count > 0)
    // Busiest first, EXCEPT the corporate line, which is pinned to the front.
    // A business buyer arrives looking for exactly one thing and should not
    // have to hunt for it; everyone else scrolls past a single tile.
    .sort((a, b) => {
      // Season first (it expires), then corporate, then busiest.
      const sa = !!seasonCategory && seasonCategory(a.value);
      const sb = !!seasonCategory && seasonCategory(b.value);
      if (sa !== sb) return sa ? -1 : 1;
      const ca = isCorporate({ category: a.value });
      const cb = isCorporate({ category: b.value });
      if (ca !== cb) return ca ? -1 : 1;
      return b.count - a.count;
    })
    .slice(0, 6)
    .map((c, i) => {
      const corporate = isCorporate({ category: c.value });
      return {
        ...c,
        corporate,
        icon: CATEGORY_ICONS[c.title.trim().toLowerCase()] ?? Sparkles,
        color: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
        desc: corporate
          ? "Bulk orders · your logo"
          : c.count === 1
            ? "1 piece, handmade"
            : `${c.count} pieces, handmade`,
      };
    });
}

export default function HomeClient({
  products,
  reviews,
  categories,
}: {
  products: Product[];
  reviews: Testimonial[];
  categories: string[];
}) {
  const featuredProducts = products.slice(0, 4);
  // Seasonal band. Renders only inside its date window AND only when the
  // category actually has products — an empty "Halloween" heading is worse
  // than no Halloween at all.
  const season = useMemo(() => activeSeason(), []);
  const seasonProducts = useMemo(() => {
    if (!season) return [];
    return products
      .filter((p) => {
        const owned =
          Array.isArray(p.categories) && p.categories.length > 0
            ? p.categories
            : [p.category];
        return owned.some((c) => isSeasonCategory(season, c ?? ""));
      })
      .slice(0, 4);
  }, [season, products]);

  // Link to whichever spelling the shop actually uses, not the ideal one.
  const seasonHref = useMemo(() => {
    if (!season) return null;
    const match = categories.find((c) => isSeasonCategory(season, c));
    return `/shop?category=${encodeURIComponent(match ?? season.category)}`;
  }, [season, categories]);

  const craftCards = useMemo(
    () =>
      buildCraftCards(
        categories,
        products,
        seasonProducts.length > 0 && season
          ? (name: string) => isSeasonCategory(season, name)
          : undefined,
      ),
    [categories, products, season, seasonProducts],
  );
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <>
      {/* ===== HERO =====
          The product photo IS the hero: visitors see the range before they
          scroll. Copy sits in a translucent strip pinned to the bottom of the
          image rather than floating over the middle, because the artwork is
          busy edge to edge and has no quiet area to hold type. */}
      <section
        ref={heroRef}
        className="relative pt-16 lg:pt-20 bg-surface"
      >
        <div className="relative w-full">
          {/* The artwork is 8:3 — ultra-wide. Held at its own ratio a phone gets
              a ~140px sliver where nothing is legible, so narrow screens take a
              taller box and crop the sides instead; the centre of the
              composition survives and only the outer plants and t-shirt go. */}
          <div className="relative w-full aspect-[3/2] sm:aspect-[21/9] lg:aspect-[8/3] overflow-hidden">
            <motion.div style={{ scale: heroScale }} className="absolute inset-0">
              <Image
                src="/images/banners/new-products.jpg"
                alt="Never Settle Saga product range: personalised mugs, tumblers, notebooks, tote bags, keyrings and gift boxes"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </motion.div>
          </div>

          {/* Copy strip sits UNDER the photo, never over it. An overlay was
              tried and rejected: the products in this shot run along the
              bottom of the frame, so any bottom-anchored band hides exactly
              the keyrings, mugs and t-shirt the banner exists to show. */}
          <div className="relative bg-surface border-t border-surface-line/30">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7 lg:py-9 text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3"
              >
                <span className="text-foreground">Never Settle </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-500 via-brand-500 to-brand-600">
                  Saga
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 }}
                className="text-ink-muted text-sm sm:text-base lg:text-lg mb-5 sm:mb-6 max-w-2xl mx-auto"
              >
                Mugs, tumblers, planners, tote bags, keyrings and more — handcrafted
                and personalised just for you.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 justify-center"
              >
                <Link href="/shop">
                  <Button size="lg" className="w-full sm:w-auto gap-2 group px-8">
                    Shop the Collection
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                    Our Story
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <Marquee />

      {/* ===== SEASONAL BAND ===== */}
      {season && seasonProducts.length > 0 && (
        <section className="py-16 bg-surface-alt border-y border-surface-line/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10">
              <p className="inline-flex items-center gap-2 rounded-full bg-brand-500 text-white text-[11px] font-semibold uppercase tracking-[0.2em] px-3 py-1 mb-4">
                {season.eyebrow} · {daysLeft(season)} days left
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-3">
                <span className="text-gradient">{season.title}</span>
              </h2>
              <p className="text-ink-muted max-w-2xl mx-auto">{season.blurb}</p>
            </FadeIn>

            <StaggerContainer
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
              staggerDelay={0.08}
            >
              {seasonProducts.map((p) => (
                <StaggerItem key={p.id}>
                  <ProductCard product={p} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            <FadeIn delay={0.3}>
              <div className="mt-10 text-center">
                <Link href={seasonHref ?? "/shop"}>
                  <Button size="lg" className="gap-2 group">
                    {season.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ===== CATEGORIES ===== */}
      <section className="py-28 bg-surface relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(156,66,33,0.05)_0%,_transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <FadeIn className="text-center mb-16">
            <p className="text-brand-600 text-xs uppercase tracking-[0.4em] mb-4">
              What We Create
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Our <span className="text-gradient">Craft</span>
            </h2>
            <p className="text-ink-soft max-w-xl mx-auto text-lg">
              Handmade, one piece at a time.
            </p>
          </FadeIn>

          <StaggerContainer
            className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
            staggerDelay={0.08}
          >
            {craftCards.map((item) => (
              <StaggerItem key={item.value} className={item.corporate ? "col-span-2 lg:col-span-1" : undefined}>
                <Link href={`/shop?category=${encodeURIComponent(item.value)}`}>
                  <div
                    className={`group relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all duration-500 ${
                      item.corporate
                        ? "border-brand-500/50 hover:border-brand-500 ring-1 ring-brand-500/20"
                        : "border-surface-line/20 hover:border-brand-500/30"
                    }`}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-surface-alt flex items-center justify-center">
                        <item.icon className="w-10 h-10 text-brand-500/40" />
                      </div>
                    )}

                    {/* Scrim — the name has to stay readable over any photo,
                        and product shots here are bright and busy. */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

                    {item.corporate && (
                      <span className="absolute top-3 left-3 rounded-full bg-brand-500 text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1">
                        For business
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <h3 className="font-display font-bold text-lg sm:text-xl text-white drop-shadow-sm leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-white/80 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ===== BRAND STATEMENT ===== */}
      <section className="py-32 bg-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-30" />
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <FadeIn>
            <motion.h2
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
            >
              <span className="text-ink-soft">We don&apos;t make products.</span>
              <br />
              <span className="text-gradient">We make memories.</span>
            </motion.h2>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="mt-8 text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">
              Every piece that leaves our London workshop carries a piece of
              someone&apos;s story. A birthday. A memory. A moment worth keeping forever.
            </p>
          </FadeIn>
          <FadeIn delay={0.5}>
            <div className="mt-10">
              <Link href="/about">
                <Button variant="outline" size="lg" className="gap-2 group">
                  Read Our Story
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ===== SOCIAL PROOF ===== */}
      <section className="py-16 bg-surface-alt/50 border-y border-surface-line/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {[
                {
                  icon: Star,
                  value: "4.9/5",
                  label: "Average Rating",
                  accent: true,
                },
                {
                  icon: Users,
                  value: "500+",
                  label: "Happy Customers",
                  accent: false,
                },
                {
                  icon: Award,
                  value: "100%",
                  label: "Handmade",
                  accent: false,
                },
                {
                  icon: Heart,
                  value: "London",
                  label: "Made with Love",
                  accent: false,
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon
                    className={`w-5 h-5 mx-auto mb-3 ${
                      stat.accent
                        ? "text-brand-500 fill-brand-500"
                        : "text-brand-600"
                    }`}
                  />
                  <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-ink-soft mt-1 tracking-wider uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      {featuredProducts.length > 0 && (
        <section className="py-24 bg-surface relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/[0.03] rounded-full blur-[150px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <FadeIn className="flex items-end justify-between mb-12">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">
                  Featured <span className="text-gradient">Products</span>
                </h2>
                <p className="text-ink-soft">Our most loved creations</p>
              </div>
              <Link href="/shop">
                <Button variant="outline" className="hidden sm:flex gap-2">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>

            <div className="sm:hidden mt-8 text-center">
              <Link href="/shop">
                <Button variant="outline" className="gap-2">
                  View All Products <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <p className="text-brand-600 text-xs uppercase tracking-[0.4em] mb-4">
              Testimonials
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              What People <span className="text-gradient">Say</span>
            </h2>
          </FadeIn>

          <TestimonialsCarousel reviews={reviews} />
          {reviews.length > 1 && (
            <p className="text-center text-xs text-ink-soft mt-6">
              Showing {reviews.length} verified review{reviews.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="py-24 bg-surface-alt/30 border-t border-surface-line/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="text-brand-600 text-xs uppercase tracking-[0.4em] mb-4">
              Stay in the Loop
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Join the <span className="text-gradient">Saga</span>
            </h2>
            <p className="text-ink-soft mb-8 text-lg">
              New drops, behind-the-scenes content, and exclusive offers.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="email"
                placeholder="your@email.com"
                className="flex-1"
                required
              />
              <Button type="submit" className="whitespace-nowrap">
                Subscribe
              </Button>
            </form>
            <p className="text-xs text-ink-soft mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
