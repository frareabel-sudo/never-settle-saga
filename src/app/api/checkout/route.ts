import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProductById } from "@/lib/data";
import { findInsufficientStock } from "@/lib/cosmos";
import { getStoreSettings } from "@/lib/store-settings";
import {
  ensureReturningCustomerCoupon,
  hasPreviousOrder,
  isReturningCustomerCode,
  RETURNING_CUSTOMER_CODE,
} from "@/lib/returning-customer";

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

// ---- In-memory IP rate limit: 5 req / 60s ----
// Note: resets on cold start (advisory on Vercel). Stripe's own fraud
// controls are the primary defence; this just throttles obvious abuse
// within a single instance. Client IP is also forwarded into session
// metadata for post-hoc auditing.
const RATE_LIMIT_MAX = 5;
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
  | { ok: true; items: CheckoutItemInput[]; email: string; currency: AllowedCurrency; code: string }
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

  // Optional discount code typed in the cart. Empty = none.
  const codeRaw = body.code ?? "";
  if (typeof codeRaw !== "string" || codeRaw.length > 64) return { ok: false };
  const code = codeRaw.trim();

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

  return { ok: true, items: clean, email, currency, code };
}

// Build Stripe shipping_options from Cosmos settings. Free shipping kicks in
// when cart subtotal (pre-discount) hits `freeShippingThresholdGBP`, but only
// for the rate id named in `freeShippingMethod`; other tiers keep their price
// so the customer can still choose faster delivery. Stripe Checkout cannot
// filter shipping_options by selected country, so each rate's display_name
// is prefixed with its region — combined with the shipping_address custom_text
// disclaimer, this makes the choice unambiguous for the customer.
async function buildShippingOptions(subtotalGBP: number) {
  const { shipping } = await getStoreSettings();
  const threshold = shipping.freeShippingThresholdGBP;
  const qualifiesForFree = threshold > 0 && subtotalGBP >= threshold;
  return shipping.rates
    .filter((r) => r.enabled)
    .map((r) => {
      const isFreeTier = qualifiesForFree && r.id === shipping.freeShippingMethod;
      const amount = isFreeTier ? 0 : Math.round(r.priceGBP * 100);
      const regionTag = `[${r.region}]`;
      const baseName = `${regionTag} ${r.label}`;
      return {
        shipping_rate_data: {
          type: "fixed_amount" as const,
          fixed_amount: { amount, currency: "gbp" },
          display_name: isFreeTier ? `${baseName} — Free` : baseName,
          delivery_estimate: {
            minimum: { unit: "business_day" as const, value: r.etaMinDays },
            maximum: { unit: "business_day" as const, value: r.etaMaxDays },
          },
        },
      };
    });
}

// UK + every EU member state. Customers outside this set are routed to email
// per the contact-first policy in /shipping.
const ALLOWED_SHIPPING_COUNTRIES = [
  "GB",
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
] as const;

const SHIPPING_DISCLAIMER =
  "We ship to the UK and EU only. Please pick the [UK] rate if your address is in the United Kingdom, or an [EU] rate for any EU member state — choosing the wrong region may delay your order. For destinations outside the UK and EU, please email helpdesk@dreamcraftstudio.co.uk BEFORE placing your order so we can quote shipping for your country.";

const SUBMIT_DISCLAIMER =
  "Every DreamCraft Studio piece is made to order. After payment we will email you within 1–2 business days to confirm your specifications and a production timeline.";

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
    const { items, email, code } = validated;

    // Server-side price lookup — NEVER trust client price/name.
    const lineItems: Array<{ price: string; quantity: number }> = [];
    const stockCheckItems: Array<{ stripePriceId: string; quantity: number; productId: string; variantId?: string }> = [];
    let subtotalGBP = 0;
    for (const item of items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return NextResponse.json(GENERIC_BAD_REQUEST, { status: 400 });
      }
      if (product.publishToWebsite === false) {
        return NextResponse.json(
          { error: "Product unavailable", productId: item.productId },
          { status: 409 },
        );
      }
      let priceId = product.stripePriceId;
      let unitPrice = product.price;
      if (item.variantId && product.variants) {
        const variant = product.variants.find((v) => v.id === item.variantId && v.active);
        if (!variant) {
          return NextResponse.json(GENERIC_BAD_REQUEST, { status: 400 });
        }
        if (variant.publishToWebsite === false) {
          return NextResponse.json(
            { error: "Variant unavailable", productId: item.productId, variantId: item.variantId },
            { status: 409 },
          );
        }
        priceId = variant.stripePriceId;
        unitPrice = variant.price;
      }
      // v3.34 — Quantity-break promotions. The operator defines the rule in
      // Command Centre, which materialises it as an extra Stripe price. No
      // arithmetic happens here: we only select the promo price when the
      // quantity qualifies, so Stripe stays the sole owner of unit amounts.
      // Deepest qualifying tier wins (highest minQty at or below the quantity).
      const promo = (product.promotions ?? [])
        .filter((p) => p.variantId === (item.variantId ?? "") && item.quantity >= p.minQty)
        .sort((a, b) => b.minQty - a.minQty)[0];

      // The Stripe line carries the discounted price, but stock stays keyed to
      // the ORIGINAL price id — findInsufficientStock resolves the Cosmos
      // product/variant through it, and a promo price id matches neither.
      const checkoutPriceId = promo ? promo.stripePriceId : priceId;
      if (promo) unitPrice = promo.price;

      lineItems.push({ price: checkoutPriceId, quantity: item.quantity });
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

    // Discount code typed in the cart. Stripe allows either a pre-applied
    // discount OR the promo-code box on its page, never both — so a code from
    // the cart replaces the box, and an empty cart field keeps the box (where
    // seasonal codes like BLACKFRIDAY25 have always been typed). One code per
    // order: the returning-customer code doesn't stack with a sale code.
    const stripe = getStripe();
    let discountParams:
      | { discounts: Array<{ coupon: string } | { promotion_code: string }> }
      | { allow_promotion_codes: true } = { allow_promotion_codes: true };
    let appliedCode = "";
    if (code) {
      if (isReturningCustomerCode(code)) {
        let eligible: boolean;
        try {
          eligible = await hasPreviousOrder(email);
        } catch (e) {
          console.error("[checkout] returning-customer lookup failed:", e);
          return NextResponse.json(
            { error: "We couldn't check that code just now — please try again in a moment." },
            { status: 503 },
          );
        }
        if (!eligible) {
          return NextResponse.json(
            {
              error: `${RETURNING_CUSTOMER_CODE} is for returning customers. Use the same email as your previous order — or remove the code to carry on.`,
              field: "code",
            },
            { status: 400 },
          );
        }
        discountParams = { discounts: [{ coupon: await ensureReturningCustomerCoupon(stripe) }] };
        appliedCode = RETURNING_CUSTOMER_CODE;
      } else {
        // Any other code: look it up as a regular Stripe promotion code, so a
        // customer who types BLACKFRIDAY25 in the cart isn't turned away.
        const found = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
        const promo = found.data[0];
        if (!promo) {
          return NextResponse.json(
            { error: "That code isn't valid. Check the spelling, or remove it to carry on.", field: "code" },
            { status: 400 },
          );
        }
        discountParams = { discounts: [{ promotion_code: promo.id }] };
        appliedCode = promo.code;
      }
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/shop`,
      customer_email: email,
      ...discountParams,
      shipping_address_collection: {
        allowed_countries: [...ALLOWED_SHIPPING_COUNTRIES],
      },
      shipping_options: await buildShippingOptions(subtotalGBP),
      phone_number_collection: { enabled: true },
      custom_text: {
        shipping_address: { message: SHIPPING_DISCLAIMER },
        submit: { message: SUBMIT_DISCLAIMER },
      },
      custom_fields: [
        {
          key: "notes",
          label: { type: "custom", custom: "Order notes (optional)" },
          type: "text",
          optional: true,
          text: { maximum_length: 255 },
        },
      ],
      metadata: {
        customer_email: email,
        client_ip: ip,
        ...(appliedCode ? { promo_code: appliedCode } : {}),
        vercel_id: request.headers.get("x-vercel-id") ?? "local",
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
