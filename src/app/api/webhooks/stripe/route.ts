import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getStripe, assertWebhookSecret } from "@/lib/stripe";
import { getContainer, generateOrderNumber, deterministicOrderId } from "@/lib/cosmos";
import { sendEmail } from "@/lib/email/resend";
import { renderOrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";
import { renderRefundConfirmationEmail } from "@/lib/email/templates/refund-confirmation";
import Stripe from "stripe";

// Boot-time guard — fails the function cold-start if the secret is unset,
// so the deploy errors loudly instead of silently 500ing every webhook.
assertWebhookSecret();

// Persist an order to Cosmos and deduct stock atomically-ish.
// Idempotent on stripeSessionId — re-delivery of the webhook is a no-op.
async function persistOrderFromSession(sessionId: string, rid = "-") {
  const stripe = getStripe();

  // Re-fetch with expansions so we always have line_items + shipping.
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    // Note: `shipping_details` and `customer_details` are returned by default
    // on the session in API version 2026-03-25.dahlia and can no longer be
    // passed to expand — Stripe 400s if they appear here.
    expand: [
      "line_items.data.price.product",
      "payment_intent.payment_method",
      "total_details.breakdown.discounts.discount.coupon",
      "shipping_cost.shipping_rate",
    ],
  });

  if (session.payment_status !== "paid") {
    console.log(`[webhook] skipping persist — session ${sessionId} not paid`);
    return;
  }

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

  const customersContainer = await getContainer("customers");

  const email = session.customer_details?.email || session.customer_email || "";
  const name = session.customer_details?.name || "";
  const shipDetails = (session as unknown as { shipping_details?: { name?: string | null; address?: Record<string, string | null> | null } }).shipping_details;
  const addr = shipDetails?.address || session.customer_details?.address || null;
  const formattedAddress = addr
    ? [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean).join(", ")
    : "";
  const phone = session.customer_details?.phone || "";
  const recipientName = shipDetails?.name || name;

  // Upsert customer
  let customerId: string | undefined;
  if (email) {
    const { resources: existingCust } = await customersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.partitionKey = 'customer' AND LOWER(c.email) = @email",
        parameters: [{ name: "@email", value: email.toLowerCase() }],
      })
      .fetchAll();

    if (existingCust.length > 0) {
      customerId = existingCust[0].id;
      existingCust[0].totalOrders += 1;
      existingCust[0].totalSpent += (session.amount_total || 0) / 100;
      existingCust[0].lastOrderAt = new Date(session.created * 1000).toISOString();
      existingCust[0].updatedAt = new Date().toISOString();
      await customersContainer.item(customerId!, "customer").replace(existingCust[0]);
    } else {
      customerId = crypto.randomUUID();
      await customersContainer.items.create({
        id: customerId,
        partitionKey: "customer",
        email: email.toLowerCase(),
        name,
        phone,
        shippingAddress: formattedAddress,
        tags: ["webhook"],
        notes: "",
        totalOrders: 1,
        totalSpent: (session.amount_total || 0) / 100,
        currency: session.currency || "gbp",
        firstOrderAt: new Date(session.created * 1000).toISOString(),
        lastOrderAt: new Date(session.created * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

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

  // Deduct stock per line_item. Non-fatal: stock errors are logged inside
  // deductStockForLineItems; the order is already safely persisted.
  await deductStockForLineItems(lineItems);

  console.log(`[${rid}] persisted order ${orderNumber} for session ${sessionId}`);

  // Fire-and-forget confirmation email. Any failure is logged against rid;
  // order is already persisted so we must never throw here.
  if (email) {
    try {
      const { subject, html } = renderOrderConfirmationEmail({
        customerName: name,
        orderNumber,
        createdAt: new Date(session.created * 1000).toISOString(),
        items: items.map((it) => ({
          name: it.name,
          options: it.options || undefined,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          lineTotal: it.lineTotal,
        })),
        subtotal: (session.amount_subtotal || 0) / 100,
        shipping: shippingAmount,
        shippingMethod,
        discountCode: discountCode || undefined,
        discountAmount: discountAmount || undefined,
        total: (session.amount_total || 0) / 100,
        shippingAddress: formattedAddress,
        shippingName: recipientName,
      });
      await sendEmail(rid, { to: email, subject, html });
    } catch (err) {
      console.error(`[${rid}] order confirmation email failed:`, err);
    }
  }
}

async function deductStockForLineItems(lineItems: Stripe.LineItem[]) {
  if (lineItems.length === 0) return;
  const productsContainer = await getContainer("products");
  const movementsContainer = await getContainer("stock-movements");

  for (const li of lineItems) {
    try {
      const price = li.price as Stripe.Price | null;
      if (!price) continue;

      const stripeProductId = typeof price.product === "string" ? price.product : price.product?.id;
      const stripePriceId = price.id;
      const qty = li.quantity || 1;

      // Find matching Cosmos product by stripePriceId (primary) or stripeProductId (fallback),
      // or by matching a variant's stripePriceId.
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
      const newQty = Math.max(0, (product.stockQuantity || 0) - qty);

      product.stockQuantity = newQty;
      product.updatedAt = new Date().toISOString();
      await productsContainer.item(product.id, "product").replace(product);

      await movementsContainer.items.create({
        id: crypto.randomUUID(),
        partitionKey: "movement",
        productId: product.id,
        productName: product.name,
        barcode: product.barcode || "",
        type: "out",
        quantity: qty,
        reason: `Stripe order ${li.id}`,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`[webhook] stock deduction failed for line_item ${li.id}:`, err);
      // Continue with remaining items — don't fail the webhook.
    }
  }
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
  const isFullRefund = charge.amount_refunded >= charge.amount;

  // Find the newest refund on the charge for amount/reason/id. Stripe orders
  // them newest-first, so the first element is what this webhook is about.
  const latestRefund = charge.refunds?.data?.[0];
  const refundId = latestRefund?.id || charge.id;
  const refundAmount = latestRefund
    ? (latestRefund.amount || 0) / 100
    : (charge.amount_refunded || 0) / 100;
  const refundReason = latestRefund?.reason || "";

  order.paymentStatus = isFullRefund ? "refunded" : "partially_refunded";
  order.status = isFullRefund ? "refunded" : "partially_refunded";
  order.refundedAmount = (charge.amount_refunded || 0) / 100;
  order.refundedAt = new Date().toISOString();
  order.refunds = Array.isArray(order.refunds) ? order.refunds : [];
  if (!order.refunds.find((r: { refundId?: string }) => r.refundId === refundId)) {
    order.refunds.push({
      refundId,
      amount: refundAmount,
      type: isFullRefund ? "full" : "partial",
      reason: refundReason,
      processedAt: new Date().toISOString(),
    });
  }
  order.updatedAt = new Date().toISOString();
  await ordersContainer.item(order.id, "order").replace(order);

  console.log(
    `[${rid}] refund ${refundId} · ${isFullRefund ? "full" : "partial"} · £${refundAmount.toFixed(2)} · reason="${refundReason}" · order ${order.orderNumber}`,
  );

  // Restock — only for full refunds. Partial refunds keep stock as-is
  // (operator can manually adjust if needed).
  if (isFullRefund) {
    const productsContainer = await getContainer("products");
    const movementsContainer = await getContainer("stock-movements");
    for (const it of (order.items || []) as Array<{ stripePriceId?: string; quantity: number; name: string }>) {
      if (!it.stripePriceId) continue;
      try {
        const { resources: matches } = await productsContainer.items
          .query({
            query: `SELECT * FROM c WHERE c.partitionKey = 'product' AND (
                      c.stripePriceId = @pid
                      OR EXISTS(SELECT VALUE v FROM v IN c.variants WHERE v.stripePriceId = @pid)
                    )`,
            parameters: [{ name: "@pid", value: it.stripePriceId }],
          })
          .fetchAll();
        if (matches.length === 0) continue;
        const product = matches[0];
        product.stockQuantity = (product.stockQuantity || 0) + (it.quantity || 0);
        product.updatedAt = new Date().toISOString();
        await productsContainer.item(product.id, "product").replace(product);
        await movementsContainer.items.create({
          id: crypto.randomUUID(),
          partitionKey: "movement",
          productId: product.id,
          productName: product.name,
          type: "in",
          quantity: it.quantity || 0,
          reason: `Refund — order ${order.orderNumber}`,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error(`[${rid}] restock failed for ${it.name}:`, err);
      }
    }

  }

  // Customer aggregates: full refunds reverse totalOrders + totalSpent by
  // the full order total; partial refunds only reduce totalSpent by the
  // refunded amount (the order still counts).
  if (order.customerId) {
    try {
      const customers = await getContainer("customers");
      const { resource: customer } = await customers.item(order.customerId, "customer").read();
      if (customer) {
        if (isFullRefund) {
          customer.totalOrders = Math.max(0, (customer.totalOrders || 1) - 1);
          customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - (order.total || 0));
        } else {
          customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - refundAmount);
        }
        customer.updatedAt = new Date().toISOString();
        await customers.item(order.customerId, "customer").replace(customer);
      }
    } catch (err) {
      console.error(`[${rid}] customer aggregate adjustment failed:`, err);
    }
  }

  // Refund confirmation email — never throws.
  if (order.customerEmail) {
    try {
      const { subject, html } = renderRefundConfirmationEmail({
        customerName: order.customerName || "",
        orderNumber: order.orderNumber,
        amount: refundAmount,
        type: isFullRefund ? "full" : "partial",
      });
      await sendEmail(rid, { to: order.customerEmail, subject, html });
    } catch (err) {
      console.error(`[${rid}] refund email failed:`, err);
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
        const sessionId = pi.metadata?.checkout_session_id || (pi as unknown as { invoice?: string }).invoice;
        if (sessionId && typeof sessionId === "string") {
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
    console.error(`[${rid}] webhook handler failed for ${event.type}:`, error);
    return NextResponse.json({ error: "Webhook handler failed", rid }, { status: 500 });
  }
}
