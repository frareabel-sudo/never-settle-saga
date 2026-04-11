"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Printer, Cpu, Lightbulb, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion-wrapper";

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 lg:pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1920&h=1080&fit=crop"
            alt="3D printing workshop"
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/50 via-charcoal-900/80 to-charcoal-900" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <FadeIn>
            <p className="text-amber-500/60 text-sm uppercase tracking-[0.3em] mb-4">
              Our Story
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Made with love.{" "}
              <span className="text-gradient">Built to last.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.4}>
            <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
              We are Abel and Jennifer — a couple who turned creativity into craft,
              and craft into Never Settle Saga. From our London studio, every piece
              we make carries a little piece of us. We don&apos;t do mass production.
              We do meaning.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-24 bg-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop"
                  alt="Abel and Jennifer in the workshop"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-800/50 to-transparent" />
              </div>
            </FadeIn>
            <FadeIn direction="right">
              <div>
                <h2 className="font-display text-3xl font-bold mb-6">
                  The <span className="text-gradient">Beginning</span>
                </h2>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    It started in 2022, in the spare room of a small London flat.
                    Abel had been tinkering with 3D printing as a hobby, but when
                    he printed his first lithophane — a glowing portrait of Jennifer
                    — something clicked.
                  </p>
                  <p>
                    That first lamp was rough around the edges, but the reaction was
                    extraordinary. Friends wanted one. Family wanted one. Strangers
                    on the internet wanted one. What started as a curiosity became a
                    calling.
                  </p>
                  <p>
                    From custom 3D prints and resin miniatures to laser-engraved
                    planners and personalised lithophane lamps — everything we create
                    is made with precision, passion, and purpose. Because you deserve
                    more than ordinary.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Meet the Makers */}
      <section className="py-24 bg-charcoal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Meet the <span className="text-gradient">Makers</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Behind every product is a husband-and-wife team who believe in making
              things that matter.
            </p>
          </FadeIn>

          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                {/* Team photo */}
                <div>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-charcoal-50/10 shadow-2xl shadow-black/30">
                    <Image
                      src="/images/about/about-team.jpg"
                      alt="Abel, Jennifer and family at the London Eye"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-4 italic">
                    Abel, Jennifer &amp; family — London Eye, London 🇬🇧
                  </p>
                </div>

                {/* Bios */}
                <div className="space-y-8">
                  <div>
                    <h3 className="font-display text-xl font-bold mb-1">Abel</h3>
                    <p className="text-amber-500/70 text-sm mb-3">Founder &amp; Master Maker</p>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Self-taught 3D printing enthusiast turned professional craftsman.
                      Abel runs every printer, calibrates every laser, and hand-finishes
                      every product. His obsession with detail borders on unhealthy — and
                      that&apos;s exactly what makes the work extraordinary.
                    </p>
                  </div>
                  <div className="border-t border-charcoal-50/10 pt-8">
                    <h3 className="font-display text-xl font-bold mb-1">Jennifer</h3>
                    <p className="text-amber-500/70 text-sm mb-3">Co-Founder &amp; Creative Director</p>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      The heart and voice of Never Settle Saga. Jennifer handles creative
                      direction, brand identity, customer experience, and the personal
                      touches that turn a product into a gift. Every handwritten note
                      in your order? That&apos;s her.
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="py-24 bg-charcoal-800 bg-noise">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Our <span className="text-gradient">Process</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From your idea to your doorstep — every step is deliberate.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "You Share",
                desc: "Upload your photo, choose your product, add your personalisation details.",
              },
              {
                step: "02",
                title: "We Design",
                desc: "We optimise your image, prepare the digital files, and plan the production.",
              },
              {
                step: "03",
                title: "We Craft",
                desc: "Your product is printed, engraved, or assembled by hand in our London workshop.",
              },
              {
                step: "04",
                title: "We Deliver",
                desc: "Quality-checked, carefully packaged, and shipped with a handwritten note.",
              },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="relative">
                  <span className="font-display text-6xl font-bold text-amber-500/10 absolute -top-4 -left-2">
                    {item.step}
                  </span>
                  <div className="relative pt-8 pl-2">
                    <h3 className="font-display text-xl font-bold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Equipment & Craft */}
      <section className="py-24 bg-charcoal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Tools of the <span className="text-gradient">Trade</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Professional-grade equipment meets artisan care.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Printer,
                title: "FDM 3D Printers",
                desc: "Bambu Lab printers running 24/7 with premium PLA filaments.",
              },
              {
                icon: Cpu,
                title: "Laser Engraver",
                desc: "Precision diode laser for clean engravings on wood, glass, and acrylic.",
              },
              {
                icon: Lightbulb,
                title: "LED Systems",
                desc: "Custom warm-white and RGB LED modules designed for optimal lithophane illumination.",
              },
              {
                icon: Wrench,
                title: "Finishing Station",
                desc: "Hand-sanding, painting, and assembly area where every product gets its final polish.",
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <div className="p-6 rounded-lg bg-charcoal-800/40 border border-charcoal-50/10 h-full">
                  <item.icon className="w-8 h-8 text-amber-400 mb-4" />
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-charcoal-800/50 border-t border-charcoal-50/5 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <FadeIn>
            <p className="text-amber-500/50 text-xs uppercase tracking-[0.4em] mb-6">
              What are you waiting for?
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Your journey starts here — because settling is{" "}
              <span className="text-gradient">never an option</span>.
            </h2>
            <p className="text-gray-400 mb-8">
              Browse our collection or get in touch with a custom request.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/shop">
                <Button size="lg" className="gap-2">
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg">
                  Contact Us
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
