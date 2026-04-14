import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProductById } from "@/lib/data";

interface CheckoutItemInput {
  productId: string;
  quantity: number;
  variantId?: string;
}

const ALLOWED_CURRENCIES = ["gbp", "usd", "eur"] as const;
type AllowedCurrency = (typeof ALLOWED_CURRENCIES)[number];

const MAX_ITEMS = 50;
const MAX_QTY = 100;
const MIN_QTY = 1;

// Simple RFC-5322-lite email check — boundary validation only.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_BAD_REQUEST = { error: "Invalid request" } as const;

// ---- In-memory IP rate limit: 10 req / 60s ----
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitStore: Map<string, number[]> = new Map();

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitStore.get(ip) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  // Opportunistic cleanup to avoid unbounded growth.
  if (rateLimitStore.size > 10_000) {
    rateLimitStore.forEach((v, k) => {
      const fresh = v.filter((t) => t > windowStart);
      if (fresh.length === 0) rateLimitStore.delete(k);
      else rateLimitStore.set(k, fresh);
    });
  }
  return false;
}

function validateBody(raw: unknown):
  | { ok: true; items: CheckoutItemInput[]; email: string; currency: AllowedCurrency }
  | { ok: false } {
  if (!raw || typeof raw !== "object") return { ok: false };
  const body = raw as Record<string, unknown>;

  const email = body.email;
  if (typeof email !== "string" || email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false };
  }

  const currencyRaw =
    typeof body.currency === "string" ? body.currency.toLowerCase() : "gbp";
  if (!ALLOWED_CURRENCIES.includes(currencyRaw as AllowedCurrency)) {
    return { ok: false };
  }
  const currency = currencyRaw as AllowedCurrency;

  const items = body.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_ITEMS) {
    return { ok: false };
  }

  const clean: CheckoutItemInput[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") return { ok: false };
    const it = item as Record<string, unknown>;
    const productId = it.productId;
    const quantity = it.quantity;
    const variantId = it.variantId;
    if (typeof productId !== "string" || productId.length === 0 || productId.length > 100) {
      return { ok: false };
    }
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < MIN_QTY ||
      quantity > MAX_QTY
    ) {
      return { ok: false };
    }
    if (variantId !== undefined) {
      if (typeof variantId !== "string" || variantId.length === 0 || variantId.length > 100) {
        return { ok: false };
      }
    }
    clean.push({
      productId,
      quantity,
      ...(typeof variantId === "string" ? { variantId } : {}),
    });
  }

  return { ok: true, items: clean, email, currency };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(GENERIC_BAD_REQUEST, { status: 400 });
    }

    const validated = validateBody(raw);
    if (!validated.ok) {
      return NextResponse.json(GENERIC_BAD_REQUEST, { status: 400 });
    }
    const { items, email } = validated;

    // Server-side price lookup — NEVER trust client price/name.
    // Use Stripe price_id directly so currency + amount come from Stripe,
    // killing any possibility of client-side price tampering.
    const lineItems = [];
    for (const item of items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return NextResponse.json(GENERIC_BAD_REQUEST, { status: 400 });
      }
      let priceId = product.stripePriceId;
      if (item.variantId && product.variants) {
        const variant = product.variants.find(
          (v) => v.id === item.variantId && v.active,
        );
        if (!variant) {
          return NextResponse.json(GENERIC_BAD_REQUEST, { status: 400 });
        }
        priceId = variant.stripePriceId;
      }
      lineItems.push({
        price: priceId,
        quantity: item.quantity,
      });
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/shop`,
      customer_email: email,
      metadata: {
        customer_email: email,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
