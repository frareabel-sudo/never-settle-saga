import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/store-settings";

// Public — cart page reads this to render the "X away from free shipping"
// banner and to know shipping tiers without hitting Stripe. 60s edge cache.
export const revalidate = 60;

export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({
    rates: settings.shipping.rates.filter((r) => r.enabled),
    freeShippingThresholdGBP: settings.shipping.freeShippingThresholdGBP,
    freeShippingMethod: settings.shipping.freeShippingMethod,
  });
}
