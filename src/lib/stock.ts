import { getContainer } from "@/lib/cosmos";
import type { Product, ProductVariant } from "@/lib/data";

// ───────────────────────────────────────────────────────────────
// v3.32 — canonical stock writer (website side).
// Mirrors command-centre/src/lib/stock.ts so the webhook and the
// CC orders/stock endpoints share one write shape. Shadow-writes
// product.stockQuantity = sum(variants.stock) on the same replace
// so legacy readers stay consistent. ETag IfMatch + bounded retries.
// ───────────────────────────────────────────────────────────────

export interface VariantStockResult {
  ok: boolean;
  error?: string;
  variantStock?: number;
  productStockQuantity?: number;
}

export interface ProductStockResult {
  ok: boolean;
  error?: string;
  productStockQuantity?: number;
}

const MAX_STOCK_RETRIES = 3;

function sumVariantStock(variants: ProductVariant[] | undefined): number {
  if (!Array.isArray(variants) || variants.length === 0) return 0;
  return variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
}

export async function updateVariantStock(
  productId: string,
  variantId: string,
  delta: number,
): Promise<VariantStockResult> {
  if (!productId || !variantId) return { ok: false, error: "productId + variantId required" };
  const products = await getContainer("products");

  for (let attempt = 0; attempt < MAX_STOCK_RETRIES; attempt++) {
    const { resource } = await products.item(productId, "product").read<Product & { _etag?: string; variants?: ProductVariant[]; stockQuantity?: number; updatedAt?: string }>();
    if (!resource) return { ok: false, error: "Product not found" };
    const variants = (resource.variants ?? []) as ProductVariant[];
    const idx = variants.findIndex((v) => v.id === variantId);
    if (idx < 0) return { ok: false, error: "Variant not found" };

    const current = Number(variants[idx].stock) || 0;
    const next = Math.max(0, current + delta);
    variants[idx] = { ...variants[idx], stock: next };
    const updated = {
      ...resource,
      variants,
      stockQuantity: sumVariantStock(variants),
      updatedAt: new Date().toISOString(),
    };

    try {
      await products.item(productId, "product").replace(updated, {
        accessCondition: { type: "IfMatch", condition: (resource as { _etag?: string })._etag as string },
      });
      return { ok: true, variantStock: next, productStockQuantity: updated.stockQuantity };
    } catch (err: unknown) {
      const code = (err as { code?: number }).code;
      if (code === 412 && attempt < MAX_STOCK_RETRIES - 1) continue;
      return { ok: false, error: err instanceof Error ? err.message : "Stock write failed" };
    }
  }
  return { ok: false, error: "Stock write retry exhausted" };
}

// Non-variant product stock mutation. Used for resale / single-SKU products
// that never carried a variants[] array. Kept here so webhook + refund paths
// use one helper regardless of product shape.
export async function updateProductStock(
  productId: string,
  delta: number,
): Promise<ProductStockResult> {
  if (!productId) return { ok: false, error: "productId required" };
  const products = await getContainer("products");

  for (let attempt = 0; attempt < MAX_STOCK_RETRIES; attempt++) {
    const { resource } = await products.item(productId, "product").read<Product & { _etag?: string; variants?: ProductVariant[]; stockQuantity?: number; updatedAt?: string }>();
    if (!resource) return { ok: false, error: "Product not found" };
    // If product has variants, callers should be going through updateVariantStock.
    // Writing to the aggregate would be overwritten by the next variant write.
    if (Array.isArray(resource.variants) && resource.variants.length > 0) {
      return { ok: false, error: "Product has variants — use updateVariantStock" };
    }
    const current = Number(resource.stockQuantity) || 0;
    const next = Math.max(0, current + delta);
    const updated = {
      ...resource,
      stockQuantity: next,
      updatedAt: new Date().toISOString(),
    };
    try {
      await products.item(productId, "product").replace(updated, {
        accessCondition: { type: "IfMatch", condition: (resource as { _etag?: string })._etag as string },
      });
      return { ok: true, productStockQuantity: next };
    } catch (err: unknown) {
      const code = (err as { code?: number }).code;
      if (code === 412 && attempt < MAX_STOCK_RETRIES - 1) continue;
      return { ok: false, error: err instanceof Error ? err.message : "Stock write failed" };
    }
  }
  return { ok: false, error: "Stock write retry exhausted" };
}
