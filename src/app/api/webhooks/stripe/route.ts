import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getStripe } from "@/lib/stripe";
import { getContainer, generateOrderNumber } from "@/lib/cosmos";
import Stripe from "stripe";

// Persist an order to Cosmos and deduct stock atomically-ish.
// Idempotent on stripeSessionId — re-delivery of the webhook is a no-op.
async function persistOrderFromSession(sessionId: string) {
  const stripe = getStripe();

  // Re-fetch with expansions so we always have line_items + shipping.
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product", "customer_details", "shipping_details"],
  });

  if (session.payment_status !== "paid") {
    console.log(`[webhook] skipping persist — session ${sessionId} not paid`);
    return;
  }

  const ordersContainer = await getContainer("orders");

  // Idempotency check
  const { resources: existing } = await ordersContainer.items
    .query({
      query: "SELECT c.id FROM c WHERE c.partitionKey = 'order' AND c.stripeSessionId = @sid",
      parameters: [{ name: "@sid", value: sessionId }],
    })
    .fetchAll();
  if (existing.length > 0) {
    console.log(`[webhook] order already persisted for session ${sessionId}`);
    return;
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

  const items = lineItems.map((li) => ({
    name: li.description || "Item",
    quantity: li.quantity || 1,
    unitPrice: (li.amount_total || 0) / 100 / (li.quantity || 1),
  }));

  const orderNumber = await generateOrderNumber();

  await ordersContainer.items.create({
    id: crypto.randomUUID(),
    partitionKey: "order",
    stripeSessionId: session.id,
    orderNumber,
    customerEmail: email,
    customerId,
    customerName: name,
    items,
    subtotal: (session.amount_subtotal || 0) / 100,
    shipping: ((session.amount_total || 0) - (session.amount_subtotal || 0)) / 100,
    total: (session.amount_total || 0) / 100,
    currency: session.currency || "gbp",
    status: "confirmed",
    paymentStatus: "paid",
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

  // Deduct stock per line_item (best-effort, non-blocking for order creation).
  await deductStockForLineItems(lineItems);

  console.log(`[webhook] persisted order ${orderNumber} for session ${sessionId}`);
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

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[stripe] checkout.session.completed", {
          sessionId: session.id,
          customerEmail: session.customer_details?.email ?? session.customer_email ?? session.metadata?.customer_email,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentStatus: session.payment_status,
        });

        try {
          await persistOrderFromSession(session.id);
        } catch (err) {
          // Log but don't fail — Stripe will retry, and the 5-min sync in
          // Command Centre is the safety-net reconciliation path.
          console.error("[webhook] persistOrderFromSession failed:", err);
        }

        revalidateTag("products");
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error("[stripe] payment_intent.payment_failed", {
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message,
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("[stripe] charge.refunded", {
          chargeId: charge.id,
          amountRefunded: charge.amount_refunded,
          currency: charge.currency,
        });
        revalidateTag("products");
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
        console.log(`[stripe] unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
