import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout, PolicyH2, PolicyH3, PolicyList } from "@/components/policy-layout";

export const metadata: Metadata = {
  title: "FAQ — Never Settle Saga",
  description:
    "Frequently asked questions about Never Settle Saga products, ordering, shipping, returns, and payment.",
};

const LAST_UPDATED = "1 May 2026";

export default function FAQPage() {
  return (
    <PolicyLayout
      title="Frequently Asked Questions"
      subtitle="Everything you need to know about ordering, shipping, materials, and what to expect from a handmade NSS piece."
      lastUpdated={LAST_UPDATED}
    >
      <PolicyH2>About Never Settle Saga</PolicyH2>

      <PolicyH3>Who makes NSS products?</PolicyH3>
      <p>
        Never Settle Saga is a small independent studio run by Abel and his wife in London. Every product is designed, made, finished, and packed by us in-house — no third-party manufacturing.
      </p>

      <PolicyH3>What does &ldquo;Never Settle Saga&rdquo; mean?</PolicyH3>
      <p>
        It&apos;s the philosophy behind everything we make: don&apos;t settle for generic, mass-produced things. Every NSS piece is built around the idea that the objects you live with should feel made for you.
      </p>

      <PolicyH2>Ordering</PolicyH2>

      <PolicyH3>Are all your products made to order?</PolicyH3>
      <p>
        Yes. Nothing on the site is held in mass stock. When you place an order, we begin production specifically for you. This is why we ask you to contact us at{" "}
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
          helpdesk@neversettlesaga.com
        </a>{" "}
        to confirm specifications before or shortly after ordering.
      </p>

      <PolicyH3>Why do I need to contact you before ordering?</PolicyH3>
      <p>
        Many of our products — especially lithophane lamps, custom miniatures, and retro TV lamps — depend on details we can&apos;t fully capture through a standard checkout form. We want to confirm the image, finish, dimensions, and any electronics options with you directly so what you receive matches what you&apos;re imagining.
      </p>

      <PolicyH3>How long will my order take?</PolicyH3>
      <p>Production times depend on the product. As a rough guide:</p>
      <PolicyList>
        <li>Lithophane lamps: 7 to 14 business days</li>
        <li>3D-printed miniatures: 5 to 10 business days</li>
        <li>Mugs, stickers, planners: 3 to 7 business days</li>
        <li>Custom retro TV lamps and complex builds: 2 to 4 weeks</li>
      </PolicyList>
      <p>We&apos;ll confirm a specific timeline for your order when we discuss your specifications.</p>

      <PolicyH3>Can I change my order after placing it?</PolicyH3>
      <p>
        If we haven&apos;t started production yet, almost certainly. Email us as soon as possible at{" "}
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
          helpdesk@neversettlesaga.com
        </a>
        . Once production has started, changes may not be possible.
      </p>

      <PolicyH2>Products</PolicyH2>

      <PolicyH3>What are lithophane lamps?</PolicyH3>
      <p>
        Lithophanes are 3D-printed panels that reveal an image when backlit. Our signature lamps use a custom-designed modular holder and hand-tuned image processing to bring photographs to life as warm, glowing artwork.
      </p>

      <PolicyH3>Can I send my own image for a lithophane?</PolicyH3>
      <p>
        Yes — that&apos;s the whole point. After ordering, send us the image you want at{" "}
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
          helpdesk@neversettlesaga.com
        </a>
        . We&apos;ll let you know if any adjustments are needed (resolution, contrast, framing) before printing.
      </p>

      <PolicyH3>What materials do you use?</PolicyH3>
      <PolicyList>
        <li><strong className="text-white">Lithophane lamps:</strong> ABS-Like resin (resin-printed lithophanes) or specialised filament (FDM-printed lithophanes), depending on the design</li>
        <li><strong className="text-white">Miniatures:</strong> ASA, PETG, or resin depending on durability needs</li>
        <li><strong className="text-white">Retro TV lamps:</strong> PLA or ASA bodies with custom electronics (DFPlayer Mini audio modules, PWM dimming, rechargeable LiPo power)</li>
        <li><strong className="text-white">Mugs:</strong> sublimation-grade ceramic</li>
        <li><strong className="text-white">Laser-cut items:</strong> acrylic, MDF, or other substrates depending on the project</li>
      </PolicyList>

      <PolicyH3>Are your products waterproof?</PolicyH3>
      <p>
        No. Treat NSS products as decorative or functional indoor items. Mugs are dishwasher-safe on the top rack only; we recommend hand-washing to preserve the print.
      </p>

      <PolicyH3>Do your retro TV lamps need batteries?</PolicyH3>
      <p>
        They include a rechargeable LiPo battery and charge via USB-C. Full instructions ship with the product.
      </p>

      <PolicyH2>Shipping</PolicyH2>

      <PolicyH3>Do you ship internationally?</PolicyH3>
      <p>
        Yes — UK, EU, and selected destinations worldwide. For destinations outside the EU, please contact us first at{" "}
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
          helpdesk@neversettlesaga.com
        </a>{" "}
        so we can quote shipping accurately for your country.
      </p>

      <PolicyH3>Will I be charged customs duties?</PolicyH3>
      <p>
        For orders outside the UK, you may be charged import duties or VAT by your country&apos;s customs authority on arrival. These charges are not collected by us and are the recipient&apos;s responsibility.
      </p>

      <PolicyH3>How do I track my order?</PolicyH3>
      <p>Once dispatched, you&apos;ll receive a tracking link by email.</p>

      <PolicyH2>Returns and refunds</PolicyH2>

      <PolicyH3>Can I return a personalised product?</PolicyH3>
      <p>
        Generally no — personalised and made-to-order items are exempt from the standard 14-day right to cancel under UK consumer law. See our{" "}
        <Link href="/returns" className="text-amber-400 hover:text-amber-300 underline">Returns Policy</Link>{" "}
        for full details.
      </p>

      <PolicyH3>What if my item arrives damaged or faulty?</PolicyH3>
      <p>
        Contact us within 30 days of delivery with your order number and photos. We&apos;ll repair, replace, or refund. Your rights under the Consumer Rights Act 2015 are fully protected.
      </p>

      <PolicyH2>Payment</PolicyH2>

      <PolicyH3>What payment methods do you accept?</PolicyH3>
      <p>
        We accept payment via Stripe, which supports all major debit and credit cards (Visa, Mastercard, American Express) as well as Apple Pay and Google Pay where available.
      </p>

      <PolicyH3>Is my payment secure?</PolicyH3>
      <p>
        Yes. All payments are processed by Stripe. We never see or store your full card details on our servers.
      </p>

      <PolicyH2>Other</PolicyH2>

      <PolicyH3>Do you offer commissions for unique pieces?</PolicyH3>
      <p>
        Yes. If you have an idea that doesn&apos;t fit our standard product range, email{" "}
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
          helpdesk@neversettlesaga.com
        </a>{" "}
        with a description and we&apos;ll let you know if it&apos;s something we can take on.
      </p>

      <PolicyH3>Do you offer wholesale or partnerships with shops?</PolicyH3>
      <p>
        We currently work with one retail partner. If you&apos;re a shop owner interested in stocking NSS, get in touch.
      </p>

      <PolicyH3>Do you have a physical shop?</PolicyH3>
      <p>
        Not yet. Our products are available through our website and our retail partner.
      </p>

      <PolicyH2>Contact</PolicyH2>
      <p>
        Anything we haven&apos;t covered? Email{" "}
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
          helpdesk@neversettlesaga.com
        </a>{" "}
        and we&apos;ll get back to you within 1 to 2 business days.
      </p>
    </PolicyLayout>
  );
}
