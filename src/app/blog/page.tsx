import { FadeIn } from "@/components/motion-wrapper";
import { getBlogPosts } from "@/lib/blog";
import { BlogClient } from "./_blog-client";

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      {/* Header */}
      <section className="pt-24 lg:pt-28 pb-8 bg-charcoal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              The <span className="text-gradient">Journal</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Stories from the workshop, gift guides, and the craft behind what we make.
            </p>
          </FadeIn>
        </div>
      </section>

      <BlogClient posts={posts} />
    </>
  );
}
