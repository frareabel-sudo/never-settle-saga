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
  eyebrow: string;
  title: string;
  blurb: string;
  cta: string;
  /** Inclusive, local dates. */
  startsAt: string;
  endsAt: string;
};

const SEASONS: Season[] = [
  {
    key: "halloween-2026",
    category: "Halloween",
    eyebrow: "Limited time",
    title: "Halloween",
    blurb:
      "Spooky little things, handmade to order and personalised with any name. Order early — everything is made by hand, and the last few days before the 31st go quickly.",
    cta: "Shop Halloween",
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
