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
    cartStore.clear();
  }, []);

  useEffect(() => {
    if (!sessionId) { setPending(false); return; }
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 6;

    async function poll() {
      try {
        const res = await fetch(`/api/order/${encodeURIComponent(sessionId!)}`);
        if (cancelled) return;
        if (res.ok) {
          setOrder(await res.json());
          setPending(false);
          return;
        }
        if (res.status === 202 && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1500);
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
    <main className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-amber-500">Order Confirmed</h1>
          <p className="text-gray-300">A confirmation receipt has been sent to your email by Stripe.</p>
        </div>

        {pending && (
          <div className="bg-charcoal-800 border border-amber-500/20 rounded-lg p-6 text-center text-gray-400">
            Processing your order…
          </div>
        )}

        {!pending && order && (
          <div className="bg-charcoal-800 border border-amber-500/20 rounded-lg p-6 space-y-5 text-sm">
            <div className="flex justify-between items-baseline border-b border-amber-500/10 pb-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">Order Reference</div>
                <div className="font-mono text-amber-400 text-base">{order.orderNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-gray-500">Total Paid</div>
                <div className="text-amber-400 font-bold text-base">{fmt(order.total, order.currency)}</div>
              </div>
            </div>

            <div className="space-y-2">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between text-gray-300">
                  <div>
                    <div>{it.name}{it.options ? ` — ${it.options}` : ""}</div>
                    <div className="text-xs text-gray-500">{it.quantity} × {fmt(it.unitPrice, order.currency)}</div>
                  </div>
                  <div className="text-right">{fmt(it.lineTotal, order.currency)}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-amber-500/10 pt-3 space-y-1 text-gray-400 text-xs">
              {order.subtotal !== undefined && <div className="flex justify-between"><span>Subtotal</span><span>{fmt(order.subtotal, order.currency)}</span></div>}
              {order.shipping !== undefined && <div className="flex justify-between"><span>Shipping</span><span>{fmt(order.shipping, order.currency)}</span></div>}
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-400"><span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span><span>−{fmt(order.discountAmount, order.currency)}</span></div>
              )}
            </div>

            {order.shippingAddress && (
              <div className="border-t border-amber-500/10 pt-3">
                <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Shipping to</div>
                <div className="text-gray-300">{order.shippingName}</div>
                <div className="text-gray-400 text-xs whitespace-pre-wrap">{order.shippingAddress}</div>
              </div>
            )}
          </div>
        )}

        {!pending && !order && sessionId && (
          <div className="bg-charcoal-800 border border-amber-500/20 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400">Order reference</p>
            <p className="text-amber-400 font-mono text-xs mt-1 break-all">{sessionId}</p>
            <p className="text-xs text-gray-500 mt-2">Your receipt will arrive by email shortly.</p>
          </div>
        )}

        <div className="text-center">
          <Link href="/shop" className="inline-block bg-amber-500 hover:bg-amber-600 text-charcoal-900 font-semibold py-3 px-8 rounded-lg transition-colors">
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
        <main className="min-h-screen bg-charcoal-900 flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </main>
      }
    >
      <OrderConfirmation />
    </Suspense>
  );
}
