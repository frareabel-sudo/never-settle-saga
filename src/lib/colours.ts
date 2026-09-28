/**
 * Colour-name → swatch resolution for variant pickers.
 *
 * Variant options arrive from Stripe price metadata as free text (`opt_Colour=Baby Pink`),
 * so there is no hex anywhere in the data model. This module maps the names we
 * actually sell against to colours, and returns `null` for anything it does not
 * recognise so the caller can fall back to a plain text pill.
 *
 * To add a colour: add the lower-case name to `SWATCHES`. Matching ignores case,
 * spaces, hyphens and underscores, so "Baby Pink", "baby-pink" and "babypink"
 * all hit the same entry.
 */

import type { CSSProperties } from "react";

export type Swatch =
  | { kind: "solid"; hex: string }
  | { kind: "duo"; hex: string; hex2: string }
  | { kind: "multi" };

const SWATCHES: Record<string, string> = {
  // neutrals
  white: "#FFFFFF",
  offwhite: "#F7F4EF",
  ivory: "#FFFFF0",
  cream: "#FDF6E3",
  beige: "#E8DCC8",
  natural: "#D9C7A7",
  tan: "#D2B48C",
  sand: "#E3D5B8",
  taupe: "#B3A394",
  grey: "#9CA3AF",
  gray: "#9CA3AF",
  lightgrey: "#D1D5DB",
  lightgray: "#D1D5DB",
  darkgrey: "#4B5563",
  darkgray: "#4B5563",
  charcoal: "#36393D",
  black: "#151515",
  silver: "#C0C0C0",
  gold: "#D4AF37",
  rosegold: "#B76E79",
  bronze: "#CD7F32",
  copper: "#B87333",
  clear: "#E8F0F2",
  transparent: "#E8F0F2",

  // pinks / reds
  pink: "#FFC0CB",
  babypink: "#F8D7DD",
  pastelpink: "#FADADD",
  lightpink: "#FFD1DC",
  blush: "#DE9FA6",
  hotpink: "#FF69B4",
  fuchsia: "#FF4FA3",
  magenta: "#D6247D",
  rose: "#E3606F",
  coral: "#FF7F50",
  salmon: "#FA8072",
  red: "#D62828",
  darkred: "#8B1A1A",
  burgundy: "#6E1423",
  maroon: "#7B2D3B",
  wine: "#722F37",

  // oranges / yellows
  orange: "#F27A21",
  peach: "#FFCBA4",
  apricot: "#F6B26B",
  terracotta: "#9C4221",
  rust: "#A8431E",
  yellow: "#FBC02D",
  mustard: "#D4A017",
  lemon: "#F6EB61",
  butter: "#F5E6A8",

  // greens
  green: "#3E8E5A",
  lightgreen: "#8BC98B",
  darkgreen: "#1F5233",
  mint: "#AEE6CE",
  sage: "#A3B18A",
  olive: "#6B7A3A",
  forest: "#25482F",
  emerald: "#2E8B57",
  lime: "#9FD356",
  khaki: "#B9A66B",

  // blues / purples
  blue: "#2F6FB5",
  babyblue: "#BEE0F1",
  lightblue: "#A8D4EF",
  skyblue: "#87CEEB",
  powderblue: "#B0E0E6",
  royalblue: "#2B4EA2",
  navy: "#1B2A4A",
  darkblue: "#1E3A6E",
  denim: "#3F5E80",
  teal: "#2A8C89",
  turquoise: "#40C4C0",
  aqua: "#7FD8D4",
  purple: "#6B4C9A",
  lilac: "#C8A8DC",
  lavender: "#CBB9E8",
  violet: "#8B5CC7",
  plum: "#6E3B63",
  mauve: "#B08BA5",

  // browns
  brown: "#795548",
  chocolate: "#5C3A21",
  coffee: "#6F4E37",
  caramel: "#AF6E4D",
  walnut: "#5B4232",
  oak: "#C4A484",
  wood: "#C4A484",
};

/** Names that mean "many colours at once" rather than one hue. */
const MULTI = new Set([
  "multi",
  "multicolour",
  "multicolor",
  "rainbow",
  "assorted",
  "mixed",
  "variety",
  "pastel",
  "pastels",
]);

function normalise(value: string): string {
  return value.toLowerCase().replace(/[\s\-_]/g, "");
}

/**
 * True when an option is about colour and should render as swatches.
 * Matches "Colour", "Color", "Frame Colour", "Cor", etc.
 */
export function isColourOption(optionName: string): boolean {
  return /colou?r|\bcor\b/i.test(optionName);
}

/**
 * Resolve one option value to a swatch, or `null` when the name is unknown.
 *
 * Two-tone values are supported with `/`, `&` or "and" between two known
 * colours — "Pink/White", "Black & Gold" — and render as a split square.
 */
export function resolveSwatch(value: string): Swatch | null {
  const key = normalise(value);
  if (!key) return null;

  if (MULTI.has(key)) return { kind: "multi" };

  const solid = SWATCHES[key];
  if (solid) return { kind: "solid", hex: solid };

  const parts = value.split(/\s*(?:\/|&|\+|\band\b)\s*/i).filter(Boolean);
  if (parts.length === 2) {
    const a = SWATCHES[normalise(parts[0])];
    const b = SWATCHES[normalise(parts[1])];
    if (a && b) return { kind: "duo", hex: a, hex2: b };
  }

  return null;
}

/**
 * Swatches are all-or-nothing per option: one unrecognised name and the whole
 * option falls back to text pills, because a row mixing squares and words reads
 * as broken rather than as a deliberate mix.
 */
export function canRenderSwatches(optionName: string, values: string[]): boolean {
  if (!isColourOption(optionName)) return false;
  if (values.length === 0) return false;
  return values.every((v) => resolveSwatch(v) !== null);
}

/** Inline style for a swatch face. */
export function swatchStyle(swatch: Swatch): CSSProperties {
  switch (swatch.kind) {
    case "solid":
      return { backgroundColor: swatch.hex };
    case "duo":
      return {
        backgroundImage: `linear-gradient(135deg, ${swatch.hex} 0%, ${swatch.hex} 50%, ${swatch.hex2} 50%, ${swatch.hex2} 100%)`,
      };
    case "multi":
      return {
        backgroundImage:
          "conic-gradient(#E3606F, #F27A21, #FBC02D, #3E8E5A, #2F6FB5, #6B4C9A, #E3606F)",
      };
  }
}
