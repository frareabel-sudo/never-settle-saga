"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function OrderConfirmation() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="min-h-screen bg-charcoal-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Checkmark icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-amber-500">Order Confirmed</h1>

        <p className="text-gray-300 text-lg">
          Thank you for your purchase. Your order has been received and is being
          processed.
        </p>

        {sessionId && (
          <div className="bg-charcoal-800 border border-amber-500/20 rounded-lg p-4">
            <p className="text-sm text-gray-400">Order Reference</p>
            <p className="text-amber-400 font-mono text-sm mt-1 break-all">
              {sessionId}
            </p>
          </div>
        )}

        <Link
          href="/shop"
          className="inline-block bg-amber-500 hover:bg-amber-600 text-charcoal-900 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
        >
          Continue Shopping
        </Link>
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
