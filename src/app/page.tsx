import { getProducts } from "@/lib/data";
import HomeClient from "./_home-client";

export const revalidate = 60;

export default async function HomePage() {
  const products = await getProducts();
  return <HomeClient products={products} />;
}
