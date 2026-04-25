import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getStoreSettings, DEFAULT_CONTACT_SETTINGS } from "@/lib/store-settings";

// Tag-based ISR. CC fires `/api/revalidate` with tag="contact" on save so the
// website surfaces address/social changes within seconds rather than waiting
// on the 60s window.
const getCached = unstable_cache(
  async () => {
    const s = await getStoreSettings();
    return s.contact;
  },
  ["nss-contact-v1"],
  { revalidate: 60, tags: ["contact"] },
);

export async function GET() {
  try {
    const contact = await getCached();
    return NextResponse.json({ success: true, contact });
  } catch {
    return NextResponse.json({ success: true, contact: DEFAULT_CONTACT_SETTINGS });
  }
}
