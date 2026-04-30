import { getProducts, getReviews } from "@/lib/data";
import HomeClient from "./_home-client";

export const revalidate = 60;

export default async function HomePage() {
  const [products, reviews] = await Promise.all([getProducts(), getReviews()]);
  return <HomeClient products={products} reviews={reviews} />;
}
