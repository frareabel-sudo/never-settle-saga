/**
 * Customer-supplied artwork, collected over WhatsApp.
 *
 * There is no upload on the site yet. Instead the customer is handed a
 * click-to-chat link with their order number already written, and attaches the
 * photo themselves. The site never touches the image.
 *
 * Trade-off, accepted deliberately at launch: some customers will pay and never
 * send anything, so orders have to be chased. An upload at checkout is what
 * removes the chasing, and is worth building once that chasing becomes a job
 * rather than a nuisance.
 *
 * Which products count is declared HERE rather than in the Command Centre —
 * the same lesson as the category nesting: a feature that waits on the operator
 * typing something in another app is a feature that does not ship.
 */

function norm(s: string | undefined | null): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Matched case-insensitively against the product name. */
const PERSONALISABLE_KEYWORDS = ["mug", "tumbler", "photo frame", "lithophane"];

/** Exact product slugs, for anything the keywords miss. */
const PERSONALISABLE_SLUGS: string[] = [];

/** Category names whose products all take a customer photo. */
const PERSONALISABLE_CATEGORIES = ["mugs", "photo gifts"];

/**
 * Corporate / wholesale lines, sold in fixed quantity tiers.
 *
 * These are a different promise from a photo mug: the customer buys "20 units"
 * as a product (the tiers are variants, each with its own price and stock, so
 * the minimum enforces itself), and afterwards sends a logo or wording rather
 * than a family photo. Same WhatsApp mechanism, different words.
 */
const CORPORATE_CATEGORIES = [
  "corporate gifts",
  "brindes corporativos",
  "wholesale",
  "bulk",
];
const CORPORATE_KEYWORDS = ["corporate", "wholesale", "bulk order", "brinde"];

export function isCorporate(product: {
  name?: string;
  category?: string;
  categories?: string[];
}): boolean {
  const name = norm(product.name);
  if (CORPORATE_KEYWORDS.some((k) => name.includes(k))) return true;
  const cats = [
    ...(product.categories ?? []),
    ...(product.category ? [product.category] : []),
  ].map(norm);
  return cats.some((c) => CORPORATE_CATEGORIES.includes(c));
}

/** True when any line on the order is a corporate/bulk item. */
export function orderNeedsBriefing(items: Array<{ name?: string }>): boolean {
  return items.some((it) => isCorporate({ name: it.name }));
}

export function isPersonalisable(product: {
  name?: string;
  slug?: string;
  category?: string;
  categories?: string[];
}): boolean {
  const name = norm(product.name);
  if (PERSONALISABLE_KEYWORDS.some((k) => name.includes(k))) return true;
  if (product.slug && PERSONALISABLE_SLUGS.includes(norm(product.slug))) return true;

  const cats = [
    ...(product.categories ?? []),
    ...(product.category ? [product.category] : []),
  ].map(norm);
  return cats.some((c) => PERSONALISABLE_CATEGORIES.includes(c));
}

/** True when any line on the order needs a photo from the customer. */
export function orderNeedsPhoto(items: Array<{ name?: string }>): boolean {
  return items.some((it) => isPersonalisable({ name: it.name }));
}

/**
 * `+44 7909 729599` -> `447909729599`.
 * wa.me wants digits only, no plus, no spaces.
 */
export function waNumber(raw: string | undefined | null): string {
  return (raw || "").replace(/\D/g, "");
}

/** A wa.me link that opens the shop's chat with `message` already typed. */
export function whatsAppLink(rawNumber: string | undefined | null, message: string): string | null {
  const digits = waNumber(rawNumber);
  if (digits.length < 8) return null; // no usable number configured
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * The instructions, written once so the email and the product page cannot
 * drift apart.
 *
 * The "send as a file" line is the important one: WhatsApp re-compresses
 * anything sent as a Photo, which looks fine on a phone and prints badly on a
 * mug. Sending as a Document keeps the original.
 */
export const PHOTO_GUIDANCE = {
  heading: "Send us your photo on WhatsApp",
  /** The one that stops blurry prints. */
  sendAsFile:
    "Send it as a FILE, not as a photo — in WhatsApp tap the paperclip, choose Document, then pick your image. Sending it as a photo squashes it and it will print blurry.",
  quality:
    "Use the original photo straight from your camera roll. Please avoid screenshots and pictures saved from social media — they are too small to print well.",
  minimum: "Ideally at least 1500 × 1500 pixels.",
} as const;

/**
 * Corporate equivalent of PHOTO_GUIDANCE.
 *
 * Mirrors the two lines every good corporate-gift listing opens with: what can
 * be personalised, and that the details are agreed after the order rather than
 * squeezed into a checkout field. Written once here so every product in the
 * category says the same thing without the operator retyping it.
 */
export const CORPORATE_GUIDANCE = {
  heading: "Make it yours",
  what: "This product can be personalised with a name, a phrase or your logo.",
  after:
    "Once your order is placed, message us on WhatsApp with your order number and we'll make it exactly as you want it.",
  artwork:
    "For a logo, send the highest-quality file you have — a PNG with a transparent background or a vector (SVG, PDF, AI) prints best. Send it as a FILE, not as a photo.",
  quantities:
    "Sold in fixed quantities. Pick the tier that suits you — the larger the run, the lower the unit price.",
} as const;
