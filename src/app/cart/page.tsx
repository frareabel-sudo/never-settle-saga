"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Trash2, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { whatsAppLink } from "@/lib/personalisation";
import { cartStore, cartUnitPrice, cartListPrice, cartGroupQuantity } from "@/lib/cart-store";
import type { Product } from "@/lib/data";

interface ShippingSettings {
  rates: Array<{ id: string; label: string; priceGBP: number; region?: string }>;
  freeShippingThresholdGBP: number;
  freeShippingMethod: string;
}

export default function CartPage() {
  const { items, total, updateLineQuantity, removeLine, lineKey } = useCart();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<ShippingSettings | null>(null);
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  /**
   * Set when the checkout is refused for stock. Keeps what the shop actually
   * has so the customer can be offered a one-tap fix instead of a dead end.
   */
  const [stockIssue, setStockIssue] = useState<{
    productId: string;
    variantId?: string;
    available: number;
    requested: number;
  } | null>(null);
  /** Set when checkout says a line is no longer for sale. */
  const [unavailable, setUnavailable] = useState<{ productId: string; variantId?: string } | null>(null);
  /** What changed when the cart was refreshed against the live shop. */
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  // The cart is a snapshot from when each item was added. Bring it up to date
  // once per visit: current prices, and drop anything no longer for sale.
  useEffect(() => {
    const ids = Array.from(new Set(cartStore.getItems().map((i) => i.product.id)));
    if (ids.length === 0) return;
    fetch("/api/cart/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { products?: Product[] } | null) => {
        if (!d?.products) return;
        const { removed, repriced } = cartStore.refresh(d.products);
        const parts: string[] = [];
        if (removed.length) parts.push(`${removed.join(", ")} ${removed.length === 1 ? "is" : "are"} no longer available and ${removed.length === 1 ? "was" : "were"} removed from your cart.`);
        if (repriced.length) parts.push(`The price of ${repriced.join(", ")} has changed; your cart shows the current price.`);
        if (parts.length) setCartNotice(parts.join(" "));
      })
      .catch(() => { /* non-blocking; checkout re-checks everything */ });
  }, []);

  useEffect(() => {
    fetch("/api/settings/shipping")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ShippingSettings | null) => d && setShipping(d))
      .catch(() => { /* non-blocking; checkout still works */ });

    fetch("/api/settings/contact")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.contact?.social?.whatsapp && setWhatsAppNumber(d.contact.social.whatsapp))
      .catch(() => { /* the bulk link just won't show */ });
  }, []);

  async function handleCheckout() {
    setError(null);
    setCodeError(null);
    setStockIssue(null);
    setUnavailable(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (items.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          currency: "gbp",
          ...(code.trim() ? { code: code.trim() } : {}),
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            ...(i.variant ? { variantId: i.variant.id } : {}),
            ...(i.customisation ? { customisation: i.customisation } : {}),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        // 409 with counts means we know exactly what went wrong and can say so.
        // "Insufficient stock" on its own leaves the customer stuck.
        if (res.status === 409 && typeof data.available === "number") {
          setStockIssue({
            productId: data.productId,
            variantId: data.variantId,
            available: data.available,
            requested: data.requested,
          });
        } else if (res.status === 409 && data.error === "Product unavailable") {
          setUnavailable({ productId: data.productId, variantId: data.variantId });
        } else if (data.field === "code") {
          setCodeError(data.error);
        } else {
          setError(data.error || "Unable to start checkout.");
        }
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center px-4 pt-24">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-brand-500" />
          </div>
          <h1 className="text-3xl font-bold text-ink">Your cart is empty</h1>
          <p className="text-ink-muted">Browse the shop to add something you love.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 rounded-full bg-brand-500 text-white font-semibold hover:bg-brand-400 transition"
          >
            Go to shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface px-4 pt-28 pb-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-ink mb-8">Your cart</h1>
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <ul className="space-y-4">
            {items.map((item) => {
              const key = lineKey(item);
              const unit = cartUnitPrice(item);
              const listUnit = cartListPrice(item);
              // Next quantity-break tier for this line. Shown once the shopper
              // is at least halfway there — e.g. 9 cost more than 10 (£179.91
              // vs £139.90) and nothing said so.
              const groupQty = cartGroupQuantity(item);
              const nextTier = (item.product.promotions ?? [])
                .filter((p) => p.variantId === (item.variant?.id ?? "") && p.minQty > groupQty && p.price < unit)
                .sort((a, b) => a.minQty - b.minQty)[0];
              const showNextTier = nextTier && groupQty * 2 >= nextTier.minQty;
              const variantLabel = item.variant
                ? Object.entries(item.variant.optionValues)
                    .map(([, v]) => v)
                    .join(" · ")
                : null;
              return (
                <li
                  key={key}
                  className="flex gap-4 p-4 rounded-xl bg-surface-alt border border-surface-line"
                >
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-surface-alt shrink-0">
                    {item.product.images[0] && (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <h3 className="text-ink font-semibold truncate">
                        {item.product.name}
                      </h3>
                      <button
                        onClick={() => removeLine(key)}
                        className="text-ink-soft hover:text-red-400 transition"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {variantLabel && (
                      <p className="text-xs text-brand-600 mt-1 truncate">
                        {variantLabel}
                      </p>
                    )}
                    {item.customisation && (
                      <p className="text-xs text-ink-soft mt-1 truncate">
                        {item.customisation}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateLineQuantity(key, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-surface-alt text-ink-muted hover:bg-surface-strip flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-ink text-sm w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateLineQuantity(key, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-surface-alt text-ink-muted hover:bg-surface-strip flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-brand-500 font-semibold text-right">
                        {unit < listUnit && (
                          <span className="block text-xs font-normal text-ink-soft line-through">
                            £{(listUnit * item.quantity).toFixed(2)}
                          </span>
                        )}
                        £{(unit * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    {showNextTier && nextTier && (
                      <p className="mt-2 text-xs text-brand-600">
                        Add {nextTier.minQty - groupQty} more to pay £{nextTier.price.toFixed(2)} each
                        {" "}(£{(nextTier.price * nextTier.minQty).toFixed(2)} for {nextTier.minQty}).{" "}
                        <button
                          onClick={() => updateLineQuantity(key, item.quantity + (nextTier.minQty - groupQty))}
                          className="font-medium underline underline-offset-2 hover:text-brand-700"
                        >
                          Make it {nextTier.minQty}
                        </button>
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="p-6 rounded-xl bg-surface-alt border border-surface-line h-fit space-y-5">
            <h2 className="text-xl font-semibold text-ink">Summary</h2>
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span>£{total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-ink-soft">
              Shipping and taxes calculated at checkout.
            </p>
            {shipping && shipping.freeShippingThresholdGBP > 0 && (() => {
              const threshold = shipping.freeShippingThresholdGBP;
              const qualifies = total >= threshold;
              // Only one rate becomes free (UK Tracked 48 today) — say which,
              // so an EU customer isn't told shipping is free when it isn't.
              const freeRate = shipping.rates.find((r) => r.id === shipping.freeShippingMethod);
              const freeWhat = freeRate
                ? `free ${freeRate.region === "EU" ? "EU" : "UK"} shipping (${freeRate.label})`
                : "free shipping";
              const away = Math.max(0, threshold - total);
              const pct = Math.min(100, Math.round((total / threshold) * 100));
              return (
                <div className={`rounded-lg border p-3 text-xs ${qualifies ? "border-brand-500/60 bg-brand-500/10" : "border-surface-line bg-surface"}`}>
                  <div className="flex items-center gap-2 text-ink">
                    <Truck className="w-3.5 h-3.5 text-brand-500" />
                    {qualifies
                      ? <span className="text-brand-600 font-medium">You&apos;ve unlocked {freeWhat} 🎉</span>
                      : <span>Add <strong className="text-brand-500">£{away.toFixed(2)}</strong> more for {freeWhat} over £{threshold.toFixed(2)}</span>}
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-surface-alt overflow-hidden">
                    <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}
            <div>
              <label className="block text-sm text-ink-muted mb-2">
                Email for order updates
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-line text-ink placeholder-ink-soft focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label htmlFor="discount-code" className="block text-sm text-ink-muted mb-2">
                Discount code <span className="text-ink-soft">(optional)</span>
              </label>
              <input
                id="discount-code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setCodeError(null);
                }}
                placeholder="Enter code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={64}
                className={`w-full px-3 py-2 rounded-lg bg-surface border text-ink placeholder-ink-soft uppercase focus:outline-none focus:border-brand-500 ${codeError ? "border-red-400" : "border-surface-line"}`}
              />
              {codeError && <p className="mt-2 text-sm text-red-400">{codeError}</p>}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}

            {cartNotice && (
              <p className="rounded-lg border border-brand-500/40 bg-brand-500/5 p-3 text-sm text-ink">
                {cartNotice}
              </p>
            )}

            {/* A line that's no longer for sale: name it and remove it in one
                tap, instead of a dead-end "Invalid request". */}
            {unavailable && (() => {
              const line = items.find(
                (i) => i.product.id === unavailable.productId && (i.variant?.id ?? undefined) === (unavailable.variantId ?? undefined),
              ) ?? items.find((i) => i.product.id === unavailable.productId);
              const name = line?.product.name ?? "One of your items";
              return (
                <div className="rounded-lg border border-brand-500/50 bg-brand-500/5 p-3 space-y-2">
                  <p className="text-sm text-foreground">
                    <strong>{name}</strong> is no longer available.
                  </p>
                  {line && (
                    <button
                      onClick={() => {
                        removeLine(lineKey(line));
                        setUnavailable(null);
                      }}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700 underline underline-offset-4"
                    >
                      Remove it and carry on
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Stock shortage — say the number, fix it in one tap, and offer the
                bulk route. A bare "Insufficient stock" sends a wholesale
                customer away without ever talking to us. */}
            {stockIssue && (() => {
              const line =
                items.find(
                  (i) => i.product.id === stockIssue.productId && (i.variant?.id ?? undefined) === (stockIssue.variantId ?? undefined),
                ) ?? items.find((i) => i.product.id === stockIssue.productId);
              const name = line?.product.name ?? "One of your items";
              const bulkLink = whatsAppLink(
                whatsAppNumber,
                `Hi! I'd like to order ${stockIssue.requested} × ${name} — is that possible?`,
              );
              return (
                <div className="rounded-lg border border-brand-500/50 bg-brand-500/5 p-3 space-y-2">
                  <p className="text-sm text-foreground">
                    <strong>{name}</strong> — we have{" "}
                    <strong className="text-brand-600">{stockIssue.available}</strong>{" "}
                    right now, and you asked for {stockIssue.requested}.
                  </p>
                  {line && stockIssue.available > 0 && (
                    <button
                      onClick={() => {
                        updateLineQuantity(lineKey(line), stockIssue.available);
                        setStockIssue(null);
                      }}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700 underline underline-offset-4"
                    >
                      Change my order to {stockIssue.available} and carry on
                    </button>
                  )}
                  {bulkLink && (
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Need all {stockIssue.requested}?{" "}
                      <a
                        href={bulkLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 underline underline-offset-4"
                      >
                        Message us on WhatsApp
                      </a>{" "}
                      — we make to order and handle larger and wholesale
                      quantities all the time.
                    </p>
                  )}
                </div>
              );
            })()}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 rounded-full bg-brand-500 text-white font-semibold hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Redirecting…" : `Checkout · £${total.toFixed(2)}`}
            </button>
            <Link
              href="/shop"
              className="block text-center text-sm text-ink-muted hover:text-brand-500"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
