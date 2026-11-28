import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getContainer } from "@/lib/cosmos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cookieless visit counter for Command Centre's sales funnel.
 *
 * Privacy: no cookies, nothing stored on the device. A visitor is a hash of
 * (secret salt + day + IP + user agent), so the same person counts once per
 * day and can't be recognised the next day or from the stored data. The IP
 * itself is never stored.
 *
 * Storage: the `events` container (partitionKey "visit"). The database is at
 * its 25-container shared-throughput cap, and a new container would carry its
 * own monthly charge; the calendar shares `events` but only ever reads
 * partitionKey "event".
 *
 *   v:<day>:<hash>   one per visitor per day — source, first page, and
 *                    whether they reached the cart / started checkout
 *   p:<day>:<path>   page views per page per day
 */
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|headless|lighthouse|vercel|monitor/i;
const PK = "visit";

function londonDay(d = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d);
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function sourceOf(ref: string, utm: string): string {
  if (utm) return utm.toLowerCase().slice(0, 40);
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "").replace(/^l\.|^lm\.|^m\./, "");
    if (host.endsWith("dreamcraftstudio.co.uk") || host.endsWith("neversettlesaga.com")) return "";
    return host.slice(0, 60);
  } catch {
    return "direct";
  }
}

async function bump(container: Awaited<ReturnType<typeof getContainer>>, id: string, doc: Record<string, unknown>) {
  try {
    await container.item(id, PK).patch([{ op: "incr", path: "/views", value: 1 }]);
  } catch (err) {
    if ((err as { code?: number }).code !== 404) throw err;
    try {
      await container.items.create({ id, partitionKey: PK, ...doc, views: 1 });
    } catch (e) {
      if ((e as { code?: number }).code !== 409) throw e;
      await container.item(id, PK).patch([{ op: "incr", path: "/views", value: 1 }]);
    }
  }
}

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (!ua || BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });

  let body: { path?: unknown; ref?: unknown; utm?: unknown; event?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const path = typeof body.path === "string" ? body.path.split("?")[0]!.slice(0, 120) : "";
  const event = body.event === "checkout" ? "checkout" : "";
  if (!path.startsWith("/") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });

  const day = londonDay();
  const salt = process.env.VISIT_SALT || process.env.STRIPE_WEBHOOK_SECRET || "dcs";
  const hash = createHash("sha256").update(`${salt}|${day}|${clientIp(req)}|${ua}`).digest("hex").slice(0, 20);
  const visitorId = `v:${day}:${hash}`;

  try {
    const events = await getContainer("events");

    // Visitor of the day (first page wins the source).
    const flags: Array<{ op: "set"; path: string; value: boolean }> = [];
    if (path === "/cart") flags.push({ op: "set", path: "/cart", value: true });
    if (event === "checkout") flags.push({ op: "set", path: "/checkout", value: true });
    try {
      await events.items.create({
        id: visitorId,
        partitionKey: PK,
        type: "visitor",
        day,
        source: sourceOf(typeof body.ref === "string" ? body.ref : "", typeof body.utm === "string" ? body.utm : "") || "direct",
        firstPath: path,
        cart: path === "/cart",
        checkout: event === "checkout",
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      if ((err as { code?: number }).code !== 409) throw err;
      if (flags.length) await events.item(visitorId, PK).patch(flags);
    }

    if (!event) {
      const pathKey = path.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/\//g, "~") || "~";
      await bump(events, `p:${day}:${pathKey}`, { type: "pageview", day, path });
    }
  } catch (err) {
    // Counting must never break the page.
    console.error("[track] failed:", (err as Error).message);
  }
  return new NextResponse(null, { status: 204 });
}
