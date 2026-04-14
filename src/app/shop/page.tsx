import { getProducts } from "@/lib/data";
import ShopClient from "./_shop-client";

export const revalidate = 60;

export default async function ShopPage() {
  const products = await getProducts();
  return <ShopClient products={products} />;
}
