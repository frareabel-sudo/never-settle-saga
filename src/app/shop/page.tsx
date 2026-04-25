import { getProducts, getCategories } from "@/lib/data";
import ShopClient from "./_shop-client";

export const revalidate = 60;

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return <ShopClient products={products} categories={categories} />;
}
