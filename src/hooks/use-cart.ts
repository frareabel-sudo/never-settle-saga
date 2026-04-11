"use client";

import { useSyncExternalStore } from "react";
import { cartStore } from "@/lib/cart-store";

export function useCart() {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getItems,
    cartStore.getItems
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
    removeItem: cartStore.removeItem.bind(cartStore),
    updateQuantity: cartStore.updateQuantity.bind(cartStore),
  };
}
