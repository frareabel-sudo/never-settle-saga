import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout, PolicyH2, PolicyList } from "@/components/policy-layout";

export const metadata: Metadata = {
  title: "Returns Policy — Never Settle Saga",
  description:
    "Our returns policy for handmade and personalised products, including faulty or damaged items and your statutory rights.",
};

const LAST_UPDATED = "1 May 2026";

export default function ReturnsPage() {
  return (
    <PolicyLayout
      title="Returns Policy"
      subtitle="We want you to love what you receive. This policy explains your rights and what we can and cannot accept back."
      lastUpdated={LAST_UPDATED}
    >
      <PolicyH2>The short version</PolicyH2>
      <p>
        Because every NSS product is made to order and personalised to your specifications, we are unable to accept returns or offer refunds for change of mind on personalised or custom-made items. This is consistent with UK consumer law (Consumer Contracts Regulations 2013, Regulation 28), which exempts goods made to a consumer&apos;s specifications or clearly personalised from the standard 14-day right to cancel.
      </p>
      <p>
        However, you are always entitled to a refund, replacement, or repair if your item is faulty, damaged on arrival, or not as described. Those rights are protected by the Consumer Rights Act 2015 and we honour them in full.
      </p>

      <PolicyH2>What counts as &ldquo;made to order / personalised&rdquo;</PolicyH2>
      <p>Effectively all NSS products fall into this category, including but not limited to:</p>
      <PolicyList>
        <li>Lithophane lamps with custom images</li>
        <li>Miniatures printed to your specification</li>
        <li>Sublimation mugs with custom designs</li>
        <li>Personalised planners, agendas, and stickers</li>
        <li>Laser-cut or engraved items with custom artwork</li>
        <li>Retro TV lamps and any product involving custom electronics or assembly</li>
      </PolicyList>
      <p>
        If you&apos;re unsure whether your specific order is treated as personalised, ask us before you order.
      </p>

      <PolicyH2>When we will accept a return</PolicyH2>
      <p>We will refund, replace, or repair your item if any of the following apply:</p>
      <PolicyList>
        <li>The item is faulty or develops a fault within a reasonable time of delivery (electronics, lighting, finish defects, etc.)</li>
        <li>The item arrived damaged in transit</li>
        <li>The item is materially different from what was agreed (wrong design, wrong colour, wrong size, wrong personalisation due to our error)</li>
        <li>The item is not of satisfactory quality under the Consumer Rights Act 2015</li>
      </PolicyList>
      <p>
        In any of these cases, contact us at{" "}
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">
          helpdesk@neversettlesaga.com
        </a>{" "}
        within 30 days of receiving your order, with:
      </p>
      <PolicyList>
        <li>Your order number</li>
        <li>A clear description of the issue</li>
        <li>Photos showing the problem (this speeds things up significantly)</li>
      </PolicyList>
      <p>
        We will respond within 3 business days with next steps. Depending on the issue, we will either:
      </p>
      <PolicyList>
        <li>Repair the item</li>
        <li>Replace it</li>
        <li>Issue a full or partial refund</li>
      </PolicyList>
      <p>
        Where a return is required, we will cover the cost of return shipping for faulty, damaged, or incorrect items.
      </p>

      <PolicyH2>What we cannot accept back</PolicyH2>
      <PolicyList>
        <li>Items returned because you changed your mind about a personalised design</li>
        <li>Items damaged after delivery through accidental misuse, drops, exposure to water (where the product is not waterproof), or tampering with electronics</li>
        <li>Items returned without prior contact and authorisation</li>
      </PolicyList>

      <PolicyH2>Refund timing</PolicyH2>
      <p>
        Approved refunds are processed via Stripe back to the original payment method. Once we confirm the refund, it typically appears in your account within 5 to 10 business days, depending on your bank.
      </p>

      <PolicyH2>Your statutory rights</PolicyH2>
      <p>
        Nothing in this policy affects your statutory rights as a consumer in the UK or EU. If you believe your rights under the Consumer Rights Act 2015 or equivalent EU consumer legislation are not being honoured, please contact us first so we can resolve it directly.
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
        See also: <Link href="/shipping" className="text-amber-400 hover:text-amber-300 underline">Shipping Info</Link>{" · "}
        <Link href="/faq" className="text-amber-400 hover:text-amber-300 underline">FAQ</Link>
      </p>
    </PolicyLayout>
  );
}
