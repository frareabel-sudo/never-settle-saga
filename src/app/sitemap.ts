import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";
import { getBlogPosts } from "@/lib/blog";

const SITE = "https://dreamcraftstudio.co.uk";

// Rebuilt from live data (same 60 s cache as the shop), so a product published
// in Command Centre reaches Google without anyone editing a file. Replaces the
// hand-written public/sitemap.xml, which listed 5 pages and no products.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/shipping`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/returns`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ].map((p) => ({ ...p, lastModified: now }) as MetadataRoute.Sitemap[number]);

  let products: MetadataRoute.Sitemap = [];
  try {
    products = (await getProducts())
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${SITE}/shop/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        ...(p.images?.[0] ? { images: [p.images[0]] } : {}),
      }));
  } catch (err) {
    console.error("[sitemap] products unavailable:", err);
  }

  let posts: MetadataRoute.Sitemap = [];
  try {
    posts = (await getBlogPosts()).map((post) => ({
      url: `${SITE}/blog/${post.slug}`,
      lastModified: (() => {
        const d = new Date(post.updatedAt || post.date || "");
        return Number.isFinite(d.getTime()) ? d : now;
      })(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch (err) {
    console.error("[sitemap] blog posts unavailable:", err);
  }

  return [...pages, ...products, ...posts];
}
