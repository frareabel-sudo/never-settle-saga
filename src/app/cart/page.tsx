"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const { items, total, updateLineQuantity, removeLine, lineKey } = useCart();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setError(null);
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
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            ...(i.variant ? { variantId: i.variant.id } : {}),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Unable to start checkout.");
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
      <main className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4 pt-24">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Your cart is empty</h1>
          <p className="text-gray-400">Browse the shop to add something you love.</p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 rounded-full bg-amber-500 text-charcoal-900 font-semibold hover:bg-amber-400 transition"
          >
            Go to shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-charcoal-900 px-4 pt-28 pb-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Your cart</h1>
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <ul className="space-y-4">
            {items.map((item) => {
              const key = lineKey(item);
              const unit = item.variant?.price ?? item.product.price;
              const variantLabel = item.variant
                ? Object.entries(item.variant.optionValues)
                    .map(([, v]) => v)
                    .join(" · ")
                : null;
              return (
                <li
                  key={key}
                  className="flex gap-4 p-4 rounded-xl bg-charcoal-800 border border-charcoal-700"
                >
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-charcoal-700 shrink-0">
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
                      <h3 className="text-white font-semibold truncate">
                        {item.product.name}
                      </h3>
                      <button
                        onClick={() => removeLine(key)}
                        className="text-gray-500 hover:text-red-400 transition"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {variantLabel && (
                      <p className="text-xs text-amber-400/80 mt-1 truncate">
                        {variantLabel}
                      </p>
                    )}
                    {item.customisation && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {item.customisation}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateLineQuantity(key, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-charcoal-700 text-gray-300 hover:bg-charcoal-600 flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-white text-sm w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateLineQuantity(key, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-charcoal-700 text-gray-300 hover:bg-charcoal-600 flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-amber-400 font-semibold">
                        £{(unit * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="p-6 rounded-xl bg-charcoal-800 border border-charcoal-700 h-fit space-y-5">
            <h2 className="text-xl font-semibold text-white">Summary</h2>
            <div className="flex justify-between text-gray-300">
              <span>Subtotal</span>
              <span>£{total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500">
              Shipping and taxes calculated at checkout.
            </p>
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Email for order updates
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-900 border border-charcoal-700 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 rounded-full bg-amber-500 text-charcoal-900 font-semibold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Redirecting…" : `Checkout · £${total.toFixed(2)}`}
            </button>
            <Link
              href="/shop"
              className="block text-center text-sm text-gray-400 hover:text-amber-400"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
