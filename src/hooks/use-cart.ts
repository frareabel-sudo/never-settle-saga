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
    removeLine: cartStore.removeLine.bind(cartStore),
    updateLineQuantity: cartStore.updateLineQuantity.bind(cartStore),
    lineKey: cartStore.lineKey,
    unitPrice: cartStore.unitPrice,
  };
}
