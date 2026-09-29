import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Analytics } from "@/components/analytics";
import { PromoBubble } from "@/components/promo-bubble";
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
  // Trading name is DreamCraft Studio; the domain stays neversettlesaga.com.
  // Lithophane lamps were dropped from every line below: the catalogue has no
  // such category, and a title promising stock we do not carry is the same
  // drift that once made the homepage category cards link to nothing.
  title: {
    default: "DreamCraft Studio | Personalised Gifts Handmade in London",
    template: "%s | DreamCraft Studio",
  },
  description:
    "London studio making personalised gifts by hand: 3D printed pieces, resin charms, sublimation mugs and tote bags, and custom stationery. Made to order, made to keep.",
  keywords: [
    "personalised gifts",
    "3D printed gifts",
    "resin keyrings",
    "sublimation mugs",
    "custom stationery",
    "handmade London",
    "personalised gifts UK",
  ],
  openGraph: {
    title: "DreamCraft Studio | Personalised Gifts Handmade in London",
    description:
      "3D printed, resin, sublimation and stationery — personalised by hand in London.",
    url: "https://neversettlesaga.com",
    siteName: "DreamCraft Studio",
    locale: "en_GB",
    type: "website",
    // Without this the link preview in WhatsApp and Instagram was text only,
    // while twitter.card already promised a large image. 1200x630 is the size
    // both expect; anything else gets cropped by somebody.
    images: [
      {
        url: "https://neversettlesaga.com/images/og-share.jpg",
        width: 1200,
        height: 630,
        alt: "DreamCraft Studio — sublimation, 3D, resin and stationery, personalised by hand in London",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DreamCraft Studio | Personalised Gifts, London",
    description:
      "3D printed, resin, sublimation and stationery — personalised by hand in London.",
    images: ["https://neversettlesaga.com/images/og-share.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-surface text-foreground`}
      >
        <Analytics />
        <StructuredData />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <PromoBubble />
      </body>
    </html>
  );
}
