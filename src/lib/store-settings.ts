import { getContainer } from "./cosmos";

export interface ShippingRate {
  id: string;
  label: string;
  priceGBP: number;
  etaMinDays: number;
  etaMaxDays: number;
  enabled: boolean;
}

export interface StoreSettings {
  id: "store";
  partitionKey: "setting";
  shipping: {
    rates: ShippingRate[];
    freeShippingThresholdGBP: number; // 0 = disabled
    freeShippingMethod: string; // rate.id that becomes free above threshold
  };
  updatedAt: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: "store",
  partitionKey: "setting",
  shipping: {
    rates: [
      { id: "tracked48", label: "Royal Mail Tracked 48", priceGBP: 4.99, etaMinDays: 2, etaMaxDays: 3, enabled: true },
      { id: "tracked24", label: "Royal Mail Tracked 24", priceGBP: 6.99, etaMinDays: 1, etaMaxDays: 2, enabled: true },
    ],
    freeShippingThresholdGBP: 0,
    freeShippingMethod: "tracked48",
  },
  updatedAt: new Date(0).toISOString(),
};

let cache: { at: number; value: StoreSettings } | null = null;
const CACHE_TTL_MS = 60_000;

export async function getStoreSettings(opts?: { bypassCache?: boolean }): Promise<StoreSettings> {
  if (!opts?.bypassCache && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.value;
  }
  try {
    const c = await getContainer("settings");
    const { resource } = await c.item("store", "setting").read<StoreSettings>();
    if (resource) {
      const merged = mergeWithDefaults(resource);
      cache = { at: Date.now(), value: merged };
      return merged;
    }
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code !== 404) console.error("[store-settings] read failed:", err);
  }
  cache = { at: Date.now(), value: DEFAULT_STORE_SETTINGS };
  return DEFAULT_STORE_SETTINGS;
}

export async function saveStoreSettings(next: Partial<StoreSettings>): Promise<StoreSettings> {
  const c = await getContainer("settings");
  const current = await getStoreSettings({ bypassCache: true });
  const updated: StoreSettings = {
    ...current,
    ...next,
    id: "store",
    partitionKey: "setting",
    shipping: { ...current.shipping, ...(next.shipping || {}) },
    updatedAt: new Date().toISOString(),
  };
  await c.items.upsert(updated);
  cache = { at: Date.now(), value: updated };
  return updated;
}

function mergeWithDefaults(raw: StoreSettings): StoreSettings {
  return {
    ...DEFAULT_STORE_SETTINGS,
    ...raw,
    shipping: { ...DEFAULT_STORE_SETTINGS.shipping, ...(raw.shipping || {}) },
  };
}
