/**
 * Returning-customer code — a permanent 10% off for anyone who has already
 * bought from the shop.
 *
 * Why it doesn't live in Stripe as a promotion code: Stripe can restrict a code
 * to FIRST-time customers, but not to returning ones. A promotion code typed on
 * the Stripe payment page can't be checked against our order history, so anyone
 * who heard the code could use it. Instead the customer types it in the cart,
 * the checkout route checks the `customers` container, and only then attaches
 * the coupon to the session. The coupon has no promotion code of its own, so
 * typing WELCOMEBACK10 on the Stripe page does nothing.
 *
 * "Has bought" = a customer record with totalOrders >= 1. The Stripe webhook
 * increments it on every paid order and decrements it on a full refund, so a
 * customer whose only order was fully refunded doesn't qualify.
 */
import { createHash } from "crypto";
import type Stripe from "stripe";
import { getContainer } from "@/lib/cosmos";

/** What customers type. Compared case-insensitively. */
export const RETURNING_CUSTOMER_CODE = "WELCOMEBACK10";
export const RETURNING_CUSTOMER_PERCENT_OFF = 10;

/** Fixed Stripe coupon id — created on first use if it doesn't exist yet. */
const COUPON_ID = "welcomeback-10";

/** Deterministic customer id — same formula the Stripe webhook writes with. */
export function customerIdForEmail(email: string): string {
  return "cust_" + createHash("sha1").update(email.toLowerCase()).digest("hex");
}

export function isReturningCustomerCode(code: string): boolean {
  return code.trim().toUpperCase() === RETURNING_CUSTOMER_CODE;
}

/** True when this email has at least one paid, not fully refunded order. */
export async function hasPreviousOrder(email: string): Promise<boolean> {
  const customers = await getContainer("customers");
  try {
    const { resource } = await customers
      .item(customerIdForEmail(email), "customer")
      .read<{ totalOrders?: number }>();
    return (resource?.totalOrders ?? 0) >= 1;
  } catch (err) {
    if ((err as { code?: number }).code === 404) return false;
    throw err;
  }
}

let couponReady: Promise<string> | null = null;

/**
 * Returns the Stripe coupon id, creating the coupon the first time. `name` is
 * what Stripe shows on the payment page and what the order email prints next
 * to the discount line.
 */
export function ensureReturningCustomerCoupon(stripe: Stripe): Promise<string> {
  if (!couponReady) {
    couponReady = (async () => {
      try {
        await stripe.coupons.retrieve(COUPON_ID);
      } catch (err) {
        if ((err as { statusCode?: number }).statusCode !== 404) throw err;
        try {
          await stripe.coupons.create({
            id: COUPON_ID,
            name: RETURNING_CUSTOMER_CODE,
            percent_off: RETURNING_CUSTOMER_PERCENT_OFF,
            duration: "once",
          });
        } catch (createErr) {
          // Another instance created it between our retrieve and create.
          if ((createErr as { code?: string }).code !== "resource_already_exists") throw createErr;
        }
      }
      return COUPON_ID;
    })().catch((err) => {
      couponReady = null; // let the next request retry
      throw err;
    });
  }
  return couponReady;
}
