import { unstable_cache } from "next/cache";
import { getContainer } from "./cosmos";

export interface BlogPost {
  id: string;
  partitionKey: "blog";
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// v3.33.5 — Cosmos-backed blog posts. Tag "blogs" is busted by CC on every
// post mutation so changes surface within seconds. Falls back to empty list
// if Cosmos is unreachable so the Journal page never 500s.
async function fetchPostsFromCosmos(): Promise<BlogPost[]> {
  try {
    const container = await getContainer("blogs");
    const { resources } = await container.items
      .query<BlogPost>(
        "SELECT * FROM c WHERE c.partitionKey = 'blog' AND c.published = true ORDER BY c.date DESC",
      )
      .fetchAll();
    return resources;
  } catch (err) {
    console.error("[blog] fetch failed:", err);
    return [];
  }
}

export const getBlogPosts = unstable_cache(fetchPostsFromCosmos, ["nss-blog-posts-v1"], {
  revalidate: 60,
  tags: ["blogs"],
});

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}
