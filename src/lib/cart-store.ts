"use client";

import { Product, ProductVariant } from "./data";

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  customisation?: string;
}

type Listener = () => void;

let cartItems: CartItem[] = [];
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((l) => l());
}

function lineKey(item: CartItem): string {
  return `${item.product.id}::${item.variant?.id ?? ""}::${item.customisation ?? ""}`;
}

function unitPrice(item: CartItem): number {
  return item.variant?.price ?? item.product.price;
}

export const cartStore = {
  getItems(): CartItem[] {
    return cartItems;
  },

  getCount(): number {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  },

  getTotal(): number {
    return cartItems.reduce(
      (sum, item) => sum + unitPrice(item) * item.quantity,
      0
    );
  },

  addItem(product: Product, opts?: { variant?: ProductVariant; customisation?: string }) {
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
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  lineKey,
  unitPrice,
};
