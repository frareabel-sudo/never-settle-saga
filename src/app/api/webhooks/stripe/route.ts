import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getStripe, assertWebhookSecret } from "@/lib/stripe";
import { getContainer, generateOrderNumber, deterministicOrderId } from "@/lib/cosmos";
import { updateVariantStock, updateProductStock } from "@/lib/stock";
import { sendEmail } from "@/lib/email/resend";
import { getStoreSettings } from "@/lib/store-settings";
import { renderOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { renderRefundConfirmationEmail } from "@/lib/email/templates/refund-confirmation";
import { customerIdForEmail } from "@/lib/returning-customer";
import Stripe from "stripe";

// Boot-time guard — fails the function cold-start if the secret is unset,
// so the deploy errors loudly instead of silently 500ing every webhook.
assertWebhookSecret();

type CustomerOrderInput = {
  email: string;
  name: string;
  phone: string;
  shippingAddress: string;
  currency: string;
  orderTotal: number;
  orderAt: string;
};

// Add one order to the customer's aggregates. Called ONLY by the webhook
// delivery that won the order insert, so a duplicate or concurrent delivery
// (checkout.session.completed + payment_intent.succeeded arrive together) can
// never count the same order twice. Replaces use the etag so two different
// orders from the same customer landing at once don't overwrite each other.
async function recordCustomerOrder(customerId: string, c: CustomerOrderInput, rid: string) {
  const customers = await getContainer("customers");
  for (let attempt = 0; attempt < 5; attempt++) {
    let existing: (Record<string, unknown> & { _etag?: string }) | null = null;
    try {
      const { resource } = await customers.item(customerId, "customer").read();
      existing = (resource as Record<string, unknown> & { _etag?: string }) || null;
    } catch (err) {
      if ((err as { code?: number }).code !== 404) throw err;
    }

    if (existing) {
      existing.totalOrders = ((existing.totalOrders as number) || 0) + 1;
      existing.totalSpent = ((existing.totalSpent as number) || 0) + c.orderTotal;
      existing.lastOrderAt = c.orderAt;
      existing.updatedAt = new Date().toISOString();
      try {
        await customers.item(customerId, "customer").replace(existing, {
          accessCondition: { type: "IfMatch", condition: existing._etag || "" },
        });
        return;
      } catch (err) {
        if ((err as { code?: number }).code === 412) continue; // changed under us — re-read
        throw err;
      }
    }

    try {
      await customers.items.create({
        id: customerId,
        partitionKey: "customer",
        email: c.email.toLowerCase(),
        name: c.name,
        phone: c.phone,
        shippingAddress: c.shippingAddress,
        tags: ["webhook"],
        notes: "",
        totalOrders: 1,
        totalSpent: c.orderTotal,
        currency: c.currency,
        firstOrderAt: c.orderAt,
        lastOrderAt: c.orderAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    } catch (err) {
      if ((err as { code?: number }).code === 409) continue; // created meanwhile — increment it
      throw err;
    }
  }
  console.error(`[${rid}] customer ${customerId} aggregate update gave up after retries`);
}

// Persist an order to Cosmos and deduct stock atomically-ish.
// Idempotent on stripeSessionId — re-delivery of the webhook is a no-op.
async function persistOrderFromSession(sessionId: string, rid = "-") {
  const stripe = getStripe();

  // Re-fetch with expansions so we always have line_items + shipping.
  // Note: `shipping_details` and `customer_details` are returned by default
  // on the session in API version 2026-03-25.dahlia and can no longer be
  // passed to expand — Stripe 400s if they appear here.
  // Fall back to minimal expand if Stripe rejects any path (API upgrades
  // have silently removed expandable fields in the past — see 686248f).
  // We only require line_items for the order write; the rest is enrichment.
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [
        "line_items.data.price.product",
        "payment_intent.payment_method",
        "total_details.breakdown.discounts.discount.coupon",
        "shipping_cost.shipping_rate",
      ],
    });
  } catch (err) {
    const type = (err as { type?: string }).type || "";
    if (type !== "StripeInvalidRequestError") throw err;
    console.warn(
      `[${rid}] retrieve with full expand rejected — falling back to line_items only. msg=${(err as Error).message}`,
    );
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });
  }

  // "no_payment_required" = a £0 order (100% code + free shipping). It is a
  // real order to make and ship, so it is persisted like a paid one.
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    console.log(`[webhook] skipping persist — session ${sessionId} not paid`);
    return;
  }
  const isFreeOrder = session.payment_status === "no_payment_required";

  const ordersContainer = await getContainer("orders");
  const orderId = deterministicOrderId(sessionId);

  // True idempotency: try a point-read on the deterministic id. If it exists,
  // a previous webhook delivery already persisted this order. No race window.
  try {
    const { resource } = await ordersContainer.item(orderId, "order").read();
    if (resource) {
      console.log(`[webhook] order already persisted for session ${sessionId}`);
      return;
    }
  } catch (err) {
    // 404 expected on first delivery; rethrow anything else.
    const code = (err as { code?: number }).code;
    if (code !== 404) throw err;
  }

  const email = session.customer_details?.email || session.customer_email || "";
  const name = session.customer_details?.name || "";
  const shipDetails = (session as unknown as { shipping_details?: { name?: string | null; address?: Record<string, string | null> | null } }).shipping_details;
  const addr = shipDetails?.address || session.customer_details?.address || null;
  const formattedAddress = addr
    ? [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean).join(", ")
    : "";
  const phone = session.customer_details?.phone || "";
  const recipientName = shipDetails?.name || name;

  // Deterministic id (sha1 of lowercased email). The aggregates are updated
  // after the order insert succeeds — see recordCustomerOrder.
  const customerId: string | undefined = email ? customerIdForEmail(email) : undefined;

  const lineItems = session.line_items?.data || [];

  const items = lineItems.map((li) => {
    const price = li.price as Stripe.Price | null;
    const product = price && typeof price.product !== "string" ? price.product as Stripe.Product : null;
    const qty = li.quantity || 1;
    const lineTotal = (li.amount_total || 0) / 100;
    // Variant/options: prefer price.nickname, then product metadata "options", then product.name suffix
    const options =
      price?.nickname ||
      (product?.metadata?.options as string | undefined) ||
      (product?.metadata?.variant as string | undefined) ||
      "";
    return {
      name: product?.name || li.description || "Item",
      options,
      quantity: qty,
      unitPrice: lineTotal / qty,
      lineTotal,
      // Before discount — the email lists this, then the discount line, so the
      // maths adds up. (lineTotal stays after-discount for CC's reports.)
      lineSubtotal: (li.amount_subtotal || 0) / 100,
      stripePriceId: price?.id,
      stripeProductId: typeof price?.product === "string" ? price?.product : product?.id,
    };
  });

  // Payment details
  const pi = session.payment_intent as Stripe.PaymentIntent | string | null;
  const piId = typeof pi === "string" ? pi : pi?.id;
  const pm = (typeof pi === "object" && pi && typeof pi.payment_method !== "string")
    ? (pi.payment_method as Stripe.PaymentMethod | null)
    : null;
  const paymentMethod = pm?.type || session.payment_method_types?.[0] || "";
  const paymentBrand = pm?.card?.brand || "";
  const paymentLast4 = pm?.card?.last4 || "";

  // Discount
  const discountBreakdown = session.total_details?.breakdown?.discounts?.[0];
  const discountAmount = (session.total_details?.amount_discount || 0) / 100;
  const coupon = (discountBreakdown?.discount as unknown as { coupon?: { id?: string; name?: string } } | undefined)?.coupon;
  const discountCode =
    coupon?.name ||
    coupon?.id ||
    (session.metadata?.promo_code as string | undefined) ||
    "";

  // Customer notes via checkout custom_fields
  const customFields = (session as unknown as { custom_fields?: Array<{ key: string; text?: { value?: string | null } | null; label?: { custom?: string | null } | null }> }).custom_fields || [];
  const notesField = customFields.find((f) => /note|instruction|comment/i.test(f.key) || /note|instruction|comment/i.test(f.label?.custom || ""));
  const customerNotes = notesField?.text?.value || "";

  const orderNumber = await generateOrderNumber();

  // Shipping method display name (for email + UI). Falls back to the amount
  // tier if the rate object isn't expanded or present.
  const shippingCost = (session as unknown as {
    shipping_cost?: { shipping_rate?: { display_name?: string } | string | null } | null;
  }).shipping_cost;
  const shippingRate = shippingCost && typeof shippingCost.shipping_rate === "object"
    ? shippingCost.shipping_rate
    : null;
  const shippingAmount = (session.total_details?.amount_shipping || 0) / 100;
  const shippingMethod =
    shippingRate?.display_name ||
    (shippingAmount >= 6 ? "Royal Mail Tracked 24" : "Royal Mail Tracked 48");

  try {
    await ordersContainer.items.create({
      id: orderId,
      partitionKey: "order",
      stripeSessionId: session.id,
    orderNumber,
    customerEmail: email,
    customerId,
    customerName: name,
    items,
    subtotal: (session.amount_subtotal || 0) / 100,
    shipping: (session.total_details?.amount_shipping || 0) / 100,
    total: (session.amount_total || 0) / 100,
    currency: session.currency || "gbp",
    shippingMethod,
    status: "confirmed",
    paymentStatus: "paid",
    ...(isFreeOrder ? { freeOrder: true } : {}),
    stripePaymentIntentId: piId,
    paymentMethod,
    paymentBrand,
    paymentLast4,
    discountCode,
    discountAmount,
    customerNotes,
    shippingAddress: formattedAddress,
    shippingName: recipientName,
    shippingPhone: phone,
    shippingAddressParts: addr ? {
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postal_code || "",
      country: addr.country || "",
    } : undefined,
      notes: `Created by webhook from Stripe session ${session.id}`,
      createdAt: new Date(session.created * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    // 409 Conflict on the deterministic id means a concurrent webhook
    // delivery beat us to the insert — treat as success.
    const code = (err as { code?: number }).code;
    if (code !== 409) throw err;
    console.log(`[webhook] concurrent delivery raced — order ${orderId} already created`);
    return;
  }

  // Only the delivery that created the order gets here. Non-fatal: the order is
  // safe, and a failure here must not make Stripe retry (the retry would see
  // the order and skip, so throwing would gain nothing).
  if (customerId) {
    try {
      await recordCustomerOrder(customerId, {
        email,
        name,
        phone,
        shippingAddress: formattedAddress,
        currency: session.currency || "gbp",
        orderTotal: (session.amount_total || 0) / 100,
        orderAt: new Date(session.created * 1000).toISOString(),
      }, rid);
    } catch (err) {
      console.error(`[${rid}] customer aggregate update failed for order ${orderNumber}:`, err);
    }
  }

  // Deduct stock per line_item. Non-fatal: stock errors are logged inside
  // deductStockForLineItems; the order is already safely persisted.
  // `stockDeducted` counts lines that matched a Cosmos product AND deducted
  // without throwing. If all lines succeeded, mark the order so the CC
  // Orders page "Mark Complete" step doesn't re-deduct.
  const deductedCount = await deductStockForLineItems(lineItems);
  if (deductedCount === lineItems.length) {
    try {
      const { resource: persisted } = await ordersContainer.item(orderId, "order").read();
      if (persisted) {
        persisted.stockDeducted = true;
        persisted.updatedAt = new Date().toISOString();
        await ordersContainer.item(orderId, "order").replace(persisted);
      }
    } catch (err) {
      console.error(`[${rid}] failed to flag stockDeducted on order ${orderId}:`, err);
    }
  } else {
    console.warn(
      `[${rid}] partial stock deduction (${deductedCount}/${lineItems.length}) — order ${orderNumber} left unflagged; CC can still finish deduction on delivery`,
    );
  }

  console.log(`[${rid}] persisted order ${orderNumber} for session ${sessionId}`);

  // Fire-and-forget confirmation email. Any failure is logged against rid;
  // order is already persisted so we must never throw here.
  if (email) {
    try {
      // Personalised lines ask the customer for a photo over WhatsApp. The
      // number lives in store settings so it can change without a deploy; a
      // lookup failure must never cost us the confirmation email.
      let waNumberForEmail = "";
      try {
        waNumberForEmail = (await getStoreSettings()).contact?.social?.whatsapp || "";
      } catch (err) {
        console.error(`[${rid}] store settings lookup for WhatsApp number failed:`, err);
      }

      const { subject, html } = renderOrderConfirmationEmail({
        customerName: name,
        orderNumber,
        createdAt: new Date(session.created * 1000).toISOString(),
        items: items.map((it) => ({
          name: it.name,
          options: it.options || undefined,
          quantity: it.quantity,
          unitPrice: it.lineSubtotal / (it.quantity || 1),
          lineTotal: it.lineSubtotal,
        })),
        subtotal: (session.amount_subtotal || 0) / 100,
        shipping: shippingAmount,
        shippingMethod,
        discountCode: discountCode || undefined,
        discountAmount: discountAmount || undefined,
        total: (session.amount_total || 0) / 100,
        shippingAddress: formattedAddress,
        shippingName: recipientName,
        whatsAppNumber: waNumberForEmail,
      });
      await sendEmail(rid, { to: email, subject, html });
    } catch (err) {
      console.error(`[${rid}] order confirmation email failed:`, err);
    }
  }
}

async function deductStockForLineItems(lineItems: Stripe.LineItem[]): Promise<number> {
  if (lineItems.length === 0) return 0;
  const productsContainer = await getContainer("products");
  const movementsContainer = await getContainer("stock-movements");
  let deducted = 0;

  for (const li of lineItems) {
    try {
      const price = li.price as Stripe.Price | null;
      if (!price) continue;

      const stripeProductId = typeof price.product === "string" ? price.product : price.product?.id;
      const stripePriceId = price.id;
      const qty = li.quantity || 1;

      // Look the Cosmos product up by stripePriceId / stripeProductId so we
      // can resolve productId + variantId before handing off to the canonical
      // writer. We pull the whole doc just to get name/barcode for the audit
      // movement — the writer re-reads with ETag on the actual mutation.
      const { resources: matches } = await productsContainer.items
        .query({
          query: `SELECT * FROM c WHERE c.partitionKey = 'product' AND (
                    c.stripePriceId = @priceId
                    OR c.stripeProductId = @productId
                    OR EXISTS(SELECT VALUE v FROM v IN c.variants WHERE v.stripePriceId = @priceId)
                  )`,
          parameters: [
            { name: "@priceId", value: stripePriceId },
            { name: "@productId", value: stripeProductId || "" },
          ],
        })
        .fetchAll();

      if (matches.length === 0) {
        console.warn(`[webhook] no Cosmos product found for price ${stripePriceId} — stock not deducted`);
        continue;
      }

      const product = matches[0];
      // v3.34 — A promotion price is a separate Stripe price on the same product,
      // so it never matches a variant's stripePriceId. Fall back to the variant id
      // carried in the promo price metadata; without this a discounted variant sale
      // would deduct from the product aggregate instead of the variant's own stock.
      const promoVariantId = price.metadata?.promoVariantId || "";
      const variant = Array.isArray(product.variants)
        ? product.variants.find(
            (v: { stripePriceId?: string; id?: string }) =>
              v.stripePriceId === stripePriceId ||
              (promoVariantId !== "" && v.id === promoVariantId),
          )
        : null;

      let writeOk = false;
      let deductedFrom = "product";
      if (variant?.id) {
        const res = await updateVariantStock(product.id, variant.id, -qty);
        writeOk = res.ok;
        deductedFrom = `variant ${variant.id}`;
        if (!res.ok) console.error(`[webhook] variant stock write failed: ${res.error}`);
      } else {
        const res = await updateProductStock(product.id, -qty);
        writeOk = res.ok;
        deductedFrom = "product";
        if (!res.ok) console.error(`[webhook] product stock write failed: ${res.error}`);
      }

      if (!writeOk) continue;

      await movementsContainer.items.create({
        id: crypto.randomUUID(),
        partitionKey: "movement",
        productId: product.id,
        productName: product.name,
        variantId: variant?.id || "",
        barcode: variant?.barcode || product.barcode || "",
        type: "out",
        quantity: qty,
        reason: `Stripe order ${li.id} (${deductedFrom})`,
        createdAt: new Date().toISOString(),
      });
      deducted++;
    } catch (err) {
      console.error(`[webhook] stock deduction failed for line_item ${li.id}:`, err);
      // Continue with remaining items — don't fail the webhook.
    }
  }
  return deducted;
}

async function persistFailedPayment(rid: string, paymentIntent: Stripe.PaymentIntent) {
  try {
    const failedContainer = await getContainer("failed-payments");
    await failedContainer.items.create({
      id: paymentIntent.id,
      partitionKey: "failure",
      paymentIntentId: paymentIntent.id,
      amount: (paymentIntent.amount || 0) / 100,
      currency: paymentIntent.currency,
      customerEmail: paymentIntent.receipt_email || "",
      reason: paymentIntent.last_payment_error?.message || "unknown",
      code: paymentIntent.last_payment_error?.code || "",
      createdAt: new Date((paymentIntent.created || Date.now() / 1000) * 1000).toISOString(),
    });
    console.log(`[${rid}] failed payment persisted: ${paymentIntent.id}`);
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 409) return; // duplicate, fine
    console.error(`[${rid}] failed-payment persist failed:`, err);
  }
}

async function handleRefund(rid: string, charge: Stripe.Charge) {
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) {
    console.warn(`[${rid}] charge.refunded with no payment_intent — cannot locate order`);
    return;
  }

  const ordersContainer = await getContainer("orders");
  const { resources } = await ordersContainer.items
    .query({
      query: "SELECT * FROM c WHERE c.partitionKey = 'order' AND c.stripePaymentIntentId = @pi",
      parameters: [{ name: "@pi", value: piId }],
    })
    .fetchAll();

  if (resources.length === 0) {
    console.warn(`[${rid}] no order found for refunded payment_intent ${piId}`);
    return;
  }

  const order = resources[0];

  // The charge in the event no longer embeds its refunds (Stripe API
  // 2022-11-15+), so list them. Each refund id is processed exactly once:
  // ids already in order.refunds are skipped, which makes a re-delivered
  // event a no-op instead of a second restock / email / customer reversal.
  const stripe = getStripe();
  let refundsData: Array<Pick<Stripe.Refund, "id" | "amount" | "status" | "reason" | "created">>;
  try {
    refundsData = (await stripe.refunds.list({ charge: charge.id, limit: 100 })).data;
  } catch (err) {
    // e.g. a restricted key without Refunds:read. Fall back to whatever the
    // event carries, else to the change in amount_refunded since last time —
    // keyed on the cumulative amount so a re-delivery still dedupes.
    console.error(`[${rid}] refunds.list failed — falling back to amount delta:`, err);
    refundsData = charge.refunds?.data ?? [];
    if (refundsData.length === 0) {
      const prevCents = Math.round((order.refundedAmount || 0) * 100);
      const delta = (charge.amount_refunded || 0) - prevCents;
      if (delta > 0) {
        refundsData = [{
          id: `${charge.id}:${charge.amount_refunded}`,
          amount: delta,
          status: "succeeded",
          reason: null,
          created: Math.floor(Date.now() / 1000),
        }];
      }
    }
  }
  const known = new Set(
    (Array.isArray(order.refunds) ? order.refunds : []).map((r: { refundId?: string }) => r.refundId),
  );
  // Orders refunded by the previous code may carry the charge id instead of
  // the refund id. Anything created before such an entry was processed is
  // already reflected in the order and the customer, so it is not new.
  const legacy = (Array.isArray(order.refunds) ? order.refunds : []).filter(
    (r: { refundId?: string }) => !String(r.refundId || "").startsWith("re_"),
  );
  const legacyCutoffMs = legacy.reduce(
    (max: number, r: { processedAt?: string }) => Math.max(max, Date.parse(r.processedAt || "") || 0),
    0,
  );
  const newRefunds = refundsData
    .filter((r) => r.status !== "failed" && r.status !== "canceled" && !known.has(r.id))
    .filter((r) => r.created * 1000 > legacyCutoffMs)
    .sort((a, b) => a.created - b.created);

  const isFullRefund = charge.amount_refunded >= charge.amount;
  const wasFullyRefunded = order.status === "refunded";
  const becomesFullyRefunded = isFullRefund && !wasFullyRefunded;

  if (newRefunds.length === 0 && !becomesFullyRefunded) {
    console.log(`[${rid}] charge.refunded for order ${order.orderNumber} — nothing new, skipping`);
    return;
  }

  order.paymentStatus = isFullRefund ? "refunded" : "partially_refunded";
  order.status = isFullRefund ? "refunded" : "partially_refunded";
  order.refundedAmount = (charge.amount_refunded || 0) / 100;
  order.refundedAt = new Date().toISOString();
  order.refunds = Array.isArray(order.refunds) ? order.refunds : [];
  for (const r of newRefunds) {
    order.refunds.push({
      refundId: r.id,
      amount: (r.amount || 0) / 100,
      type: isFullRefund ? "full" : "partial",
      reason: r.reason || "",
      processedAt: new Date().toISOString(),
    });
  }
  order.updatedAt = new Date().toISOString();

  // Claim the refunds with an etag write BEFORE any side effect. If two
  // deliveries race, one gets 412 and returns 500; Stripe's retry then finds
  // the refunds recorded and skips.
  await ordersContainer.item(order.id, "order").replace(order, {
    accessCondition: { type: "IfMatch", condition: order._etag },
  });

  const newAmount = newRefunds.reduce((sum, r) => sum + (r.amount || 0), 0) / 100;
  console.log(
    `[${rid}] refund · ${newRefunds.map((r) => r.id).join(",") || "(status only)"} · ${isFullRefund ? "full" : "partial"} · £${newAmount.toFixed(2)} · order ${order.orderNumber}`,
  );

  // Restock — only when the order becomes fully refunded. Partial refunds keep
  // stock as-is (operator can adjust manually).
  if (becomesFullyRefunded) {
    const productsContainer = await getContainer("products");
    const movementsContainer = await getContainer("stock-movements");
    for (const it of (order.items || []) as Array<{ stripePriceId?: string; stripeProductId?: string; quantity: number; name: string }>) {
      if (!it.stripePriceId) continue;
      try {
        // Match like the sale side does: by price, by a variant's price, or by
        // Stripe product (a quantity-break promo price matches no variant).
        const { resources: matches } = await productsContainer.items
          .query({
            query: `SELECT * FROM c WHERE c.partitionKey = 'product' AND (
                      c.stripePriceId = @pid
                      OR c.stripeProductId = @prod
                      OR EXISTS(SELECT VALUE v FROM v IN c.variants WHERE v.stripePriceId = @pid)
                    )`,
            parameters: [
              { name: "@pid", value: it.stripePriceId },
              { name: "@prod", value: it.stripeProductId || "" },
            ],
          })
          .fetchAll();
        if (matches.length === 0) continue;
        const product = matches[0];
        const qty = it.quantity || 0;
        if (qty <= 0) continue;

        type V = { stripePriceId?: string; id?: string };
        const variants: V[] = Array.isArray(product.variants) ? product.variants : [];
        let variant = variants.find((v) => v.stripePriceId === it.stripePriceId) || null;
        if (!variant && variants.length > 0) {
          // Promo price: the variant id is in the price metadata.
          try {
            const price = await stripe.prices.retrieve(it.stripePriceId);
            const promoVariantId = price.metadata?.promoVariantId || "";
            if (promoVariantId) variant = variants.find((v) => v.id === promoVariantId) || null;
          } catch (err) {
            console.error(`[${rid}] price lookup for restock failed (${it.stripePriceId}):`, err);
          }
        }

        let writeOk = false;
        if (variant?.id) {
          const res = await updateVariantStock(product.id, variant.id, qty);
          writeOk = res.ok;
          if (!res.ok) console.error(`[${rid}] variant restock failed: ${res.error}`);
        } else {
          const res = await updateProductStock(product.id, qty);
          writeOk = res.ok;
          if (!res.ok) console.error(`[${rid}] product restock failed: ${res.error}`);
        }
        if (!writeOk) continue;

        await movementsContainer.items.create({
          id: crypto.randomUUID(),
          partitionKey: "movement",
          productId: product.id,
          productName: product.name,
          variantId: variant?.id || "",
          type: "in",
          quantity: qty,
          reason: `Refund — order ${order.orderNumber}`,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error(`[${rid}] restock failed for ${it.name}:`, err);
      }
    }
  }

  // Customer aggregates: spend drops by exactly the newly recorded refunds
  // (so partial + final refunds add up to the order total, never more); the
  // order stops counting only when it becomes fully refunded.
  if (order.customerId && (newAmount > 0 || becomesFullyRefunded)) {
    try {
      const customers = await getContainer("customers");
      for (let attempt = 0; attempt < 5; attempt++) {
        const { resource: customer } = await customers.item(order.customerId, "customer").read();
        if (!customer) break;
        customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - newAmount);
        if (becomesFullyRefunded) customer.totalOrders = Math.max(0, (customer.totalOrders || 1) - 1);
        customer.updatedAt = new Date().toISOString();
        try {
          await customers.item(order.customerId, "customer").replace(customer, {
            accessCondition: { type: "IfMatch", condition: customer._etag },
          });
          break;
        } catch (err) {
          if ((err as { code?: number }).code !== 412) throw err;
        }
      }
    } catch (err) {
      console.error(`[${rid}] customer aggregate adjustment failed:`, err);
    }
  }

  // One refund email per newly recorded refund — never throws.
  if (order.customerEmail) {
    for (const r of newRefunds) {
      try {
        const { subject, html } = renderRefundConfirmationEmail({
          customerName: order.customerName || "",
          orderNumber: order.orderNumber,
          amount: (r.amount || 0) / 100,
          type: isFullRefund ? "full" : "partial",
        });
        await sendEmail(rid, { to: order.customerEmail, subject, html });
      } catch (err) {
        console.error(`[${rid}] refund email failed:`, err);
      }
    }
  }
}

async function handleDispute(rid: string, dispute: Stripe.Dispute) {
  const piId = typeof dispute.payment_intent === "string"
    ? dispute.payment_intent
    : dispute.payment_intent?.id;
  if (!piId) {
    console.warn(`[${rid}] dispute ${dispute.id} with no payment_intent — cannot locate order`);
    return;
  }

  const ordersContainer = await getContainer("orders");
  const { resources } = await ordersContainer.items
    .query({
      query: "SELECT * FROM c WHERE c.partitionKey = 'order' AND c.stripePaymentIntentId = @pi",
      parameters: [{ name: "@pi", value: piId }],
    })
    .fetchAll();

  if (resources.length === 0) {
    console.warn(`[${rid}] no order found for disputed payment_intent ${piId}`);
    return;
  }

  const order = resources[0];
  const amount = (dispute.amount || 0) / 100;
  order.disputes = Array.isArray(order.disputes) ? order.disputes : [];
  if (!order.disputes.find((d: { disputeId?: string }) => d.disputeId === dispute.id)) {
    order.disputes.push({
      disputeId: dispute.id,
      amount,
      reason: dispute.reason || "",
      createdAt: new Date((dispute.created || Date.now() / 1000) * 1000).toISOString(),
      status: "open",
    });
  }
  order.updatedAt = new Date().toISOString();
  await ordersContainer.item(order.id, "order").replace(order);

  console.log(
    `[${rid}] dispute ${dispute.id} opened · £${amount.toFixed(2)} · reason="${dispute.reason}" · order ${order.orderNumber} — awaiting manual action`,
  );
}

export async function POST(request: NextRequest) {
  const rid = crypto.randomUUID().slice(0, 8);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, assertWebhookSecret());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[${rid}] Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[${rid}] checkout.session.completed`, {
          sessionId: session.id,
          customerEmail: session.customer_details?.email ?? session.customer_email ?? session.metadata?.customer_email,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentStatus: session.payment_status,
        });
        // Throwing here propagates to the outer catch and returns 500 →
        // Stripe will retry with exponential backoff up to 3 days.
        await persistOrderFromSession(session.id, rid);
        revalidateTag("products");
        break;
      }

      case "payment_intent.succeeded": {
        // Async payment methods (SEPA, bank redirects) finalize here AFTER
        // checkout.session.completed fires with payment_status="unpaid".
        const pi = event.data.object as Stripe.PaymentIntent;
        // PaymentIntents created before the checkout fix carry the literal
        // "{CHECKOUT_SESSION_ID}" here — Stripe only substitutes that template
        // in success_url — so anything that isn't a real cs_ id is ignored and
        // the session is looked up by payment intent instead.
        const metaSessionId = pi.metadata?.checkout_session_id;
        let sessionId: string | undefined = metaSessionId?.startsWith("cs_") ? metaSessionId : undefined;
        if (!sessionId) {
          try {
            const { data } = await getStripe().checkout.sessions.list({ payment_intent: pi.id, limit: 1 });
            sessionId = data[0]?.id;
          } catch (err) {
            console.error(`[${rid}] sessions.list lookup failed for PI ${pi.id}:`, err);
          }
        }
        if (sessionId) {
          console.log(`[${rid}] payment_intent.succeeded — re-running persist for session ${sessionId}`);
          await persistOrderFromSession(sessionId, rid);
          revalidateTag("products");
        } else {
          console.log(`[${rid}] payment_intent.succeeded with no checkout session linkage — skipping`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`[${rid}] payment_intent.payment_failed`, {
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message,
        });
        await persistFailedPayment(rid, paymentIntent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log(`[${rid}] charge.refunded`, {
          chargeId: charge.id,
          amountRefunded: charge.amount_refunded,
          currency: charge.currency,
        });
        await handleRefund(rid, charge);
        revalidateTag("products");
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        console.warn(`[${rid}] charge.dispute.created`, {
          disputeId: dispute.id,
          amount: dispute.amount,
          reason: dispute.reason,
        });
        await handleDispute(rid, dispute);
        break;
      }

      case "product.created":
      case "product.updated":
      case "price.created":
      case "price.updated": {
        revalidateTag("products");
        break;
      }

      default:
        console.log(`[${rid}] unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, rid });
  } catch (error) {
    // Returning 500 makes Stripe retry. Far better than silently dropping
    // the event and leaving the customer charged with no order record.
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const code = (error as { code?: number | string })?.code;
    console.error(
      `[${rid}] webhook handler failed for ${event.type} — code=${code} message=${message}\n${stack || ""}`,
    );
    return NextResponse.json({ error: "Webhook handler failed", rid }, { status: 500 });
  }
}
