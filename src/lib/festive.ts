/**
 * Sitewide festive dressing — snow, fairy lights, a hat on the logo, a
 * Christmas marquee.
 *
 * Same rule as `seasonal.ts` and `campaigns.ts`: it is a date window, so it
 * arrives on its own and, more importantly, LEAVES on its own. Snow on the site
 * in February makes the shop look abandoned.
 *
 * This is decoration only. Offers live in `campaigns.ts`, which runs alongside
 * (Black Friday under the snow is fine).
 *
 * To change the dates, edit the window. To switch it off early, move `endsAt`
 * into the past. Dates are inclusive and read in the visitor's local time (UK).
 */
export type Festive = {
  key: string;
  startsAt: string;
  endsAt: string;
  /** Replaces the scrolling marquee lines while the window is open. */
  marquee: string[];
  /**
   * Replaces the home hero photo. Artwork with its heading and button printed
   * in, so it is shown whole at its own ratio — never cropped — and the whole
   * image is the link.
   */
  heroBanner?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    href: string;
  };
};

const FESTIVE: Festive[] = [
  {
    key: "christmas-2026",
    startsAt: "2026-11-19",
    // Twelfth Night: the decorations come down.
    endsAt: "2027-01-06",
    marquee: [
      "MERRY CHRISTMAS FROM LONDON",
      "PERSONALISED CHRISTMAS GIFTS",
      "ORDER BY 12 DECEMBER FOR CHRISTMAS DELIVERY",
      "HANDMADE IN LONDON",
      "FREE UK SHIPPING OVER £50",
    ],
    heroBanner: {
      src: "/images/banners/christmas-door-signs.jpg",
      alt: "Bring Christmas magic home: festive decorative door signs by DreamCraft Studio, with Santa, reindeer and Ho Ho Ho designs. Shop now.",
      width: 1752,
      height: 897,
      href: "/shop/christmas-door-hanger",
    },
  },
];

export function activeFestive(now: Date = new Date()): Festive | null {
  const t = now.getTime();
  for (const f of FESTIVE) {
    const from = new Date(`${f.startsAt}T00:00:00`).getTime();
    const to = new Date(`${f.endsAt}T23:59:59`).getTime();
    if (Number.isFinite(from) && Number.isFinite(to) && t >= from && t <= to) {
      return f;
    }
  }
  return null;
}
