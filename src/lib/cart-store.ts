"use client";

import { Product, ProductVariant } from "./data";

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

function unitPrice(item: CartItem): number {
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
      (sum, item) => sum + unitPrice(item) * item.quantity,
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
  unitPrice,
};
