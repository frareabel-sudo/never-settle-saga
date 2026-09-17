"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion-wrapper";
import type { BlogPost } from "@/lib/blog";

export function BlogClient({ posts }: { posts: BlogPost[] }) {
  const blogCategories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  const featured = posts[0];

  if (posts.length === 0) {
    return (
      <section className="py-24 bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-ink-muted">No posts yet — check back soon.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Categories */}
      <section className="bg-surface-strip border-b border-surface-line/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {blogCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-brand-500 text-white font-medium"
                    : "bg-surface-card/50 text-ink-muted hover:text-foreground hover:bg-surface-card"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {activeCategory === "All" && featured && (
        <section className="py-12 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <Link href={`/blog/${featured.slug}`}>
                <div className="group grid grid-cols-1 lg:grid-cols-2 gap-8 bg-surface-card/30 rounded-lg border border-surface-line/20 overflow-hidden hover:border-brand-500/20 transition-colors">
                  <div className="relative aspect-[16/10] lg:aspect-auto">
                    {featured.image && (
                      <Image
                        src={featured.image}
                        alt={featured.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <Badge className="w-fit mb-4">{featured.category}</Badge>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3 group-hover:text-brand-600 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-ink-muted leading-relaxed mb-4">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-ink-soft">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> {featured.author}
                      </span>
                      <span>{featured.date.slice(0, 10)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {featured.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </FadeIn>
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="py-12 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeCategory === "All" ? filtered.slice(1) : filtered).map(
              (post) => (
                <StaggerItem key={post.id}>
                  <Link href={`/blog/${post.slug}`}>
                    <article className="group bg-surface-card/30 rounded-lg border border-surface-line/20 overflow-hidden hover:border-brand-500/20 transition-all h-full flex flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {post.image && (
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <Badge className="w-fit mb-3">{post.category}</Badge>
                        <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-ink-muted leading-relaxed flex-1 line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-ink-soft pt-3 border-t border-surface-line/20">
                          <span>{post.date.slice(0, 10)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {post.readTime}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </StaggerItem>
              )
            )}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
}
