"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, User, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion-wrapper";
import { blogPosts } from "@/lib/data";
import { notFound } from "next/navigation";

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = blogPosts.find((p) => p.slug === params.slug);
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
              <span>{post.date}</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {post.readTime} read
              </span>
            </div>
          </FadeIn>

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

          <FadeIn delay={0.3}>
            <div className="prose prose-invert prose-amber max-w-none">
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                {post.excerpt}
              </p>
              <p className="text-gray-400 leading-relaxed mb-6">
                This is a placeholder for the full blog post content. In a production
                environment, this would be fetched from a CMS like Sanity, Contentful,
                or stored as MDX files. The content would include rich text, images,
                embedded videos, and more.
              </p>
              <h2 className="font-display text-2xl font-bold text-foreground mt-10 mb-4">
                The Craft Behind the Story
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Every product we create carries a story — not just the one you
                commission, but the one written in every layer of filament, every
                pass of the laser, every careful hand-finish. Understanding the
                process helps you appreciate why these creations are different
                from anything you&apos;ll find mass-produced.
              </p>
              <p className="text-gray-400 leading-relaxed mb-6">
                We invite you to explore our workshop process, learn about the
                materials we carefully select, and discover why &quot;never settling&quot;
                isn&apos;t just a name — it&apos;s a promise we make with every order.
              </p>
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
