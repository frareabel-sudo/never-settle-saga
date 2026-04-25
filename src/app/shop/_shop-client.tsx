"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { FadeIn } from "@/components/motion-wrapper";
import { type Product } from "@/lib/data";

export default function ShopClient({
  products,
  categories,
}: {
  products: Product[];
  categories: string[];
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
    }
    return result;
  }, [products, activeCategory, searchQuery, sortBy]);

  return (
    <>
      {/* Header */}
      <section className="pt-24 lg:pt-28 pb-8 bg-charcoal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              The <span className="text-gradient">Collection</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Every piece handcrafted in our London workshop. Browse our full range of
              lithophane lamps, engraved gifts, and 3D printed creations.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 lg:top-20 z-30 bg-charcoal-600/95 backdrop-blur-md border-b border-charcoal-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
              {categories.map((cat) => (
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

            <div className="flex gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-10 px-3 rounded border border-charcoal-50 bg-charcoal-200 text-sm text-foreground focus:border-amber-500/50 focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 bg-charcoal-900 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 mb-6">
            {filtered.length} product{filtered.length !== 1 && "s"}
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-2">No products yet</p>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                We&apos;re busy crafting our collection. Check back soon or get in touch to discuss a custom order.
              </p>
              <div className="flex gap-3 justify-center">
                {(activeCategory !== "All" || searchQuery) && (
                  <Button variant="outline" onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}>
                    Clear Filters
                  </Button>
                )}
                <a href="/contact">
                  <Button variant="outline">Contact Us</Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
