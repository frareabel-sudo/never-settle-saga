import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout, PolicyH2, PolicyH3, PolicyList } from "@/components/policy-layout";

export const metadata: Metadata = {
  title: "Shipping Info — Never Settle Saga",
  description:
    "Production timelines, UK and EU shipping costs, and how we handle international orders for handmade NSS products.",
};

const LAST_UPDATED = "1 May 2026";

export default function ShippingPage() {
  return (
    <PolicyLayout
      title="Shipping Info"
      subtitle="Every Never Settle Saga piece is made by hand in our London studio. Here's what to expect when you order."
      lastUpdated={LAST_UPDATED}
    >
      <PolicyH2>Where we ship</PolicyH2>
      <PolicyList>
        <li>
          <strong className="text-white">United Kingdom</strong> — Standard shipping across England, Scotland, Wales, and Northern Ireland.
        </li>
        <li>
          <strong className="text-white">European Union</strong> — We ship to all EU member states.
        </li>
        <li>
          <strong className="text-white">Rest of the world</strong> — We do ship internationally outside the UK and EU, but pricing and delivery options vary significantly by destination. For international orders outside the EU, please contact us at{" "}
          <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
            helpdesk@neversettlesaga.com
          </a>{" "}
          before placing your order so we can confirm shipping costs, customs handling, and estimated delivery time for your specific country.
        </li>
      </PolicyList>

      <PolicyH2>Processing time</PolicyH2>
      <p>
        Every NSS product is made to order. Nothing on our website is mass-produced or held in large stock — each lithophane lamp, miniature, mug, planner, or laser-cut piece is created specifically for you after your order is placed.
      </p>
      <p>
        Because of this, we ask that you get in touch with us before or shortly after placing your order so we can:
      </p>
      <PolicyList>
        <li>Confirm the exact specifications you want (custom images for lithophanes, personalisation, finish options, etc.)</li>
        <li>Give you an accurate production timeline for your specific item</li>
        <li>Flag any details that affect cost or feasibility</li>
      </PolicyList>
      <p>
        You can reach us at{" "}
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
          helpdesk@neversettlesaga.com
        </a>
        .
      </p>

      <PolicyH3>Typical production windows once specifications are confirmed</PolicyH3>
      <PolicyList>
        <li><strong className="text-white">Lithophane lamps</strong> — 7 to 14 business days</li>
        <li><strong className="text-white">Miniatures and 3D-printed items</strong> — 5 to 10 business days</li>
        <li><strong className="text-white">Sublimation mugs, stickers, and planners</strong> — 3 to 7 business days</li>
        <li><strong className="text-white">Custom or complex builds</strong> (e.g. retro TV lamps with electronics) — 2 to 4 weeks</li>
      </PolicyList>
      <p className="text-sm text-gray-400 italic">
        These are guides, not guarantees. We&apos;ll always confirm a realistic timeline with you in writing before we start production.
      </p>

      <PolicyH2>Shipping time (after production)</PolicyH2>
      <p>Once your item is finished, packed, and dispatched:</p>
      <PolicyList>
        <li><strong className="text-white">UK</strong> — typically 2 to 4 business days via Royal Mail Tracked or a courier service</li>
        <li><strong className="text-white">EU</strong> — typically 5 to 10 business days</li>
        <li><strong className="text-white">International (outside EU)</strong> — varies by destination; we&apos;ll confirm when you contact us</li>
      </PolicyList>

      <PolicyH2>Shipping costs</PolicyH2>
      <p>
        Shipping costs for UK and EU orders are calculated at checkout based on the size and weight of your item. UK and EU rates are priced separately — please select the option matching your delivery address.
      </p>
      <p>
        For destinations outside the EU, shipping is quoted individually after we discuss your order.
      </p>

      <PolicyH2>Customs, duties, and taxes</PolicyH2>
      <p>
        For orders shipped outside the UK, the recipient is responsible for any import duties, taxes, or customs fees charged by the destination country. These are not included in the price you pay at checkout, and we have no control over them.
      </p>

      <PolicyH2>Lost or damaged parcels</PolicyH2>
      <p>
        If your parcel arrives damaged, or if tracking shows no movement for an unusually long period, contact us at{" "}
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
          helpdesk@neversettlesaga.com
        </a>{" "}
        with your order number and we&apos;ll investigate with the courier and put things right.
      </p>

      <PolicyH2>Contact</PolicyH2>
      <p className="not-italic">
        <strong className="text-white">Never Settle Saga</strong>
        <br />
        262a Seven Sisters Road, London N4 2HY, United Kingdom
        <br />
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
          helpdesk@neversettlesaga.com
        </a>
      </p>

      <p className="pt-6 text-sm">
        See also: <Link href="/returns" className="text-amber-400 hover:text-amber-300 underline">Returns Policy</Link>{" · "}
        <Link href="/faq" className="text-amber-400 hover:text-amber-300 underline">FAQ</Link>
      </p>
    </PolicyLayout>
  );
}
