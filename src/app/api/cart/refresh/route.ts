import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/data";

// The cart is a localStorage snapshot of each product as it was when added.
// The cart page posts the product ids it holds and gets back the current
// storefront versions (published products, published variants only), so it
// can show today's prices and drop items that are no longer for sale instead
// of failing at checkout. Read-only, public catalogue data.
export async function POST(req: NextRequest) {
  let ids: unknown;
  try {
    ids = (await req.json())?.ids;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length > 100 || !ids.every((x) => typeof x === "string" && x.length <= 100)) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }
  const wanted = new Set(ids as string[]);
  const products = (await getProducts()).filter((p) => wanted.has(p.id));
  return NextResponse.json({ products });
}
