import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts } from "@/lib/data";
import { getStoreSettings } from "@/lib/store-settings";
import ProductClient from "./_product-client";

export const revalidate = 60;

const SITE = "https://dreamcraftstudio.co.uk";

/** First ~155 characters of plain text, cut at a word, for meta descriptions. */
function snippet(text: string, max = 155): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, plain.lastIndexOf(" ", max)).replace(/[,.;:\s]+$/, "") + "…";
}

// Each product gets its own title, description and share image. Without this
// every product page carried the homepage's, so Google and WhatsApp/Instagram
// link previews showed all 58 products as the same page.
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const products = await getProducts();
  const product = products.find((p) => p.slug === params.slug);
  if (!product) return {};
  const description = snippet(
    product.description ||
      product.longDescription ||
      `${product.name}, handmade to order in London by DreamCraft Studio.`,
  );
  const url = `${SITE}/shop/${product.slug}`;
  const image = product.images?.[0];
  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description,
      url,
      type: "website",
      siteName: "DreamCraft Studio",
      locale: "en_GB",
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

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
