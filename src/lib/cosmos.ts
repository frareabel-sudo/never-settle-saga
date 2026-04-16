import { CosmosClient, Database, Container } from "@azure/cosmos";

// Minimal Cosmos client for webhook-side order + stock writes.
// Mirrors the lazy-init pattern in command-centre/src/lib/azure.ts so
// the two codebases stay compatible (same database, same containers).

let cosmosClient: CosmosClient | null = null;
let database: Database | null = null;
const containers: Record<string, Container> = {};

function getCosmosClient(): CosmosClient {
  if (!cosmosClient) {
    const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
    const key = process.env.AZURE_COSMOS_KEY;
    if (!endpoint) throw new Error("AZURE_COSMOS_ENDPOINT not set");
    if (!key) throw new Error("AZURE_COSMOS_KEY not set");
    cosmosClient = new CosmosClient({ endpoint, key });
  }
  return cosmosClient;
}

async function getDatabase(): Promise<Database> {
  if (!database) {
    const { database: db } = await getCosmosClient().databases.createIfNotExists({ id: "nss-db" });
    database = db;
  }
  return database;
}

export async function getContainer(name: string): Promise<Container> {
  if (!containers[name]) {
    const db = await getDatabase();
    const { container } = await db.containers.createIfNotExists({
      id: name,
      partitionKey: { paths: ["/partitionKey"] },
    });
    containers[name] = container;
  }
  return containers[name];
}

export async function generateOrderNumber(): Promise<string> {
  // Use the first 8 hex chars of a v4 UUID (~3.4e10 space) — collision
  // probability is negligible across realistic order volumes and there is
  // no Cosmos read-modify-write cycle. Async signature kept for callers.
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase().replace(/-/g, "");
  return `NSS-ORD-${suffix}`;
}

export function deterministicOrderId(stripeSessionId: string): string {
  // Use the Stripe session id as the Cosmos document id so a duplicate
  // webhook delivery causes a 409 Conflict on create — true idempotency
  // without a query-then-insert race window.
  return `ord_${stripeSessionId}`;
}

// Pre-checkout stock check. Returns first item that is short, or null if all OK.
export async function findInsufficientStock(
  items: Array<{ stripePriceId: string; quantity: number; productId: string; variantId?: string }>,
): Promise<{ productId: string; available: number; requested: number } | null> {
  if (items.length === 0) return null;
  const products = await getContainer("products");
  for (const it of items) {
    const { resources } = await products.items
      .query({
        query: `SELECT * FROM c WHERE c.partitionKey = 'product' AND (
                  c.stripePriceId = @pid
                  OR EXISTS(SELECT VALUE v FROM v IN c.variants WHERE v.stripePriceId = @pid)
                )`,
        parameters: [{ name: "@pid", value: it.stripePriceId }],
      })
      .fetchAll();
    if (resources.length === 0) continue; // unknown product — let webhook log it
    const product = resources[0];
    // If the selected line is a variant, check THAT variant's own stock — not
    // the parent product's aggregate. Variants each carry their own counter.
    const variant = Array.isArray(product.variants)
      ? product.variants.find((v: { stripePriceId?: string }) => v.stripePriceId === it.stripePriceId)
      : null;
    const available = variant
      ? Number(variant.stockQuantity) || 0
      : Number(product.stockQuantity) || 0;
    if (available < it.quantity) {
      return { productId: it.productId, available, requested: it.quantity };
    }
  }
  return null;
}
