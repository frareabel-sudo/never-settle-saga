import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Abel and Jennifer, the couple behind Never Settle Saga — a London based creative studio making personalised 3D prints, resin pieces, lithophane lamps and laser engraved gifts.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
