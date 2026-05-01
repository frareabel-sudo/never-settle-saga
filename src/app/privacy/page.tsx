import type { Metadata } from "next";
import Link from "next/link";
import { PolicyLayout, PolicyH2, PolicyH3, PolicyList } from "@/components/policy-layout";

export const metadata: Metadata = {
  title: "Privacy Policy — Never Settle Saga",
  description:
    "How Never Settle Saga collects, uses, and protects your personal data, in accordance with UK GDPR and EU GDPR.",
};

const LAST_UPDATED = "1 May 2026";

export default function PrivacyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal data when you visit neversettlesaga.com or place an order with us."
      lastUpdated={LAST_UPDATED}
    >
      <p>
        This Privacy Policy explains how Never Settle Saga collects, uses, and protects your personal data when you visit{" "}
        <a href="https://neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">neversettlesaga.com</a>{" "}
        or place an order with us. We are committed to handling your data lawfully, transparently, and only for purposes you would reasonably expect.
      </p>
      <p>
        This policy is written to comply with the UK GDPR, the Data Protection Act 2018, and the EU GDPR.
      </p>

      <PolicyH2>Who we are (the Data Controller)</PolicyH2>
      <p>
        Never Settle Saga is a small independent business operated by Abel Frare in partnership with his wife.
      </p>
      <PolicyList>
        <li><strong className="text-white">Address:</strong> 262a Seven Sisters Road, London N4 2HY, United Kingdom</li>
        <li><strong className="text-white">Contact:</strong> <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">helpdesk@neversettlesaga.com</a></li>
      </PolicyList>
      <p>
        For the purposes of UK and EU data protection law, we are the Data Controller for any personal data you provide to us through our website or by email.
      </p>

      <PolicyH2>What data we collect</PolicyH2>
      <p>
        We collect only the data we need to operate the website, fulfil your orders, and communicate with you. Specifically:
      </p>

      <PolicyH3>When you visit the website</PolicyH3>
      <PolicyList>
        <li>Standard technical data such as IP address (anonymised by our analytics providers), browser type, device type, and pages visited</li>
        <li>Cookies and similar technologies (see &ldquo;Cookies&rdquo; below)</li>
      </PolicyList>

      <PolicyH3>When you place an order</PolicyH3>
      <PolicyList>
        <li>Name</li>
        <li>Billing and shipping address</li>
        <li>Email address</li>
        <li>Phone number (only if you provide one)</li>
        <li>Order details (products purchased, specifications, personalisation choices)</li>
      </PolicyList>

      <PolicyH3>When you contact us by email</PolicyH3>
      <PolicyList>
        <li>Your name, email address, and the contents of your message</li>
        <li>Any images or specifications you send for custom orders</li>
      </PolicyList>

      <PolicyH3>What we do NOT collect or store</PolicyH3>
      <PolicyList>
        <li>Full payment card details — these are entered directly into Stripe and never touch our servers</li>
        <li>Sensitive personal data (health, religion, ethnicity, political views, etc.)</li>
      </PolicyList>

      <PolicyH2>Why we collect it (the legal basis)</PolicyH2>
      <p>
        We process your personal data under the following lawful bases set out in UK GDPR Article 6:
      </p>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border border-charcoal-50/20">
          <thead className="bg-charcoal-800">
            <tr>
              <th className="text-left p-3 border-b border-charcoal-50/20 text-white">Purpose</th>
              <th className="text-left p-3 border-b border-charcoal-50/20 text-white">Legal basis</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            <tr><td className="p-3 border-b border-charcoal-50/10">Processing and fulfilling your order</td><td className="p-3 border-b border-charcoal-50/10">Contract performance</td></tr>
            <tr><td className="p-3 border-b border-charcoal-50/10">Communicating with you about your order</td><td className="p-3 border-b border-charcoal-50/10">Contract performance</td></tr>
            <tr><td className="p-3 border-b border-charcoal-50/10">Sending order confirmations and shipping updates</td><td className="p-3 border-b border-charcoal-50/10">Contract performance</td></tr>
            <tr><td className="p-3 border-b border-charcoal-50/10">Responding to enquiries</td><td className="p-3 border-b border-charcoal-50/10">Legitimate interest / pre-contract</td></tr>
            <tr><td className="p-3 border-b border-charcoal-50/10">Operating and securing the website</td><td className="p-3 border-b border-charcoal-50/10">Legitimate interest</td></tr>
            <tr><td className="p-3 border-b border-charcoal-50/10">Analytics to understand site usage</td><td className="p-3 border-b border-charcoal-50/10">Consent (via cookie banner)</td></tr>
            <tr><td className="p-3">Complying with tax and accounting law</td><td className="p-3">Legal obligation</td></tr>
          </tbody>
        </table>
      </div>

      <PolicyH2>Who we share your data with</PolicyH2>
      <p>
        We do not sell, rent, or trade your personal data. We share data only with the following service providers, who act as Data Processors on our behalf:
      </p>
      <PolicyList>
        <li><strong className="text-white">Stripe</strong> — payment processing. Stripe receives your payment information directly. See{" "}
          <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">Stripe&apos;s Privacy Policy</a>.
        </li>
        <li><strong className="text-white">Vercel</strong> — website hosting and Vercel Analytics (privacy-friendly, cookieless analytics by default). See{" "}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">vercel.com/legal/privacy-policy</a>.
        </li>
        <li><strong className="text-white">Google Analytics</strong> (Google LLC) — for understanding how visitors use the site. We have configured Google Analytics with IP anonymisation. See{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">policies.google.com/privacy</a>.
        </li>
        <li><strong className="text-white">Microsoft Azure</strong> — backend storage of order records (Azure Cosmos DB and Azure Blob Storage), hosted in EU regions.</li>
        <li><strong className="text-white">Royal Mail and other couriers</strong> — to deliver your order. They receive your name, address, and (where you provide it) phone number.</li>
        <li><strong className="text-white">HMRC and our accountants</strong> — where legally required for tax and accounting purposes.</li>
      </PolicyList>
      <p>
        We may also disclose your data if required to do so by law, court order, or other legal process.
      </p>

      <PolicyH2>International transfers</PolicyH2>
      <p>
        Some of our service providers (Stripe, Google, Microsoft) may process data outside the UK and EEA. Where this happens, we rely on:
      </p>
      <PolicyList>
        <li>UK International Data Transfer Agreement or the EU Standard Contractual Clauses (SCCs), and/or</li>
        <li>UK Adequacy Regulations for transfers to approved countries</li>
      </PolicyList>
      <p>to ensure your data receives equivalent protection.</p>

      <PolicyH2>How long we keep your data</PolicyH2>
      <PolicyList>
        <li><strong className="text-white">Order records:</strong> 7 years after the order date (required for UK tax and accounting law)</li>
        <li><strong className="text-white">Email correspondence:</strong> up to 3 years from the last contact</li>
        <li><strong className="text-white">Custom order specifications and images:</strong> up to 2 years after delivery, in case you reorder or request a repeat</li>
        <li><strong className="text-white">Analytics data:</strong> retention follows the provider&apos;s defaults (typically 14 months for Google Analytics)</li>
      </PolicyList>

      <PolicyH2>Cookies</PolicyH2>
      <p>Our website uses the following cookies and similar technologies:</p>
      <PolicyList>
        <li><strong className="text-white">Strictly necessary cookies</strong> — required for the site and checkout to function (e.g. Stripe session, basic site state). These are always on.</li>
        <li><strong className="text-white">Analytics cookies</strong> — used by Google Analytics to measure how visitors use the site. These are only set if you give consent through our cookie banner.</li>
        <li><strong className="text-white">Vercel Analytics</strong> — by default does not set tracking cookies and is privacy-friendly.</li>
      </PolicyList>
      <p>
        You can withdraw analytics consent at any time by clearing cookies for our domain or by contacting us.
      </p>

      <PolicyH2>Your rights under UK and EU GDPR</PolicyH2>
      <p>You have the following rights regarding your personal data:</p>
      <PolicyList>
        <li><strong className="text-white">Right of access</strong> — request a copy of the data we hold about you</li>
        <li><strong className="text-white">Right to rectification</strong> — ask us to correct inaccurate data</li>
        <li><strong className="text-white">Right to erasure</strong> — ask us to delete your data, subject to legal retention requirements (e.g. tax records)</li>
        <li><strong className="text-white">Right to restrict processing</strong> — ask us to limit how we use your data</li>
        <li><strong className="text-white">Right to data portability</strong> — receive your data in a portable format</li>
        <li><strong className="text-white">Right to object</strong> — object to processing based on legitimate interests</li>
        <li><strong className="text-white">Right to withdraw consent</strong> — for any processing based on consent</li>
      </PolicyList>
      <p>
        To exercise any of these rights, email us at{" "}
        <a href="mailto:helpdesk@neversettlesaga.com" className="text-amber-400 hover:text-amber-300 underline">helpdesk@neversettlesaga.com</a>
        . We will respond within one calendar month, as required by law.
      </p>

      <PolicyH2>Right to complain</PolicyH2>
      <p>
        If you believe we have not handled your data correctly, you can complain to the UK&apos;s data protection regulator:
      </p>
      <p className="not-italic">
        <strong className="text-white">Information Commissioner&apos;s Office (ICO)</strong>
        <br />
        Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF
        <br />
        Helpline: 0303 123 1113
        <br />
        Website:{" "}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">
          ico.org.uk
        </a>
      </p>
      <p>
        EU residents can also complain to their national data protection authority.
      </p>

      <PolicyH2>Security</PolicyH2>
      <p>We protect your data using industry-standard measures, including:</p>
      <PolicyList>
        <li>HTTPS encryption across the entire website</li>
        <li>Encrypted database storage (Azure Cosmos DB)</li>
        <li>Limited access — only Abel and his wife have access to customer data</li>
        <li>Strong authentication on all admin systems</li>
      </PolicyList>

      <PolicyH2>Children</PolicyH2>
      <p>
        Our website and products are not directed at children under 16. We do not knowingly collect data from children. If you believe a child has provided us with data, contact us and we will delete it.
      </p>

      <PolicyH2>Changes to this policy</PolicyH2>
      <p>
        We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at the top reflects the most recent change. Significant changes will be communicated by email to customers with active orders.
      </p>

      <PolicyH2>Contact</PolicyH2>
      <p>For any questions about this policy or your personal data:</p>
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
        <Link href="/returns" className="text-amber-400 hover:text-amber-300 underline">Returns Policy</Link>
      </p>
    </PolicyLayout>
  );
}
