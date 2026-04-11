"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Star,
  Sparkles,
  Flame,
  Zap,
  Palette,
  PartyPopper,
  BookOpen,
  ChevronDown,
  Users,
  Award,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion-wrapper";
import { ParticleField } from "@/components/particles";
import { Marquee } from "@/components/marquee";
import { products, testimonials } from "@/lib/data";

const featuredProducts = products.slice(0, 4);

const categoryCards = [
  {
    icon: Flame,
    title: "3D FDM Printing",
    desc: "Custom objects, functional parts, decorative pieces",
    color: "from-orange-500/20 to-amber-500/5",
  },
  {
    icon: Zap,
    title: "Resin Printing",
    desc: "Ultra-fine detail, smooth finish, miniatures & figurines",
    color: "from-purple-500/20 to-amber-500/5",
  },
  {
    icon: Sparkles,
    title: "Lithophane Lamps",
    desc: "Your photo embedded in light — coming soon",
    color: "from-amber-500/20 to-yellow-500/5",
  },
  {
    icon: Palette,
    title: "Miniatures",
    desc: "Custom tabletop gaming miniatures, hand-finished",
    color: "from-emerald-500/20 to-amber-500/5",
  },
  {
    icon: PartyPopper,
    title: "Kit Party",
    desc: "DIY craft kits for parties — everything included",
    color: "from-pink-500/20 to-amber-500/5",
  },
  {
    icon: BookOpen,
    title: "Agendas & Planners",
    desc: "Laser-engraved personalised planners & agendas",
    color: "from-blue-500/20 to-amber-500/5",
  },
];

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);

  return (
    <>
      {/* ===== HERO ===== */}
      <section
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden bg-charcoal-900"
      >
        {/* Deep black base with subtle radial gradient */}
        <motion.div
          style={{ scale: heroScale }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,160,32,0.06)_0%,_rgba(10,10,10,1)_70%)]" />
          <div className="absolute inset-0 bg-noise opacity-40" />
        </motion.div>

        {/* Ambient glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-amber-500/[0.04] rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-amber-600/[0.03] rounded-full blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/[0.02] rounded-full blur-[200px]" />

        {/* Particle field */}
        <ParticleField />

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
        >
          {/* Subtle top accent */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 80 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-10"
          />

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9] mb-6"
          >
            <span className="text-foreground">Never Settle</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
              Saga
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="font-display text-lg sm:text-xl md:text-2xl font-light tracking-[0.15em] text-gray-400 mb-12"
          >
            Handcrafted. Personalised. Unforgettable.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/shop">
              <Button size="xl" className="gap-3 group text-base px-10">
                Shop Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="xl" className="text-base px-10">
                Our Story
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase text-gray-600">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4 text-amber-500/40" />
          </motion.div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-charcoal-900 to-transparent z-[2]" />
      </section>

      {/* ===== MARQUEE ===== */}
      <Marquee />

      {/* ===== CATEGORIES ===== */}
      <section className="py-28 bg-charcoal-900 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,160,32,0.03)_0%,_transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <FadeIn className="text-center mb-16">
            <p className="text-amber-500/50 text-xs uppercase tracking-[0.4em] mb-4">
              What We Create
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Our <span className="text-gradient">Craft</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              Six disciplines. One obsession.
            </p>
          </FadeIn>

          <StaggerContainer
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            staggerDelay={0.08}
          >
            {categoryCards.map((item) => (
              <StaggerItem key={item.title}>
                <Link href={`/shop?category=${encodeURIComponent(item.title)}`}>
                  <div className="group relative p-7 rounded-xl bg-charcoal-800/60 border border-charcoal-50/10 hover:border-amber-500/25 transition-all duration-500 h-full overflow-hidden">
                    {/* Hover glow background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`} />

                    {/* Content */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-5 group-hover:bg-amber-500/20 group-hover:shadow-lg group-hover:shadow-amber-500/10 transition-all duration-500">
                        <item.icon className="w-6 h-6 text-amber-400" />
                      </div>
                      <h3 className="font-display font-semibold text-lg mb-2 text-foreground group-hover:text-amber-200 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                        {item.desc}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-xs text-amber-500/0 group-hover:text-amber-500/70 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
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
      <section className="py-32 bg-charcoal-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-30" />
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <FadeIn>
            <motion.h2
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
            >
              <span className="text-gray-600">We don&apos;t make products.</span>
              <br />
              <span className="text-gradient">We make memories.</span>
            </motion.h2>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="mt-8 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
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
      <section className="py-16 bg-charcoal-800/50 border-y border-charcoal-50/5">
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
                        ? "text-amber-400 fill-amber-400"
                        : "text-amber-500/50"
                    }`}
                  />
                  <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 tracking-wider uppercase">
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
        <section className="py-24 bg-charcoal-900 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[150px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <FadeIn className="flex items-end justify-between mb-12">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2">
                  Featured <span className="text-gradient">Products</span>
                </h2>
                <p className="text-gray-500">Our most loved creations</p>
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
      <section className="py-24 bg-charcoal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <p className="text-amber-500/50 text-xs uppercase tracking-[0.4em] mb-4">
              Testimonials
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              What People <span className="text-gradient">Say</span>
            </h2>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((t) => (
              <StaggerItem key={t.id}>
                <div className="p-6 rounded-xl bg-charcoal-800/40 border border-charcoal-50/10 h-full flex flex-col hover:border-amber-500/15 transition-colors duration-300">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-500 text-amber-500"
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 leading-relaxed flex-1 mb-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="pt-4 border-t border-charcoal-50/10">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-600">
                      {t.location} — {t.product}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="py-24 bg-charcoal-800/30 border-t border-charcoal-50/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="text-amber-500/50 text-xs uppercase tracking-[0.4em] mb-4">
              Stay in the Loop
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Join the <span className="text-gradient">Saga</span>
            </h2>
            <p className="text-gray-500 mb-8 text-lg">
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
            <p className="text-xs text-gray-700 mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
