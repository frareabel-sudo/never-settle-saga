import { notFound } from "next/navigation";
import { getProducts } from "@/lib/data";
import ProductClient from "./_product-client";

export const revalidate = 60;

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const products = await getProducts();
  const product = products.find((p) => p.slug === params.slug);
  if (!product) notFound();

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return <ProductClient product={product} related={related} />;
}
