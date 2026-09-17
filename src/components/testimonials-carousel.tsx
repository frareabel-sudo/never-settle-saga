"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Testimonial } from "@/lib/data";

interface Props {
  reviews: Testimonial[];
  autoRotateMs?: number;
}

export function TestimonialsCarousel({ reviews, autoRotateMs = 6000 }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = reviews.length;

  useEffect(() => {
    if (total <= 1 || paused) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, autoRotateMs);
    return () => clearInterval(t);
  }, [total, paused, autoRotateMs]);

  if (total === 0) return null;

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  const current = reviews[index];

  return (
    <div
      className="relative max-w-3xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[260px] md:min-h-[220px] flex items-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full p-8 md:p-10 rounded-2xl bg-surface-alt/40 border border-surface-line/10 hover:border-brand-500/15 transition-colors"
          >
            <div className="flex gap-1 mb-5 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < current.rating ? "fill-brand-500 text-brand-500" : "text-white/20"}`}
                />
              ))}
            </div>
            <p className="text-lg md:text-xl text-ink leading-relaxed text-center font-light italic mb-6">
              &ldquo;{current.text}&rdquo;
            </p>
            <div className="text-center">
              <p className="font-semibold text-base">{current.name}</p>
              <p className="text-xs text-ink-soft mt-0.5">
                {current.location}
                {current.location && current.product ? " — " : ""}
                {current.product}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous review"
            className="absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/80 hover:bg-surface-alt border border-surface-line/15 hover:border-brand-500/40 flex items-center justify-center text-ink-muted hover:text-brand-500 transition-all backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next review"
            className="absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/80 hover:bg-surface-alt border border-surface-line/15 hover:border-brand-500/40 flex items-center justify-center text-ink-muted hover:text-brand-500 transition-all backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show review ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "bg-brand-500 w-8" : "bg-surface-line/20 hover:bg-surface-line/40 w-1.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
