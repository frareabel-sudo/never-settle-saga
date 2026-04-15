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
  const container = await getContainer("orders");
  const { resources } = await container.items
    .query("SELECT VALUE COUNT(1) FROM c")
    .fetchAll();
  const n = ((resources[0] as number) || 0) + 1;
  return `NSS-ORD-${String(n).padStart(5, "0")}`;
}
