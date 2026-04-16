import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProductById } from "@/lib/data";
import { findInsufficientStock } from "@/lib/cosmos";
import { getStoreSettings } from "@/lib/store-settings";

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

// Build Stripe shipping_options from Cosmos settings. Free shipping kicks in
// when cart subtotal (pre-discount) hits `freeShippingThresholdGBP`, but only
// for the rate id named in `freeShippingMethod`; other tiers keep their price
// so the customer can still choose faster delivery.
async function buildShippingOptions(subtotalGBP: number) {
  const { shipping } = await getStoreSettings();
  const threshold = shipping.freeShippingThresholdGBP;
  const qualifiesForFree = threshold > 0 && subtotalGBP >= threshold;
  return shipping.rates
    .filter((r) => r.enabled)
    .map((r) => {
      const isFreeTier = qualifiesForFree && r.id === shipping.freeShippingMethod;
      const amount = isFreeTier ? 0 : Math.round(r.priceGBP * 100);
      return {
        shipping_rate_data: {
          type: "fixed_amount" as const,
          fixed_amount: { amount, currency: "gbp" },
          display_name: isFreeTier ? `${r.label} — Free` : r.label,
          delivery_estimate: {
            minimum: { unit: "business_day" as const, value: r.etaMinDays },
            maximum: { unit: "business_day" as const, value: r.etaMaxDays },
          },
        },
      };
    });
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
    const lineItems: Array<{ price: string; quantity: number }> = [];
    const stockCheckItems: Array<{ stripePriceId: string; quantity: number; productId: string; variantId?: string }> = [];
    let subtotalGBP = 0;
    for (const item of items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return NextResponse.json(GENERIC_BAD_REQUEST, { status: 400 });
      }
      let priceId = product.stripePriceId;
      let unitPrice = product.price;
      if (item.variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === item.variantId && v.active);
        if (!variant) {
          return NextResponse.json(GENERIC_BAD_REQUEST, { status: 400 });
        }
        priceId = variant.stripePriceId;
        unitPrice = variant.price;
      }
      lineItems.push({ price: priceId, quantity: item.quantity });
      stockCheckItems.push({ stripePriceId: priceId, quantity: item.quantity, productId: item.productId, variantId: item.variantId });
      subtotalGBP += unitPrice * item.quantity;
    }

    // Pre-checkout stock guard — prevent oversells. Cosmos is source of truth.
    try {
      const short = await findInsufficientStock(stockCheckItems);
      if (short) {
        return NextResponse.json(
          { error: "Insufficient stock", productId: short.productId, available: short.available, requested: short.requested },
          { status: 409 },
        );
      }
    } catch (e) {
      // If the stock service is degraded, fail closed — better than overselling.
      console.error("[checkout] stock check failed:", e);
      return NextResponse.json({ error: "Inventory check unavailable, please retry shortly" }, { status: 503 });
    }

    const session = await getStripe().checkout.sessions.create({
      automatic_payment_methods: { enabled: true },
      line_items: lineItems,
      mode: "payment",
      success_url: `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/shop`,
      customer_email: email,
      allow_promotion_codes: true,
      shipping_address_collection: {
        allowed_countries: ["GB", "IE", "US", "CA", "AU", "NZ", "DE", "FR", "IT", "ES", "NL", "BE", "PT", "SE", "NO", "DK", "FI", "CH", "AT", "PL"],
      },
      shipping_options: await buildShippingOptions(subtotalGBP),
      phone_number_collection: { enabled: true },
      custom_fields: [
        {
          key: "notes",
          label: { type: "custom", custom: "Order notes (optional)" },
          type: "text",
          optional: true,
          text: { maximum_length: 255 },
        },
      ],
      // Stripe substitutes {CHECKOUT_SESSION_ID} server-side, giving the
      // PaymentIntent a stable backref to its parent session for the
      // payment_intent.succeeded handler.
      payment_intent_data: {
        metadata: { checkout_session_id: "{CHECKOUT_SESSION_ID}" },
      },
      metadata: { customer_email: email },
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
