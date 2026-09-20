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
function buildCraftCards(categories: string[], products: Product[]) {
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

  return buildCategoryTree(categories)
    .map((node) => ({
      title: node.label,
      value: node.value,
      count: counts.get(node.value) ?? 0,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((c, i) => ({
      ...c,
      icon: CATEGORY_ICONS[c.title.trim().toLowerCase()] ?? Sparkles,
      color: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
      desc:
        c.count === 1 ? "1 piece, handmade" : `${c.count} pieces, handmade`,
    }));
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
  const craftCards = useMemo(
    () => buildCraftCards(categories, products),
    [categories, products],
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            staggerDelay={0.08}
          >
            {craftCards.map((item) => (
              <StaggerItem key={item.value}>
                <Link href={`/shop?category=${encodeURIComponent(item.value)}`}>
                  <div className="group relative p-7 rounded-xl bg-surface-alt/60 border border-surface-line/10 hover:border-brand-500/25 transition-all duration-500 h-full overflow-hidden">
                    {/* Hover glow background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`} />

                    {/* Content */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-5 group-hover:bg-brand-500/20 group-hover:shadow-lg group-hover:shadow-brand-500/10 transition-all duration-500">
                        <item.icon className="w-6 h-6 text-brand-500" />
                      </div>
                      <h3 className="font-display font-semibold text-lg mb-2 text-foreground group-hover:text-brand-600 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-sm text-ink-soft group-hover:text-ink-muted transition-colors duration-300">
                        {item.desc}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-xs text-brand-500/0 group-hover:text-brand-600 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        Explore <ArrowRight className="w-3 h-3" />
                      </div>
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
