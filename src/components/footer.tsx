import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { getStoreSettings } from "@/lib/store-settings";
import { getCategories } from "@/lib/data";
import { buildCategoryTree } from "@/lib/category-tree";
import { buildSocials } from "@/components/social-icons";

// Shop links are built from the live categories in the component below. They
// used to be this same hand-written list of disciplines the home page carried
// — none of which exist as categories — so every page footer linked to six
// empty filters.
const footerLinks = {
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  Support: [
    { label: "Shipping Info", href: "/shipping" },
    { label: "Returns Policy", href: "/returns" },
    { label: "FAQ", href: "/faq" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export async function Footer() {
  const settings = await getStoreSettings();
  const socials = buildSocials(settings.contact.social);

  // Top-level categories, alphabetical, capped so the column stays a column.
  let shopLinks: Array<{ label: string; href: string }> = [];
  try {
    shopLinks = buildCategoryTree(await getCategories())
      .map((n) => ({
        label: n.label,
        href: `/shop?category=${encodeURIComponent(n.value)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, 6);
  } catch {
    shopLinks = [];
  }
  const links = {
    ...(shopLinks.length > 0 ? { Shop: shopLinks } : {}),
    ...footerLinks,
  };
  return (
    <footer className="bg-surface-dark border-t border-surface-line/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/images/LOGO.jpg"
                alt="Never Settle Saga"
                width={40}
                height={40}
                className="rounded"
              />
              <span className="font-display text-lg font-bold text-ink-inverse">
                Never Settle <span className="text-brand-300">Saga</span>
              </span>
            </Link>
            <p className="text-ink-inverse/70 text-sm leading-relaxed mb-6 max-w-sm">
              Handmade in London. 3D printed creations, resin miniatures,
              craft kits, personalised planners, and lithophane lamps coming soon.
            </p>
            {socials.length > 0 && (
              <div className="flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-full border border-ink-inverse/25 flex items-center justify-center text-ink-inverse/70 hover:text-brand-300 hover:border-brand-300/60 transition-colors"
                  >
                    <s.Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-brand-300/90 mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {items.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-inverse/70 hover:text-brand-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact row */}
        <div className="mt-12 pt-8 border-t border-ink-inverse/15 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-sm text-ink-inverse/60">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> London, UK
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> helpdesk@neversettlesaga.com
            </span>
          </div>
          <p className="text-sm text-ink-inverse/60">
            &copy; {new Date().getFullYear()} Never Settle Saga. Made with love by Abel &amp; Jennifer in London
          </p>
        </div>
      </div>
    </footer>
  );
}
