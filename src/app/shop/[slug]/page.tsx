import { notFound } from "next/navigation";
import { getProducts } from "@/lib/data";
import { getStoreSettings } from "@/lib/store-settings";
import ProductClient from "./_product-client";

export const revalidate = 60;

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const products = await getProducts();
  // Number comes from store settings so it can change without a deploy; a
  // failure here must not take the product page down with it.
  let whatsAppNumber = "";
  try {
    whatsAppNumber = (await getStoreSettings()).contact?.social?.whatsapp || "";
  } catch {
    whatsAppNumber = "";
  }
  const product = products.find((p) => p.slug === params.slug);
  if (!product) notFound();

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <ProductClient
      product={product}
      related={related}
      whatsAppNumber={whatsAppNumber}
    />
  );
}
