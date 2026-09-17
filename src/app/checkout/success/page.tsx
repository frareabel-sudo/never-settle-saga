"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { cartStore } from "@/lib/cart-store";

interface OrderSummary {
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  items: Array<{ name: string; options?: string; quantity: number; unitPrice: number; lineTotal: number }>;
  subtotal?: number;
  shipping?: number;
  discountCode?: string;
  discountAmount?: number;
  total: number;
  currency: string;
  shippingAddress?: string;
  shippingName?: string;
}

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}

function OrderConfirmation() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    // Only clear the cart on a confirmed return from Stripe — otherwise an
    // accidental visit to /checkout/success would wipe the shopper's cart.
    if (sessionId) cartStore.clear();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) { setPending(false); return; }
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 6;

    async function poll() {
      try {
        const res = await fetch(`/api/order/${encodeURIComponent(sessionId!)}`);
        if (cancelled) return;
        if (res.status === 202) {
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 1500);
            return;
          }
          setPending(false);
          return;
        }
        if (res.ok) {
          setOrder(await res.json());
          setPending(false);
          return;
        }
        setPending(false);
      } catch {
        if (!cancelled) setPending(false);
      }
    }
    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-brand-500">Order Confirmed</h1>
          <p className="text-ink-muted">A confirmation receipt has been sent to your email by Stripe.</p>
        </div>

        {pending && (
          <div className="bg-surface-alt border border-brand-500/20 rounded-lg p-6 text-center text-ink-muted">
            Processing your order…
          </div>
        )}

        {!pending && order && (
          <div className="bg-surface-alt border border-brand-500/20 rounded-lg p-6 space-y-5 text-sm">
            <div className="flex justify-between items-baseline border-b border-brand-500/10 pb-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-ink-soft">Order Reference</div>
                <div className="font-mono text-brand-500 text-base">{order.orderNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-ink-soft">Total Paid</div>
                <div className="text-brand-500 font-bold text-base">{fmt(order.total, order.currency)}</div>
              </div>
            </div>

            <div className="space-y-2">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between text-ink-muted">
                  <div>
                    <div>{it.name}{it.options ? ` — ${it.options}` : ""}</div>
                    <div className="text-xs text-ink-soft">{it.quantity} × {fmt(it.unitPrice, order.currency)}</div>
                  </div>
                  <div className="text-right">{fmt(it.lineTotal, order.currency)}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-500/10 pt-3 space-y-1 text-ink-muted text-xs">
              {order.subtotal !== undefined && <div className="flex justify-between"><span>Subtotal</span><span>{fmt(order.subtotal, order.currency)}</span></div>}
              {order.shipping !== undefined && <div className="flex justify-between"><span>Shipping</span><span>{fmt(order.shipping, order.currency)}</span></div>}
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-400"><span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span><span>−{fmt(order.discountAmount, order.currency)}</span></div>
              )}
            </div>

            {order.shippingAddress && (
              <div className="border-t border-brand-500/10 pt-3">
                <div className="text-xs uppercase tracking-wider text-ink-soft mb-1">Shipping to</div>
                <div className="text-ink-muted">{order.shippingName}</div>
                <div className="text-ink-muted text-xs whitespace-pre-wrap">{order.shippingAddress}</div>
              </div>
            )}
          </div>
        )}

        {!pending && !order && sessionId && (
          <div className="bg-surface-alt border border-brand-500/20 rounded-lg p-4 text-center">
            <p className="text-sm text-ink-muted">Order reference</p>
            <p className="text-brand-500 font-mono text-xs mt-1 break-all">{sessionId}</p>
            <p className="text-xs text-ink-soft mt-2">Your receipt will arrive by email shortly.</p>
          </div>
        )}

        <div className="text-center">
          <Link href="/shop" className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-surface flex items-center justify-center">
          <p className="text-ink-muted">Loading...</p>
        </main>
      }
    >
      <OrderConfirmation />
    </Suspense>
  );
}
