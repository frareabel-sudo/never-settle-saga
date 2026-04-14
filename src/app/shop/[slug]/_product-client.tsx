"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  ShoppingBag,
  Truck,
  Shield,
  RotateCcw,
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

export default function ProductClient({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {

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

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-charcoal-600 border-b border-charcoal-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/shop" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Shop
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-400">{product.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product */}
      <section className="py-12 bg-charcoal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Gallery */}
            <FadeIn direction="left">
              <div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-charcoal-400 border border-charcoal-50/30 mb-4">
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.name}
                    fill
                    className={`object-cover ${isComingSoon ? "opacity-80" : ""}`}
                    priority
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {isComingSoon ? (
                      <Badge variant="amber">Coming Soon</Badge>
                    ) : (
                      <>
                        <Badge variant="default">Available</Badge>
                        {product.badge && <Badge variant="amber">{product.badge}</Badge>}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === i
                          ? "border-amber-500 shadow-lg shadow-amber-500/20"
                          : "border-charcoal-50/30 hover:border-amber-500/50"
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Details */}
            <FadeIn direction="right">
              <div>
                <p className="text-amber-500/70 text-sm uppercase tracking-wider mb-2">
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
                              ? "fill-amber-500 text-amber-500"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">
                      {product.rating} ({product.reviews} reviews)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-6">
                  <span className={`font-display text-3xl font-bold ${isComingSoon ? "text-amber-400/60" : "text-amber-400"}`}>
                    {formatPrice(displayPrice)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                <p className="text-gray-300 leading-relaxed mb-8">
                  {product.longDescription}
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2 mb-8">
                  {product.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-400"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {f}
                    </div>
                  ))}
                </div>

                {/* Coming Soon — Notify Me */}
                {isComingSoon ? (
                  <div className="mb-8 p-6 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Bell className="w-5 h-5 text-amber-400" />
                      <h3 className="font-semibold text-amber-300">
                        This product is coming soon
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Be the first to know when this launches. Enter your email and we&apos;ll notify you.
                    </p>
                    {notifySubmitted ? (
                      <div className="flex items-center gap-2 text-sm text-amber-400">
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
                              <h3 className="font-semibold text-sm uppercase tracking-wider text-amber-400/80">
                                {opt.name}
                              </h3>
                              {selectedOptions[opt.name] && (
                                <span className="text-sm text-gray-400">
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
                                        ? "bg-amber-500 text-charcoal-900 border-amber-500"
                                        : available
                                        ? "bg-charcoal-400/30 text-gray-200 border-charcoal-50/20 hover:border-amber-400/60"
                                        : "bg-charcoal-400/10 text-gray-600 border-charcoal-50/10 line-through cursor-not-allowed"
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
                      <div className="mb-8 p-4 rounded-lg bg-charcoal-400/30 border border-charcoal-50/20">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-amber-400/80 mb-3">
                          Personalisation Options
                        </h3>
                        <div className="space-y-3">
                          {product.customOptions.map((opt) => (
                            <div key={opt} className="flex items-center gap-2 text-sm text-gray-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
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

                    {/* Quantity & Add to Cart */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex items-center border border-charcoal-50 rounded">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-2.5 text-gray-400 hover:text-foreground transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center text-sm font-medium">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="p-2.5 text-gray-400 hover:text-foreground transition-colors"
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
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-charcoal-50/20">
                  {[
                    { icon: Truck, label: "Free UK Shipping", sub: "Over £50" },
                    { icon: Shield, label: "Quality Guarantee", sub: "Handmade care" },
                    { icon: RotateCcw, label: "Easy Returns", sub: "14-day policy" },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <item.icon className="w-5 h-5 text-amber-500/70 mx-auto mb-1" />
                      <p className="text-xs font-medium">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.sub}</p>
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
        <section className="py-16 bg-charcoal-600">
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
