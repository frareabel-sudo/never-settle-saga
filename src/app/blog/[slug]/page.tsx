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
      <div className="bg-surface-strip border-b border-surface-line/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <Link href="/blog" className="hover:text-brand-500 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Blog
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground line-clamp-1">{post.title}</span>
          </div>
        </div>
      </div>

      <article className="py-12 bg-surface-alt">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <Badge className="mb-4">{post.category}</Badge>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-ink-muted mb-8">
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
                <p className="text-lg text-ink-muted leading-relaxed mb-6">
                  {post.excerpt}
                </p>
              )}
              {post.body ? (
                <div
                  className="text-ink-muted leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.body }}
                />
              ) : (
                <p className="text-ink-soft italic">Full post coming soon.</p>
              )}
            </div>
          </FadeIn>

          {/* Back link */}
          <FadeIn delay={0.4}>
            <div className="mt-12 pt-8 border-t border-surface-line/20">
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
