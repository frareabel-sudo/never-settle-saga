import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Analytics } from "@/components/analytics";
import { StructuredData } from "@/components/structured-data";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Never Settle Saga | Premium Handmade Gifts & Lithophane Lamps",
    template: "%s | Never Settle Saga",
  },
  description:
    "London-based studio crafting premium lithophane lamps, laser-engraved personalised gifts, 3D printed products, and custom photo gifts. Handmade with love, designed to last.",
  keywords: [
    "lithophane lamps",
    "personalised gifts",
    "laser engraved",
    "3D printed gifts",
    "custom photo gifts",
    "handmade London",
    "premium gifts UK",
  ],
  openGraph: {
    title: "Never Settle Saga | Premium Handmade Gifts",
    description:
      "Handmade lithophane lamps, laser-engraved gifts & 3D printed creations from London.",
    url: "https://neversettlesaga.com",
    siteName: "Never Settle Saga",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Never Settle Saga",
    description: "Premium handmade gifts from London.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-charcoal-900 text-foreground`}
      >
        <Analytics />
        <StructuredData />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
