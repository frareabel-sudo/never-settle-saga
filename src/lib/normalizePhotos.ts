import type { ProductPhoto } from "@/lib/data";

export type PhotosInput = string[] | ProductPhoto[] | undefined | null;

export function normalizePhotos(raw: PhotosInput): ProductPhoto[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];
  const first = raw[0];
  if (typeof first === "string") {
    return (raw as string[])
      .map((url, i) => ({
        url,
        variantIds: [],
        order: i,
        uploadedAt: "",
      }))
      .filter((p) => p.url.length > 0);
  }
  return (raw as Array<Partial<ProductPhoto>>)
    .map((p, i) => ({
      url: p.url || "",
      variantIds: Array.isArray(p.variantIds) ? p.variantIds : [],
      order: typeof p.order === "number" ? p.order : i,
      uploadedAt: p.uploadedAt || "",
    }))
    .filter((p) => p.url.length > 0);
}

export function photosForVariant(
  photos: ProductPhoto[],
  variantId: string | undefined,
): ProductPhoto[] {
  if (photos.length === 0) return [];
  if (!variantId) {
    return [...photos].sort((a, b) => a.order - b.order);
  }
  const tagged = photos.filter((p) => p.variantIds.includes(variantId));
  const masters = photos.filter((p) => p.variantIds.length === 0);
  return [...tagged, ...masters].sort((a, b) => a.order - b.order);
}

export function getVariantBarcode(v: { barcode?: string }): string | undefined {
  const b = v.barcode;
  return typeof b === "string" && b.length > 0 ? b : undefined;
}
