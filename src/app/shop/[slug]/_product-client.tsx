"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { NssWatermark } from "@/components/nss-watermark";
import {
  ArrowLeft,
  Star,
  ShoppingBag,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Bell,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { FadeIn } from "@/components/motion-wrapper";
import { type Product } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import {
  CORPORATE_GUIDANCE,
  PHOTO_GUIDANCE,
  isCorporate,
  isPersonalisable,
  whatsAppLink,
} from "@/lib/personalisation";

export default function ProductClient({
  product,
  related,
  whatsAppNumber,
}: {
  product: Product;
  related: Product[];
  whatsAppNumber?: string;
}) {
  // Products we personalise with the customer's own picture. There is no
  // upload yet: the photo is collected over WhatsApp after the order, so this
  // block exists to set that expectation BEFORE the sale rather than surprise
  // the customer in the confirmation email.
  // Corporate wins when a product is both: the logo briefing is the stronger
  // instruction, and a bulk buyer is not sending a family photo.
  const corporate = isCorporate(product);
  const needsPhoto = !corporate && isPersonalisable(product);
  const photoChatLink = whatsAppLink(
    whatsAppNumber,
    `Hi! I'd like a personalised ${product.name}`,
  );
  const corporateChatLink = whatsAppLink(
    whatsAppNumber,
    `Hi! I'd like to ask about ${product.name} for corporate gifts`,
  );

  const isComingSoon = product.status === "coming-soon";
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const { addItem } = useCart();

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (!hasVariants) return {};
    const primary = product.variants!.find((v) => v.primary && v.active) ?? product.variants!.find((v) => v.active);
    return primary ? { ...primary.optionValues } : {};
  });

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return undefined;
    return product.variants!.find(
      (v) =>
        v.active &&
        Object.entries(selectedOptions).every(([k, val]) => v.optionValues[k] === val)
    );
  }, [hasVariants, product.variants, selectedOptions]);

  function isOptionAvailable(optionName: string, value: string): boolean {
    if (!product.variants) return true;
    // Available if there's any active variant that matches all *other* selected options plus this value.
    return product.variants.some((v) => {
      if (!v.active) return false;
      if (v.optionValues[optionName] !== value) return false;
      for (const [k, val] of Object.entries(selectedOptions)) {
        if (k === optionName) continue;
        if (v.optionValues[k] !== val) return false;
      }
      return true;
    });
  }

  const displayPrice = selectedVariant?.price ?? product.price;
  const canAddToCart = !hasVariants || Boolean(selectedVariant);

  // v3.34 — Promotions that apply to what the shopper currently has selected.
  // Variant products key promos by variant id; simple products use "".
  const activePromotions = useMemo(() => {
    const key = selectedVariant?.id ?? "";
    return (product.promotions ?? [])
      .filter((p) => p.variantId === key)
      .sort((a, b) => a.minQty - b.minQty);
  }, [product.promotions, selectedVariant?.id]);

  // Full gallery: every product photo (master + every variant), de-duplicated, sorted by order.
  // Variant selection still drives the hero (via effect below) but the strip stays full.
  const allImages = useMemo(() => {
    const photos = product.photos ?? [];
    if (photos.length > 0) {
      const sorted = [...photos].sort((a, b) => a.order - b.order);
      const seen = new Set<string>();
      const urls: string[] = [];
      for (const p of sorted) {
        if (!seen.has(p.url)) {
          seen.add(p.url);
          urls.push(p.url);
        }
      }
      return urls;
    }
    return product.images.length > 0 ? product.images : [];
  }, [product.photos, product.images]);

  // When variant changes, jump hero to that variant's first tagged photo.
  useEffect(() => {
    if (!selectedVariant?.id) return;
    const photos = product.photos ?? [];
    const firstTagged = photos
      .filter((p) => p.variantIds.includes(selectedVariant.id))
      .sort((a, b) => a.order - b.order)[0];
    if (!firstTagged) return;
    const idx = allImages.indexOf(firstTagged.url);
    if (idx >= 0) setSelectedImage(idx);
  }, [selectedVariant?.id, allImages, product.photos]);

  // Bounds guard.
  useEffect(() => {
    if (selectedImage >= allImages.length) setSelectedImage(0);
  }, [allImages, selectedImage]);

  const heroUrl = allImages[selectedImage] ?? allImages[0];

  const goPrev = () => {
    if (allImages.length === 0) return;
    setSelectedImage((i) => (i - 1 + allImages.length) % allImages.length);
  };
  const goNext = () => {
    if (allImages.length === 0) return;
    setSelectedImage((i) => (i + 1) % allImages.length);
  };

  return (
    <>
      {/* Breadcrumb — pt clears the fixed header (h-16 / lg:h-20), which takes
          no space in the flow. Without it the breadcrumb sits underneath and
          shows through the header's translucent background. */}
      <div className="pt-16 lg:pt-20 bg-surface-strip border-b border-surface-line/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Link href="/shop" className="hover:text-brand-500 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Shop
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-ink-muted">{product.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product */}
      <section className="py-12 bg-surface-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Gallery */}
            <FadeIn direction="left">
              <div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-surface-card border border-surface-line/30 mb-4">
                  <AnimatePresence mode="sync" initial={false}>
                    {heroUrl ? (
                      <motion.div
                        key={heroUrl}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={heroUrl}
                          alt={product.name}
                          fill
                          className={`object-cover ${isComingSoon ? "opacity-80" : ""}`}
                          priority
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="watermark-hero"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        <NssWatermark className="w-full h-full [&_svg]:w-full [&_svg]:h-full" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="absolute top-4 left-4 flex gap-2 z-10">
                    {isComingSoon ? (
                      <Badge variant="amber">Coming Soon</Badge>
                    ) : (
                      <>
                        <Badge variant="default">Available</Badge>
                        {product.badge && <Badge variant="amber">{product.badge}</Badge>}
                      </>
                    )}
                  </div>
                  {allImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface-strip/70 hover:bg-surface-strip border border-surface-line/30 hover:border-brand-500/50 flex items-center justify-center text-white hover:text-brand-500 transition-all backdrop-blur-sm"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface-strip/70 hover:bg-surface-strip border border-surface-line/30 hover:border-brand-500/50 flex items-center justify-center text-white hover:text-brand-500 transition-all backdrop-blur-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-3 flex-wrap">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {allImages.map((img, i) => (
                      <motion.button
                        key={img}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelectedImage(i)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === i
                            ? "border-brand-500 shadow-lg shadow-brand-500/20"
                            : "border-surface-line/30 hover:border-brand-500/50"
                        }`}
                      >
                        <Image src={img} alt="" fill className="object-cover" />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </FadeIn>

            {/* Details */}
            <FadeIn direction="right">
              <div>
                <p className="text-brand-600 text-sm uppercase tracking-wider mb-2">
                  {product.category}
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                  {product.name}
                </h1>

                {/* Rating */}
                {product.reviews > 0 && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? "fill-brand-500 text-brand-500"
                              : "text-ink-soft"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-ink-muted">
                      {product.rating} ({product.reviews} reviews)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-6">
                  <span className={`font-display text-3xl font-bold ${isComingSoon ? "text-brand-600" : "text-brand-500"}`}>
                    {formatPrice(displayPrice)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-ink-soft line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* v3.34 — Quantity-break offers for the selected variant. */}
                {activePromotions.length > 0 && !isComingSoon && (
                  <div className="mb-6 rounded-lg border border-brand-500/20 bg-brand-500/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-wider text-brand-600 mb-1.5">
                      Buy more, pay less
                    </p>
                    <ul className="space-y-1">
                      {activePromotions.map((p) => (
                        <li key={p.id} className="text-sm text-ink-muted">
                          <span className="text-brand-600 font-semibold">{p.minQty}+</span>{" "}
                          — {formatPrice(p.price)} each
                          {displayPrice > p.price && (
                            <span className="text-ink-soft">
                              {" "}
                              (save {Math.round(((displayPrice - p.price) / displayPrice) * 100)}%)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-[11px] text-ink-soft">
                      Discount applied automatically at checkout.
                    </p>
                  </div>
                )}

                <p className="text-ink-muted leading-relaxed mb-8">
                  {product.longDescription}
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2 mb-8">
                  {product.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-sm text-ink-muted"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      {f}
                    </div>
                  ))}
                </div>

                {/* Coming Soon — Notify Me */}
                {isComingSoon ? (
                  <div className="mb-8 p-6 rounded-lg bg-brand-500/5 border border-brand-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Bell className="w-5 h-5 text-brand-500" />
                      <h3 className="font-semibold text-brand-600">
                        This product is coming soon
                      </h3>
                    </div>
                    <p className="text-sm text-ink-muted mb-4">
                      Be the first to know when this launches. Enter your email and we&apos;ll notify you.
                    </p>
                    {notifySubmitted ? (
                      <div className="flex items-center gap-2 text-sm text-brand-500">
                        <Mail className="w-4 h-4" />
                        Thanks! We&apos;ll email you at <span className="font-medium">{notifyEmail}</span> when it&apos;s ready.
                      </div>
                    ) : (
                      <form
                        className="flex gap-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (notifyEmail) {
                            window.location.href = `mailto:helpdesk@neversettlesaga.com?subject=Notify Me: ${product.name}&body=Please notify me at ${notifyEmail} when ${product.name} becomes available.`;
                            setNotifySubmitted(true);
                          }
                        }}
                      >
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          className="flex-1"
                          required
                        />
                        <Button type="submit" className="gap-2">
                          <Bell className="w-4 h-4" /> Notify Me
                        </Button>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Variant selectors */}
                    {hasVariants && product.options && (
                      <div className="mb-6 space-y-4">
                        {product.options.map((opt) => (
                          <div key={opt.name}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-600">
                                {opt.name}
                              </h3>
                              {selectedOptions[opt.name] && (
                                <span className="text-sm text-ink-muted">
                                  {selectedOptions[opt.name]}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {opt.values.map((val) => {
                                const available = isOptionAvailable(opt.name, val);
                                const selected = selectedOptions[opt.name] === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    disabled={!available}
                                    onClick={() =>
                                      setSelectedOptions((prev) => ({
                                        ...prev,
                                        [opt.name]: val,
                                      }))
                                    }
                                    className={`px-3.5 py-2 rounded-full text-sm border transition ${
                                      selected
                                        ? "bg-brand-500 text-white border-brand-500"
                                        : available
                                        ? "bg-surface-card/30 text-ink border-surface-line/20 hover:border-brand-500/60"
                                        : "bg-surface-card/10 text-ink-soft border-surface-line/10 line-through cursor-not-allowed"
                                    }`}
                                  >
                                    {val}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Customisation */}
                    {product.customisable && product.customOptions && (
                      <div className="mb-8 p-4 rounded-lg bg-surface-card/30 border border-surface-line/20">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-600 mb-3">
                          Personalisation Options
                        </h3>
                        <div className="space-y-3">
                          {product.customOptions.map((opt) => (
                            <div key={opt} className="flex items-center gap-2 text-sm text-ink-muted">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-500/50" />
                              {opt}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <Input
                            placeholder="Enter your personalisation text..."
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Corporate / bulk — what can be personalised, and that
                        the brief is agreed after the order rather than crammed
                        into a checkout field. */}
                    {corporate && (
                      <div className="mb-8 p-4 rounded-2xl bg-brand-50 border border-brand-200/60">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-600 mb-2">
                          {CORPORATE_GUIDANCE.heading}
                        </h3>
                        <p className="text-sm text-foreground font-medium mb-2 leading-relaxed">
                          {CORPORATE_GUIDANCE.what}
                        </p>
                        <p className="text-sm text-ink-muted mb-3 leading-relaxed">
                          {CORPORATE_GUIDANCE.after}
                        </p>
                        <p className="text-xs text-ink-soft leading-relaxed">
                          {CORPORATE_GUIDANCE.artwork}
                        </p>
                        <p className="text-xs text-ink-soft mt-2 leading-relaxed">
                          {CORPORATE_GUIDANCE.quantities}
                        </p>
                        {corporateChatLink && (
                          <a
                            href={corporateChatLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-brand-600 hover:text-brand-700 underline underline-offset-4"
                          >
                            Questions before ordering? Message us on WhatsApp
                          </a>
                        )}
                      </div>
                    )}

                    {/* How the photo reaches us */}
                    {needsPhoto && (
                      <div className="mb-8 p-4 rounded-2xl bg-brand-50 border border-brand-200/60">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-600 mb-2">
                          {PHOTO_GUIDANCE.heading}
                        </h3>
                        <p className="text-sm text-ink-muted mb-3 leading-relaxed">
                          Order first — we&apos;ll email you straight away with a link to
                          send your picture on WhatsApp, with your order number already
                          filled in. We start making it as soon as your photo arrives.
                        </p>
                        <p className="text-sm text-foreground font-medium mb-2 leading-relaxed">
                          {PHOTO_GUIDANCE.sendAsFile}
                        </p>
                        <p className="text-xs text-ink-soft leading-relaxed">
                          {PHOTO_GUIDANCE.quality} {PHOTO_GUIDANCE.minimum}
                        </p>
                        {photoChatLink && (
                          <a
                            href={photoChatLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-brand-600 hover:text-brand-700 underline underline-offset-4"
                          >
                            Questions? Message us on WhatsApp
                          </a>
                        )}
                      </div>
                    )}

                    {/* Quantity & Add to Cart */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex items-center border border-surface-line rounded">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-2.5 text-ink-muted hover:text-foreground transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center text-sm font-medium">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="p-2.5 text-ink-muted hover:text-foreground transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <Button
                        size="lg"
                        className="flex-1 gap-2"
                        disabled={!canAddToCart}
                        onClick={() => {
                          for (let i = 0; i < quantity; i++) {
                            addItem(product, {
                              variant: selectedVariant,
                              customisation: customText || undefined,
                            });
                          }
                        }}
                      >
                        <ShoppingBag className="w-5 h-5" />
                        {canAddToCart
                          ? `Add to Cart — ${formatPrice(displayPrice * quantity)}`
                          : "Select options"}
                      </Button>
                    </div>
                  </>
                )}

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-surface-line/20">
                  {[
                    { icon: Truck, label: "Free UK Shipping", sub: "Over £50" },
                    { icon: Shield, label: "Quality Guarantee", sub: "Handmade care" },
                    { icon: RotateCcw, label: "Easy Returns", sub: "14-day policy" },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <item.icon className="w-5 h-5 text-brand-600 mx-auto mb-1" />
                      <p className="text-xs font-medium">{item.label}</p>
                      <p className="text-xs text-ink-soft">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="py-16 bg-surface-strip">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold mb-8">
              You Might Also <span className="text-gradient">Like</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
