"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion-wrapper";
import { blogPosts } from "@/lib/data";

const blogCategories = ["All", ...Array.from(new Set(blogPosts.map((p) => p.category)))];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((p) => p.category === activeCategory);

  const featured = blogPosts[0];

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

      {/* Categories */}
      <section className="bg-charcoal-600 border-b border-charcoal-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {blogCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-amber-500 text-charcoal-900 font-medium"
                    : "bg-charcoal-300/50 text-gray-400 hover:text-foreground hover:bg-charcoal-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {activeCategory === "All" && (
        <section className="py-12 bg-charcoal-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <Link href={`/blog/${featured.slug}`}>
                <div className="group grid grid-cols-1 lg:grid-cols-2 gap-8 bg-charcoal-400/30 rounded-lg border border-charcoal-50/20 overflow-hidden hover:border-amber-500/20 transition-colors">
                  <div className="relative aspect-[16/10] lg:aspect-auto">
                    <Image
                      src={featured.image}
                      alt={featured.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <Badge className="w-fit mb-4">{featured.category}</Badge>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3 group-hover:text-amber-300 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-gray-400 leading-relaxed mb-4">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> {featured.author}
                      </span>
                      <span>{featured.date}</span>
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
      <section className="py-12 bg-charcoal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeCategory === "All" ? filtered.slice(1) : filtered).map(
              (post) => (
                <StaggerItem key={post.id}>
                  <Link href={`/blog/${post.slug}`}>
                    <article className="group bg-charcoal-400/30 rounded-lg border border-charcoal-50/20 overflow-hidden hover:border-amber-500/20 transition-all h-full flex flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <Badge className="w-fit mb-3">{post.category}</Badge>
                        <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-amber-300 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed flex-1 line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-charcoal-50/20">
                          <span>{post.date}</span>
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
