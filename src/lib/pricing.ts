import type { ProductPromotion } from "./data";

/**
 * The quantity-break promotion that applies to a line, if any. Deepest
 * qualifying tier wins (highest minQty at or below the quantity).
 *
 * Shared by the cart (what the customer sees) and the checkout route (what
 * Stripe charges) so the two can never disagree — the free-shipping bar in
 * particular has to use the same subtotal the server uses.
 */
export function promoFor(
  promotions: ProductPromotion[] | undefined,
  variantId: string | undefined,
  quantity: number,
): ProductPromotion | undefined {
  return (promotions ?? [])
    .filter((p) => p.variantId === (variantId ?? "") && quantity >= p.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0];
}
