import { unstable_cache } from "next/cache";
import { getStripe } from "@/lib/stripe";

export type ProductStatus = "available" | "coming-soon";

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  stripePriceId: string;
  sku?: string;
  optionValues: Record<string, string>;
  price: number;
  active: boolean;
  primary: boolean;
}

export interface Product {
  id: string;
  stripePriceId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  longDescription: string;
  images: string[];
  features: string[];
  customisable: boolean;
  customOptions?: string[];
  rating: number;
  reviews: number;
  badge?: string;
  status: ProductStatus;
  options?: ProductOption[];
  variants?: ProductVariant[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  image: string;
  date: string;
  readTime: string;
  author: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
  product: string;
}

export const categories = [
  "All",
  "3D FDM Printing",
  "Resin Printing",
  "Lithophane Lamps",
  "Miniatures",
  "Kit Party",
  "Agendas & Planners",
] as const;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function safeJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === "string");
    }
    return [];
  } catch {
    return [];
  }
}

function safeJsonStringArray(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const arr = parsed.filter((v): v is string => typeof v === "string");
      return arr.length > 0 ? arr : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function buildVariantsFromPrices(
  stripe: ReturnType<typeof getStripe>,
  productId: string,
  defaultPriceId: string,
): Promise<{ options?: ProductOption[]; variants?: ProductVariant[] }> {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });

  // Only treat as variants if at least one price has an option_ metadata key.
  const variantPrices = prices.data.filter((p) =>
    Object.keys(p.metadata ?? {}).some((k) => k.startsWith("opt_"))
  );
  if (variantPrices.length === 0) return {};

  const optionMap = new Map<string, Set<string>>();
  const variants: ProductVariant[] = [];

  for (const price of variantPrices) {
    if (price.unit_amount == null) continue;
    const meta = price.metadata ?? {};
    const optionValues: Record<string, string> = {};
    for (const [key, value] of Object.entries(meta)) {
      if (!key.startsWith("opt_")) continue;
      const optName = key.slice(4);
      optionValues[optName] = value;
      if (!optionMap.has(optName)) optionMap.set(optName, new Set());
      optionMap.get(optName)!.add(value);
    }
    variants.push({
      id: meta.variantId || price.id,
      stripePriceId: price.id,
      sku: meta.sku || undefined,
      optionValues,
      price: price.unit_amount / 100,
      active: price.active,
      primary: price.id === defaultPriceId,
    });
  }

  const options: ProductOption[] = Array.from(optionMap.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }));

  return { options, variants };
}

async function fetchProductsFromStripe(): Promise<Product[]> {
  const stripe = getStripe();
  const list = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
    limit: 100,
  });

  const products: Product[] = [];
  for (const sp of list.data) {
    const defaultPrice = sp.default_price;
    if (
      !defaultPrice ||
      typeof defaultPrice === "string" ||
      defaultPrice.unit_amount == null
    ) {
      continue;
    }

    const meta = sp.metadata ?? {};
    const name = sp.name ?? "Untitled";
    const slug = meta.slug && meta.slug.length > 0 ? meta.slug : slugify(name);
    const description = sp.description ?? "";
    const longDescription = meta.longDescription ?? description;
    const originalPriceRaw = meta.originalPrice;
    const originalPrice =
      originalPriceRaw && !Number.isNaN(Number(originalPriceRaw))
        ? Number(originalPriceRaw)
        : undefined;

    const { options, variants } = await buildVariantsFromPrices(
      stripe,
      sp.id,
      defaultPrice.id,
    );

    products.push({
      id: sp.id,
      stripePriceId: defaultPrice.id,
      name,
      slug,
      price: defaultPrice.unit_amount / 100,
      originalPrice,
      category: meta.category && meta.category.length > 0 ? meta.category : "Uncategorised",
      description,
      longDescription,
      images: Array.isArray(sp.images) ? sp.images : [],
      features: safeJsonArray(meta.features),
      customisable: meta.customisable === "true",
      customOptions: safeJsonStringArray(meta.customOptions),
      rating: Number.isFinite(Number(meta.rating)) ? Number(meta.rating) : 5,
      reviews: Number.isFinite(Number(meta.reviews)) ? Number(meta.reviews) : 0,
      badge: meta.badge && meta.badge.length > 0 ? meta.badge : undefined,
      status: meta.status === "coming-soon" ? "coming-soon" : "available",
      options,
      variants,
    });
  }

  return products;
}

const getCachedProducts = unstable_cache(
  fetchProductsFromStripe,
  ["nss-stripe-products-v1"],
  { revalidate: 60, tags: ["products"] }
);

/**
 * Fetch all active products from Stripe.
 * Cached for 60 seconds via unstable_cache; tag "products" for manual revalidation.
 */
export async function getProducts(): Promise<Product[]> {
  return getCachedProducts();
}

/**
 * Server-side product lookup by Stripe product id. Checkout MUST use this to
 * resolve the Stripe price id — never trust client-supplied price data.
 * Returns null for unknown IDs.
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (typeof id !== "string" || id.length === 0) return null;
  const products = await getProducts();
  return products.find((p) => p.id === id) ?? null;
}

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah M.",
    location: "Manchester",
    text: "The 3D printed piece I ordered was exactly what I needed — perfect fit, great finish, and delivered fast. Abel clearly knows his craft inside and out.",
    rating: 5,
    product: "Custom 3D Printed Object",
  },
  {
    id: "2",
    name: "James K.",
    location: "Edinburgh",
    text: "The resin miniatures for my D&D campaign are incredible. The detail is insane — you can see individual scales on the dragon. Painting them was a joy.",
    rating: 5,
    product: "Custom Gaming Miniature",
  },
  {
    id: "3",
    name: "Priya D.",
    location: "London",
    text: "I've ordered from several personalised gift shops and Never Settle Saga is in a completely different league. The engraved agenda was beautiful and my team loved their branded sets.",
    rating: 5,
    product: "Personalised Laser Engraved Agenda",
  },
  {
    id: "4",
    name: "Tom R.",
    location: "Bristol",
    text: "We booked the kit party for my daughter's birthday and every kid had the best time. Everything was included, the instructions were clear, and the results were amazing.",
    rating: 5,
    product: "DIY Craft Kit",
  },
  {
    id: "5",
    name: "Emily W.",
    location: "Cardiff",
    text: "The resin figurine is a work of art. The detail at that scale is mind-blowing. Already planning my next order — this time painted!",
    rating: 5,
    product: "Resin Figurine",
  },
];

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "What Is a Lithophane? The Ancient Art Meeting Modern Tech",
    slug: "what-is-a-lithophane",
    excerpt: "Discover how a centuries-old technique is being reimagined with 3D printing to create stunning illuminated art pieces.",
    category: "Craft Stories",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
    date: "2026-03-28",
    readTime: "5 min",
    author: "Abel",
  },
  {
    id: "2",
    title: "FDM vs Resin: Which 3D Printing Method Is Right for You?",
    slug: "fdm-vs-resin-printing",
    excerpt: "A practical guide to choosing between FDM and resin printing based on what you need — strength, detail, or cost.",
    category: "Workshop",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=400&fit=crop",
    date: "2026-03-15",
    readTime: "6 min",
    author: "Abel",
  },
  {
    id: "3",
    title: "10 Personalised Gift Ideas That Actually Mean Something",
    slug: "personalised-gift-ideas",
    excerpt: "Forget generic gifts. Here are 10 ideas that show you truly know someone — and put real thought into it.",
    category: "Gift Guides",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238f067?w=600&h=400&fit=crop",
    date: "2026-02-20",
    readTime: "7 min",
    author: "Abel",
  },
  {
    id: "4",
    title: "How to Host the Perfect Craft Party with Our Kits",
    slug: "perfect-craft-party",
    excerpt: "Tips and tricks for throwing a creative party that your guests will actually remember. Spoiler: it's easier than you think.",
    category: "Gift Guides",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&h=400&fit=crop",
    date: "2026-02-05",
    readTime: "5 min",
    author: "Abel",
  },
  {
    id: "5",
    title: "The Rise of Custom Miniatures in Tabletop Gaming",
    slug: "custom-miniatures-tabletop",
    excerpt: "Why more players are choosing custom-printed miniatures over off-the-shelf options — and how resin printing changed the game.",
    category: "Craft Stories",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop",
    date: "2026-01-18",
    readTime: "5 min",
    author: "Abel",
  },
  {
    id: "6",
    title: "From File to Finish: The Journey of a 3D Print",
    slug: "from-file-to-finish",
    excerpt: "Ever wondered what happens after you hit 'order'? Follow a product from digital design to your doorstep.",
    category: "Workshop",
    image: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=600&h=400&fit=crop",
    date: "2026-01-02",
    readTime: "8 min",
    author: "Abel",
  },
];
