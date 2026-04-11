import Image from "next/image";
import Link from "next/link";
import { Globe, MessageCircle, Share2, Mail, MapPin } from "lucide-react";

const footerLinks = {
  Shop: [
    { label: "3D FDM Printing", href: "/shop?category=3D+FDM+Printing" },
    { label: "Resin Printing", href: "/shop?category=Resin+Printing" },
    { label: "Lithophane Lamps", href: "/shop?category=Lithophane+Lamps" },
    { label: "Miniatures", href: "/shop?category=Miniatures" },
    { label: "Kit Party", href: "/shop?category=Kit+Party" },
    { label: "Agendas & Planners", href: "/shop?category=Agendas+%26+Planners" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  Support: [
    { label: "Shipping Info", href: "#" },
    { label: "Returns Policy", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ],
};

const socials = [
  { icon: Globe, href: "#", label: "Instagram" },
  { icon: MessageCircle, href: "#", label: "Facebook" },
  { icon: Share2, href: "#", label: "Twitter" },
];

export function Footer() {
  return (
    <footer className="bg-charcoal-800 border-t border-charcoal-50/30">
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
              <span className="font-display text-lg font-bold">
                Never Settle <span className="text-amber-400">Saga</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              Handmade in London. 3D printed creations, resin miniatures,
              craft kits, personalised planners, and lithophane lamps coming soon.
            </p>
            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-charcoal-50 flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-amber-400/80 mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-amber-300 transition-colors"
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
        <div className="mt-12 pt-8 border-t border-charcoal-50/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> London, UK
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> helpdesk@neversettlesaga.com
            </span>
          </div>
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Never Settle Saga. Made with love by Abel &amp; Jennifer in London
          </p>
        </div>
      </div>
    </footer>
  );
}
