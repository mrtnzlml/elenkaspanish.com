/**
 * Seasonal papel-picado variants. The banner's flag = FLAG_BASE (panel +
 * fringe) plus a cut motif (fill-rule evenodd turns the motif subpaths into
 * perforations). `seasonFor` picks the active season from a date, or null
 * for the year-round banner. Windows are deliberately generous ("around"
 * the holidays, per design spec).
 */
export interface PicadoSeason {
  name: "patrias" | "muertos" | "navidad";
  cut: string;
  colors: string[];
  /** [month 1-12, day], inclusive */
  start: [number, number];
  /** inclusive; a window may wrap the year end (start > end) */
  end: [number, number];
}

export const FLAG_BASE =
  "M0 0H40V40L36 48L32 40L28 48L24 40L20 48L16 40L12 48L8 40L4 48L0 40Z";

/** Year-round rosette motif (also used by Fiestas Patrias). */
export const DEFAULT_CUT =
  "M20 8L26 16L20 24L14 16Z M9 13L12 17L9 21L6 17Z M31 13L34 17L31 21L28 17Z M20 28L23 32L20 36L17 32Z";

export const seasons: PicadoSeason[] = [
  {
    name: "patrias", // el mes patrio — flag palette, rosette cut
    cut: DEFAULT_CUT,
    colors: ["#1e8449", "#c9b99a", "#b93a2b"],
    start: [9, 1],
    end: [9, 30],
  },
  {
    name: "muertos", // calavera: eyes, nose, grinning teeth
    cut: "M13 11L17 15L13 19L9 15Z M27 11L31 15L27 19L23 15Z M20 18L23 23L17 23Z M12 27H16V31H12Z M18 27H22V31H18Z M24 27H28V31H24Z",
    colors: ["#f7a008", "#7b2d8b", "#e3157b", "#e2620e", "#3b2c60"],
    start: [10, 15],
    end: [11, 8],
  },
  {
    name: "navidad", // flor de nochebuena: four petals + corner buds
    cut: "M20 6L23 12L20 16L17 12Z M20 30L23 24L20 20L17 24Z M8 18L14 15L18 18L14 21Z M32 18L26 15L22 18L26 21Z M10 8L12 10L10 12L8 10Z M30 8L32 10L30 12L28 10Z M10 24L12 26L10 28L8 26Z M30 24L32 26L30 28L28 26Z",
    colors: ["#b93a2b", "#1e8449", "#d4a017", "#7f1d1d", "#14532d"],
    start: [11, 15],
    end: [1, 8],
  },
];

/**
 * Active season for the given date, or null for the year-round banner.
 * Uses the LOCAL calendar date on purpose: seasons follow the visitor's
 * clock (per design decision), unlike wordOfTheDay which is UTC-based.
 */
export function seasonFor(date: Date): PicadoSeason | null {
  const md = (date.getMonth() + 1) * 100 + date.getDate();
  for (const s of seasons) {
    const a = s.start[0] * 100 + s.start[1];
    const b = s.end[0] * 100 + s.end[1];
    const active = a <= b ? md >= a && md <= b : md >= a || md <= b;
    if (active) return s;
  }
  return null;
}
