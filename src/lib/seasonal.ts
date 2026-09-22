/**
 * Time-limited seasonal features.
 *
 * Every seasonal thing we discussed adding — a Christmas row, a Mother's Day
 * banner — carries the same risk: it is exciting to put up and nobody
 * remembers to take it down. A Halloween band still on the site in November
 * makes the shop look abandoned.
 *
 * So a season is a date window. It appears on its own and, more importantly,
 * it LEAVES on its own. Nothing to remember, nothing to undo.
 *
 * To add next year's, or another occasion, add an entry. To kill one early,
 * delete it or move `endsAt` into the past.
 */
export type Season = {
  key: string;
  /** Category name in the shop. The band is hidden while it has no products. */
  category: string;
  /**
   * Other spellings the category might carry. The shop's categories are typed
   * by hand in the Command Centre, and this one arrived as "Hallowen" — the
   * feature should not sit dark waiting for a typo to be corrected.
   */
  aliases?: string[];
  eyebrow: string;
  title: string;
  blurb: string;
  /**
   * Artwork that already carries its own heading and tagline. When present the
   * band shows it INSTEAD of `title`/`blurb` — printing our heading over or
   * beside the image would say everything twice.
   */
  banner?: { src: string; alt: string; width: number; height: number };
  cta: string;
  /** Inclusive, local dates. */
  startsAt: string;
  endsAt: string;
};

const SEASONS: Season[] = [
  {
    key: "halloween-2026",
    category: "Halloween",
    aliases: ["hallowen", "hallowe'en", "halloweeen"],
    eyebrow: "Limited time",
    title: "Halloween",
    blurb:
      "Spooky little things, handmade to order and personalised with any name. Order early — everything is made by hand, and the last few days before the 31st go quickly.",
    cta: "Shop Halloween",
    banner: {
      src: "/images/banners/halloween-collection.jpg",
      alt: "Never Settle Saga Halloween Collection: skeleton, ghost, pumpkin, bat and spider candy bowls, and a ghost candle holder",
      width: 1983,
      height: 793,
    },
    startsAt: "2026-09-20",
    endsAt: "2026-10-31",
  },
];

export function activeSeason(now: Date = new Date()): Season | null {
  const t = now.getTime();
  for (const s of SEASONS) {
    const from = new Date(`${s.startsAt}T00:00:00`).getTime();
    const to = new Date(`${s.endsAt}T23:59:59`).getTime();
    if (Number.isFinite(from) && Number.isFinite(to) && t >= from && t <= to) {
      return s;
    }
  }
  return null;
}

/** Whole days left, for the "N days to go" nudge. Never negative. */
export function daysLeft(season: Season, now: Date = new Date()): number {
  const to = new Date(`${season.endsAt}T23:59:59`).getTime();
  return Math.max(0, Math.ceil((to - now.getTime()) / 86400000));
}

/** Does a shop category belong to this season, however it was typed? */
export function isSeasonCategory(season: Season, category: string): boolean {
  const c = (category || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (c === season.category.trim().toLowerCase()) return true;
  return (season.aliases ?? []).some((a) => a.toLowerCase() === c);
}
