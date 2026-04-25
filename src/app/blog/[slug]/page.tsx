import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion-wrapper";
import { getBlogPostBySlug } from "@/lib/blog";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-charcoal-600 border-b border-charcoal-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/blog" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Blog
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground line-clamp-1">{post.title}</span>
          </div>
        </div>
      </div>

      <article className="py-12 bg-charcoal-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Badge className="mb-4">{post.category}</Badge>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" /> {post.author}
              </span>
              <span>{post.date.slice(0, 10)}</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {post.readTime} read
              </span>
            </div>
          </FadeIn>

          {post.image && (
            <FadeIn delay={0.2}>
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-10">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </FadeIn>
          )}

          <FadeIn delay={0.3}>
            <div className="prose prose-invert prose-amber max-w-none">
              {post.excerpt && (
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {post.excerpt}
                </p>
              )}
              {post.body ? (
                <div
                  className="text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.body }}
                />
              ) : (
                <p className="text-gray-500 italic">Full post coming soon.</p>
              )}
            </div>
          </FadeIn>

          {/* Back link */}
          <FadeIn delay={0.4}>
            <div className="mt-12 pt-8 border-t border-charcoal-50/20">
              <Link href="/blog">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Journal
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </article>
    </>
  );
}
