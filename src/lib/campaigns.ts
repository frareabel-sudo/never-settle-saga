/**
 * Sitewide sales campaigns — Black Friday, Christmas, Boxing Day.
 *
 * Same rule as `seasonal.ts`: a campaign is a date window. It switches itself
 * on and, more importantly, switches itself OFF. Nobody has to remember to take
 * a Black Friday banner down on Tuesday morning.
 *
 * IMPORTANT — a campaign with a `code` only shows that code to customers. The
 * discount itself lives in Stripe: the matching promotion code must exist in
 * the Stripe Dashboard (Product catalogue → Coupons) or checkout will refuse it
 * and the banner will be promising something the till won't honour.
 *
 * To add another sale, add an entry. To kill one early, move `endsAt` into the
 * past. Dates are inclusive and read in the visitor's local time (UK).
 */
export type Campaign = {
  key: string;
  /** Small caps line above the headline. */
  eyebrow: string;
  /** Big headline. `\n` splits it over two lines. */
  headline: string;
  /** One sentence under the headline. */
  blurb: string;
  /** The big number/offer in the card, e.g. "25%". */
  offerBig: string;
  /** Small text next to / under the big offer, e.g. "OFF". */
  offerSmall: string;
  /** Label above the offer card, e.g. "Everything". */
  offerLabel: string;
  /** Line under the offer, shown when there is no code. */
  offerNote?: string;
  /** Promotion code customers type at checkout. Must exist in Stripe. */
  code?: string;
  /** Extra line beside the button. */
  footnote?: string;
  cta: string;
  /** Card colour. */
  accent: string;
  /**
   * Written onto every order placed while the campaign runs (order notes in
   * Command Centre), for offers the till can't apply — e.g. a free gift.
   */
  orderNote?: string;
  /** Short text for the floating corner bubble. */
  bubbleTop: string;
  bubbleBottom: string;
  startsAt: string;
  endsAt: string;
};

const CAMPAIGNS: Campaign[] = [
  {
    key: "black-friday-2026",
    eyebrow: "Black Friday · 3–30 November",
    headline: "Black\nFriday",
    blurb: "Personalised gifts, made by hand in London. 25% off everything in the shop.",
    offerLabel: "Everything",
    offerBig: "25%",
    offerSmall: "OFF",
    code: "BLACKFRIDAY25",
    footnote: "Order by 12 Dec for Christmas delivery",
    cta: "Shop the sale",
    accent: "#C2491D",
    bubbleTop: "25%",
    bubbleBottom: "Off",
    startsAt: "2026-11-03",
    endsAt: "2026-11-30",
  },
  {
    key: "christmas-2026",
    eyebrow: "Christmas · 1–15 December",
    headline: "Christmas\nGifts",
    blurb: "Personalised gifts, made by hand in London. Order by 12 December for Christmas delivery.",
    offerLabel: "With every order",
    offerBig: "Free surprise gift",
    offerSmall: "",
    offerNote: "A little handmade treat, tucked into your parcel.",
    orderNote: "Christmas campaign: add a free surprise gift to this parcel.",
    cta: "Shop Christmas gifts",
    accent: "#1F6B4A",
    bubbleTop: "Free",
    bubbleBottom: "Gift",
    startsAt: "2026-12-01",
    endsAt: "2026-12-15",
  },
  {
    key: "boxing-day-2026",
    eyebrow: "Boxing Day · 26–31 December",
    headline: "Boxing Day\nSale",
    blurb: "Personalised gifts, made by hand in London. 25% off everything in the shop.",
    offerLabel: "Everything",
    offerBig: "25%",
    offerSmall: "OFF",
    code: "BOXINGDAY25",
    footnote: "Ends 31 December",
    cta: "Shop the sale",
    accent: "#C2491D",
    bubbleTop: "25%",
    bubbleBottom: "Off",
    startsAt: "2026-12-26",
    endsAt: "2026-12-31",
  },
];

export function activeCampaign(now: Date = new Date()): Campaign | null {
  const t = now.getTime();
  for (const c of CAMPAIGNS) {
    const from = new Date(`${c.startsAt}T00:00:00`).getTime();
    const to = new Date(`${c.endsAt}T23:59:59`).getTime();
    if (Number.isFinite(from) && Number.isFinite(to) && t >= from && t <= to) {
      return c;
    }
  }
  return null;
}

/** "30 November" — for the "Ends …" line. */
export function campaignEndLabel(c: Campaign): string {
  const end = new Date(`${c.endsAt}T23:59:59`);
  if (!Number.isFinite(end.getTime())) return "";
  return end.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}
