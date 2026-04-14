"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Eye, Star, Bell } from "lucide-react";
import { Product } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/use-cart";
interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const isComingSoon = product.status === "coming-soon";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative bg-charcoal-300 rounded-lg overflow-hidden border border-charcoal-50/30 hover:border-amber-500/30 transition-all duration-500"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className={`object-cover group-hover:scale-105 transition-transform duration-700 ${isComingSoon ? "opacity-70" : ""}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-700/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isComingSoon ? (
            <Badge variant="amber">Coming Soon</Badge>
          ) : (
            <>
              <Badge variant="default">Available</Badge>
              {product.badge && <Badge variant="amber">{product.badge}</Badge>}
            </>
          )}
        </div>

        {/* Quick actions overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex gap-2">
            {isComingSoon ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-2 bg-charcoal-700/80 backdrop-blur-sm border-amber-500/40 text-amber-300"
                onClick={(e) => {
                  e.preventDefault();
                  const email = prompt("Enter your email to be notified when this launches:");
                  if (email) {
                    window.location.href = `mailto:helpdesk@neversettlesaga.com?subject=Notify Me: ${product.name}&body=Please notify me at ${email} when ${product.name} becomes available.`;
                  }
                }}
              >
                <Bell className="w-4 h-4" />
                Notify Me
              </Button>
            ) : product.variants && product.variants.length > 0 ? (
              <Link href={`/shop/${product.slug}`} className="flex-1">
                <Button size="sm" className="w-full gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Choose options
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  addItem(product);
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </Button>
            )}
            <Link href={`/shop/${product.slug}`}>
              <Button size="sm" variant="outline" className="gap-2">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-amber-500/70 uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-display font-semibold text-foreground group-hover:text-amber-300 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {isComingSoon ? (
              <span className="font-display font-bold text-amber-400/60 text-lg">
                {formatPrice(product.price)}
              </span>
            ) : (
              <>
                <span className="font-display font-bold text-amber-400 text-lg">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </>
            )}
          </div>
          {product.reviews > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{product.rating}</span>
              <span>({product.reviews})</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
