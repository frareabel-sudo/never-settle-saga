"use client";

import { motion } from "framer-motion";

const items = [
  "HANDMADE IN LONDON",
  "PERSONALISED GIFTS",
  "3D PRINTED",
  "LASER ENGRAVED",
  "NEVER SETTLE",
  "FREE UK SHIPPING OVER £50",
];

const separator = " · ";
const text = items.join(separator) + separator;

export function Marquee() {
  return (
    <div className="relative overflow-hidden bg-charcoal-900 border-y border-amber-500/10 py-3">
      <div className="flex whitespace-nowrap">
        <motion.div
          className="flex shrink-0"
          animate={{ x: [0, -50 * text.length] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: text.length * 0.4,
              ease: "linear",
            },
          }}
        >
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="text-sm font-medium tracking-[0.2em] text-amber-500/70 mx-0"
            >
              {text}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
