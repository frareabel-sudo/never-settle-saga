import { getProducts, getReviews, getCategories } from "@/lib/data";
import HomeClient from "./_home-client";

export const revalidate = 60;

export default async function HomePage() {
  const [products, reviews, categories] = await Promise.all([
    getProducts(),
    getReviews(),
    getCategories(),
  ]);
  return (
    <HomeClient products={products} reviews={reviews} categories={categories} />
  );
}
