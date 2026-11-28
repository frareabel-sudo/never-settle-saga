"use client";

import { Product, ProductVariant } from "./data";
import { promoFor } from "./pricing";

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  customisation?: string;
}

type Listener = () => void;

const STORAGE_KEY = "nss-cart-v1";
let cartItems: CartItem[] = [];
let hydrated = false;
const listeners: Set<Listener> = new Set();
let storageHandler: ((e: StorageEvent) => void) | null = null;

function loadFromStorage() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) cartItems = parsed as CartItem[];
  } catch {
    // Corrupted localStorage — start with empty cart.
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  } catch {
    // Quota exceeded or storage disabled — non-fatal.
  }
}

function notify() {
  persist();
  listeners.forEach((l) => l());
}

function lineKey(item: CartItem): string {
  return `${item.product.id}::${item.variant?.id ?? "BASE"}::${item.customisation ?? "NONE"}`;
}

/**
 * Quantity of this product+variant across ALL cart lines. Lines differ only by
 * personalisation text, and the checkout merges them before choosing the
 * quantity-break tier — so three mugs with three names count as 3.
 */
function groupQuantity(item: CartItem, items: CartItem[] = cartItems): number {
  const vid = item.variant?.id ?? "";
  return items
    .filter((i) => i.product.id === item.product.id && (i.variant?.id ?? "") === vid)
    .reduce((sum, i) => sum + i.quantity, 0);
}

/** Unit price the checkout will charge — includes quantity-break promotions. */
export function cartUnitPrice(item: CartItem): number {
  loadFromStorage();
  const promo = promoFor(item.product.promotions, item.variant?.id, groupQuantity(item));
  return promo ? promo.price : (item.variant?.price ?? item.product.price);
}

/** Total units of this line's product+variant in the cart (all lines). */
export function cartGroupQuantity(item: CartItem): number {
  loadFromStorage();
  return groupQuantity(item);
}

/** List price before any quantity break, for showing a strikethrough. */
export function cartListPrice(item: CartItem): number {
  return item.variant?.price ?? item.product.price;
}

export const cartStore = {
  getItems(): CartItem[] {
    loadFromStorage();
    return cartItems;
  },

  getCount(): number {
    loadFromStorage();
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  },

  getTotal(): number {
    loadFromStorage();
    return cartItems.reduce(
      (sum, item) => sum + cartUnitPrice(item) * item.quantity,
      0
    );
  },

  clear() {
    cartItems = [];
    notify();
  },

  addItem(product: Product, opts?: { variant?: ProductVariant; customisation?: string }) {
    loadFromStorage();
    const candidate: CartItem = {
      product,
      quantity: 1,
      variant: opts?.variant,
      customisation: opts?.customisation,
    };
    const key = lineKey(candidate);
    const existing = cartItems.find((item) => lineKey(item) === key);
    if (existing) {
      existing.quantity += 1;
    } else {
      cartItems = [...cartItems, candidate];
    }
    notify();
  },

  /**
   * Replace each line's product/variant snapshot with the current storefront
   * version. Lines whose product or variant is no longer for sale are removed.
   * Returns what changed so the cart can tell the shopper.
   */
  refresh(current: Product[]): { removed: string[]; repriced: string[] } {
    loadFromStorage();
    const byId = new Map(current.map((p) => [p.id, p]));
    const removed: string[] = [];
    const repriced: string[] = [];
    const next: CartItem[] = [];
    for (const item of cartItems) {
      const fresh = byId.get(item.product.id);
      const freshVariant = item.variant
        ? fresh?.variants?.find((v) => v.id === item.variant!.id && v.active && v.publishToWebsite !== false)
        : undefined;
      if (!fresh || (item.variant && !freshVariant)) {
        removed.push(item.product.name);
        continue;
      }
      const before = item.variant?.price ?? item.product.price;
      const after = freshVariant?.price ?? fresh.price;
      if (before !== after) repriced.push(fresh.name);
      next.push({ ...item, product: fresh, variant: freshVariant });
    }
    cartItems = next;
    notify();
    // One mention per product, however many personalised lines it has.
    return { removed: Array.from(new Set(removed)), repriced: Array.from(new Set(repriced)) };
  },

  removeLine(key: string) {
    cartItems = cartItems.filter((item) => lineKey(item) !== key);
    notify();
  },

  updateLineQuantity(key: string, quantity: number) {
    if (quantity <= 0) {
      this.removeLine(key);
      return;
    }
    cartItems = cartItems.map((item) =>
      lineKey(item) === key ? { ...item, quantity } : item
    );
    notify();
  },

  subscribe(listener: Listener): () => void {
    loadFromStorage();
    // Attach the cross-tab storage listener exactly once on first subscriber,
    // and tear it down when the last subscriber unsubscribes — otherwise
    // every component mount in dev/HMR added a fresh listener forever.
    if (typeof window !== "undefined" && listeners.size === 0 && !storageHandler) {
      storageHandler = (e: StorageEvent) => {
        if (e.key !== STORAGE_KEY || e.newValue == null) return;
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            cartItems = parsed as CartItem[];
            listeners.forEach((l) => l());
          }
        } catch { /* ignore */ }
      };
      window.addEventListener("storage", storageHandler);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined" && storageHandler) {
        window.removeEventListener("storage", storageHandler);
        storageHandler = null;
      }
    };
  },

  lineKey,
  unitPrice: cartUnitPrice,
};
