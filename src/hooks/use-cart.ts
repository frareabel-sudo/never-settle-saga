"use client";

import { useSyncExternalStore } from "react";
import { cartStore, type CartItem } from "@/lib/cart-store";

// The server always renders an empty cart (it can't see localStorage), so the
// hydration snapshot must be empty too — returning the stored items here made
// React throw hydration errors #418/#423 on /cart whenever the cart had items.
// Must be a stable reference, or useSyncExternalStore loops.
const EMPTY_CART: CartItem[] = [];
const emptyCart = () => EMPTY_CART;

export function useCart() {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getItems,
    emptyCart
  );
  const count = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getCount,
    () => 0
  );
  const total = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getTotal,
    () => 0
  );

  return {
    items,
    count,
    total,
    addItem: cartStore.addItem.bind(cartStore),
    removeLine: cartStore.removeLine.bind(cartStore),
    updateLineQuantity: cartStore.updateLineQuantity.bind(cartStore),
    lineKey: cartStore.lineKey,
    unitPrice: cartStore.unitPrice,
  };
}
