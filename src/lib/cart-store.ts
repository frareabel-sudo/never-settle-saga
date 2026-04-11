"use client";

import { Product } from "./data";

export interface CartItem {
  product: Product;
  quantity: number;
  customisation?: string;
}

type Listener = () => void;

let cartItems: CartItem[] = [];
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((l) => l());
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
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  },

  addItem(product: Product, customisation?: string) {
    const existing = cartItems.find(
      (item) =>
        item.product.id === product.id &&
        item.customisation === customisation
    );
    if (existing) {
      existing.quantity += 1;
    } else {
      cartItems = [...cartItems, { product, quantity: 1, customisation }];
    }
    notify();
  },

  removeItem(productId: string) {
    cartItems = cartItems.filter((item) => item.product.id !== productId);
    notify();
  },

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    cartItems = cartItems.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
