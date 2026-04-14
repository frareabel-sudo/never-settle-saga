import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

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
        // Refresh the ISR products cache so any stock/availability changes made
        // in Command Centre right after checkout show up immediately on the
        // public site instead of waiting the 60s window.
        revalidateTag("products");
        // Command Centre pulls orders on a 5-min interval from its /orders
        // page. The webhook's job here is to keep the public catalogue fresh;
        // order fulfillment (packing, shipping) happens in Command Centre.
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
        // Product catalogue changed in Stripe (via Command Centre or dashboard).
        // Kick ISR so the site picks it up without waiting 60s.
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
