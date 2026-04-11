"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-charcoal-900/95 backdrop-blur-xl border-b border-amber-500/10 shadow-lg shadow-black/20"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/images/LOGO.jpg"
                alt="Never Settle Saga"
                width={44}
                height={44}
                className="rounded-lg group-hover:shadow-lg group-hover:shadow-amber-500/30 transition-all duration-300"
              />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-display text-[11px] font-bold tracking-[0.25em] uppercase text-amber-400/90">
                  Never Settle
                </span>
                <span className="font-display text-lg font-bold tracking-tight text-foreground -mt-0.5">
                  Saga
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm text-gray-400 hover:text-amber-300 transition-colors duration-300 group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0 group-hover:w-4/5 transition-all duration-400 ease-out" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/shop"
                className="relative p-2.5 rounded-full text-gray-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-300"
                aria-label="Shopping bag"
              >
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-500 text-charcoal-900 text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30"
                  >
                    {count}
                  </motion.span>
                )}
              </Link>
              <button
                className="lg:hidden p-2.5 rounded-full text-gray-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-300"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-charcoal-900/98 backdrop-blur-2xl lg:hidden"
          >
            {/* Close button */}
            <div className="absolute top-4 right-4">
              <button
                className="p-3 rounded-full text-gray-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Center content */}
            <div className="flex flex-col items-center justify-center h-full">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-12"
              >
                <Image
                  src="/images/LOGO.jpg"
                  alt="Never Settle Saga"
                  width={64}
                  height={64}
                  className="rounded-xl shadow-lg shadow-amber-500/20"
                />
              </motion.div>

              {/* Nav links */}
              <nav className="flex flex-col items-center gap-2">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-8 py-3 text-2xl font-display font-semibold text-gray-300 hover:text-amber-300 transition-colors text-center"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Footer info */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-8 text-xs text-gray-600 tracking-widest uppercase"
              >
                Handmade in London
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
