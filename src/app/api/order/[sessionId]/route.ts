import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

// Public read of a single order by Stripe session id, used by the
// success page after checkout. Returns only fields safe to show the
// customer (no Stripe PI id, no internal notes).
export async function GET(_req: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  if (!sessionId || sessionId.length > 200) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  try {
    const orders = await getContainer("orders");
    const { resources } = await orders.items
      .query({
        query: "SELECT * FROM c WHERE c.partitionKey = 'order' AND c.stripeSessionId = @sid",
        parameters: [{ name: "@sid", value: sessionId }],
      })
      .fetchAll();

    if (resources.length === 0) {
      // The webhook may not have landed yet — let the client retry.
      return NextResponse.json({ pending: true }, { status: 202 });
    }

    const o = resources[0];
    return NextResponse.json({
      orderNumber: o.orderNumber,
      customerEmail: o.customerEmail,
      customerName: o.customerName,
      items: (o.items || []).map((i: { name: string; options?: string; quantity: number; unitPrice: number; lineTotal?: number }) => ({
        name: i.name,
        options: i.options,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal ?? i.unitPrice * i.quantity,
      })),
      subtotal: o.subtotal,
      shipping: o.shipping,
      discountCode: o.discountCode,
      discountAmount: o.discountAmount,
      total: o.total,
      currency: o.currency,
      shippingAddress: o.shippingAddress,
      shippingName: o.shippingName,
      createdAt: o.createdAt,
    });
  } catch (e) {
    console.error("[order lookup] failed:", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
