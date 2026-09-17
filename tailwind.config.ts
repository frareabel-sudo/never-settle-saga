import type { Config } from "tailwindcss";

/**
 * v3.35 — Light "terracotta on cream" theme (direction C2).
 *
 * Tokens are semantic, not literal: `surface` is what you paint behind things,
 * `ink` is what you write with, `brand` is the accent. That way the palette can
 * be retuned later without hunting through 400 class names, and nobody has to
 * remember whether "charcoal-900" is currently dark or light.
 *
 * `amber` and `charcoal` are kept as aliases onto the new tokens so any class
 * that escaped the migration still lands somewhere sane instead of painting
 * black-on-black.
 */

const surface = {
  DEFAULT: "#FDF6F1", // page
  alt: "#F6E9DF", // banded sections
  strip: "#F3E4D8", // trust strip / subtle fills
  card: "#FFFFFF", // product cards
  line: "#EBD9CA", // hairlines and borders
  dark: "#221913", // footer and inverted blocks
};

const ink = {
  DEFAULT: "#2A201B", // headings and body
  muted: "#6B5A4E", // secondary copy
  soft: "#776352", // captions, placeholders (AA on surface.alt)
  inverse: "#FDF6F1", // text on `surface.dark`
};

const brand = {
  50: "#FBF1EC",
  100: "#F4DED2",
  200: "#E7BCA6",
  300: "#D4917A",
  400: "#BC6446",
  500: "#9C4221", // primary terracotta
  600: "#85381B",
  700: "#6C2D15",
  800: "#52220F",
  900: "#3A180A",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface,
        ink,
        brand,
        // Legacy aliases — safety net for anything the migration missed.
        amber: brand,
        charcoal: {
          50: surface.line,
          100: surface.line,
          200: surface.card,
          300: surface.card,
          400: surface.card,
          500: surface.strip,
          600: surface.strip,
          700: surface.alt,
          800: surface.alt,
          900: surface.DEFAULT,
        },
      },
      fontFamily: {
        display: ["var(--font-geist-sans)", "Georgia", "serif"],
        body: ["var(--font-geist-sans)", "Arial", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(156, 66, 33, 0.08)" },
          "100%": { boxShadow: "0 0 40px rgba(156, 66, 33, 0.18)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
