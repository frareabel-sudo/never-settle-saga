import { Suspense } from "react";
import { getProducts, getCategories } from "@/lib/data";
import ShopClient from "./_shop-client";

export const revalidate = 60;

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  // ShopClient reads ?category= via useSearchParams, which needs a Suspense
  // boundary; without it the whole page would opt out of static rendering.
  return (
    <Suspense fallback={null}>
      <ShopClient products={products} categories={categories} />
    </Suspense>
  );
}
