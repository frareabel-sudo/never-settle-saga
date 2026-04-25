import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getContainer } from "@/lib/cosmos";
import { getProducts } from "@/lib/data";

// GET /api/diagnose?secret=<REVALIDATE_SECRET>
// One-shot diag: which Stripe key the site is using, raw vs filtered counts.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const stripeKeyPrefix = (process.env.STRIPE_SECRET_KEY || "").slice(0, 8);

  let stripeRaw: { id: string; name: string; active: boolean; default_price: string | null }[] = [];
  let stripeError: string | undefined;
  try {
    const list = await getStripe().products.list({ active: true, limit: 100 });
    stripeRaw = list.data.map((p) => ({
      id: p.id,
      name: p.name,
      active: p.active,
      default_price: typeof p.default_price === "string" ? p.default_price : (p.default_price?.id ?? null),
    }));
  } catch (err) {
    stripeError = err instanceof Error ? err.message : String(err);
  }

  let cosmosCount = 0;
  let cosmosFirstStripeIds: string[] = [];
  let cosmosError: string | undefined;
  try {
    const container = await getContainer("products");
    const { resources } = await container.items
      .query<{ id: string; stripeProductId?: string; publishToWebsite?: boolean }>(
        "SELECT c.id, c.stripeProductId, c.publishToWebsite FROM c WHERE c.partitionKey = 'product'",
      )
      .fetchAll();
    cosmosCount = resources.length;
    cosmosFirstStripeIds = resources.slice(0, 5).map((r) => r.stripeProductId || "(none)");
  } catch (err) {
    cosmosError = err instanceof Error ? err.message : String(err);
  }

  let filteredCount = -1;
  let filterError: string | undefined;
  try {
    const filtered = await getProducts();
    filteredCount = filtered.length;
  } catch (err) {
    filterError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    success: true,
    stripeKeyPrefix,
    stripeRawCount: stripeRaw.length,
    stripeRawSample: stripeRaw.slice(0, 5),
    stripeError,
    cosmosCount,
    cosmosFirstStripeIds,
    cosmosError,
    filteredCount,
    filterError,
  });
}
