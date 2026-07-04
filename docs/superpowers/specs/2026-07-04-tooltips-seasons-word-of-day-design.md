# Spanish Tooltips, Seasonal Papel Picado & Word of the Day — Design Spec

**Date:** 2026-07-04
**Status:** Approved direction (windows amended per user: generous, "around" the holidays); pending spec review → implementation plan
**Scope:** Homepage only. Three progressive-enhancement features layered onto the shipped visual-uplift design. No copy changes, no new dependencies, games untouched.

## 1. Goal

Deepen the homepage's bilingual + cultural character with three small features:
1. **Translation tooltips** on the Spanish words woven into the English page.
2. **Seasonal papel-picado variants** — the hero banner's cut pattern and palette change around Mexican holidays.
3. **A true "Word of the day"** — the hero flashcard rotates daily through the existing game vocabulary.

All three are progressive enhancements: with JavaScript disabled the page looks exactly as it does today.

## 2. Decisions (locked with the user)

- **Tooltip scope:** all inline Spanish + section eyebrows on the homepage (9 sites incl. the hero-headline *aventura*); the university proper noun and all game content are excluded.
- **Tooltip UX:** dotted-underline hint; shows on hover, keyboard focus, and tap (touch); zero JS.
- **Season selection:** client-side from the visitor's date; no-JS fallback = year-round banner.
- **Seasonal lineup:** Día de Muertos (calavera cut), Navidad (**Flor de Nochebuena** cut — user-selected design B), Fiestas Patrias (rosette cut, flag palette). **Halloween dropped** (Mexicans celebrate Día de Muertos).
- **Windows are generous** ("around these days, not strictly on the day").
- **Word of the day:** deterministic per calendar date from the existing 77-pair pool in `src/data/words.ts`; same word for every visitor that day.

## 3. Feature design

### 3.1 `EsTip.astro` — translation tooltip component

New component `src/components/EsTip.astro`:

```astro
<EsTip en="chat">charla</EsTip>
```

Renders:

```html
<span class="es-tip" lang="es" tabindex="0" aria-describedby="{unique-id}">
  charla
  <span class="es-tip-bubble" id="{unique-id}" role="tooltip" lang="en">chat</span>
</span>
```

- **Props:** `en` (required English translation). Unique id derived by slugifying the `en` text (collision-checked at build; all 9 current translations are distinct).
- **Look:** dotted underline (`text-decoration: underline dotted`, offset) + `cursor: help` on the word; bubble = ink `#16243f` background, white text, ~0.8rem Manrope, rounded, small arrow, absolutely positioned above and centered. White-on-ink is far above WCAG AA.
- **Behavior (CSS-only):** bubble hidden by default; visible on `:hover` and `:focus` of the wrapper. `tabindex="0"` gives keyboard focus AND makes a tap focus the word on touch (tap elsewhere dismisses). Opacity transition gated by `prefers-reduced-motion`.
- **Accessibility:** `role="tooltip"` + `aria-describedby` so screen readers announce the translation; `lang` attributes preserved on both halves.
- Styles live in the component's scoped `<style>` (plus the reduced-motion override).

**Applied to (9 sites, translations final):**

| File | Spanish | English tooltip |
|---|---|---|
| Hero.astro (h1) | aventura *(also gains missing `lang="es"`)* | adventure |
| Hero.astro (microcopy) | charla | chat |
| HowItWorks.astro (eyebrow) | Cómo funciona | How it works |
| WhyChoose.astro (eyebrow) | ¿Por qué elegirme? | Why choose me? |
| About.astro (eyebrow) | Conóceme | Get to know me |
| Pricing.astro (eyebrow) | Precios | Prices |
| Testimonials.astro (eyebrow) | Lo que dicen mis alumnos | What my students say |
| FAQ.astro (eyebrow) | Preguntas frecuentes | Frequently asked questions |
| ReadyToStart.astro (kicker) | ¿Listo para empezar? | Ready to start? |

Excluded: `Universidad Europea Miguel de Cervantes` (About.astro — proper noun, keeps plain `lang="es"`), the word-of-day card (already shows its translation), all game pages. Eyebrow Fraunces styling is preserved (EsTip wraps the text inside the existing styled span).

### 3.2 Seasonal papel picado

**New data module `src/data/picado-seasons.ts`** — single source of truth:

```ts
export interface PicadoSeason {
  name: "patrias" | "muertos" | "navidad";
  cut: string;            // SVG subpaths appended to the shared flag base path
  colors: string[];       // color cycle applied flag-by-flag (any length)
  start: [number, number]; // [month 1-12, day] inclusive
  end: [number, number];   // inclusive; may wrap the year end
}
export const seasons: PicadoSeason[];
export function seasonFor(date: Date): PicadoSeason | null;  // null = year-round default
```

**Date windows (generous, per user amendment):**

| Season | Window | Rationale |
|---|---|---|
| `patrias` | **Sep 1 – Sep 30** | "el mes patrio" — the whole month |
| `muertos` | **Oct 15 – Nov 8** | ofrendas go up mid-October |
| `navidad` | **Nov 15 – Jan 8** | covers the Guadalupe–Reyes stretch (Dec 12 – Jan 6) with margin; wraps the year |

Windows are disjoint except muertos→navidad transition (Nov 8 / Nov 15 — a 6-day default gap; no overlap). `seasonFor` must handle the navidad year-wrap (Dec 25 AND Jan 3 both match).

**Cut paths & palettes (locked from the approved mockups):**

- Shared flag base (panel + fringe): `M0 0H40V40L36 48L32 40L28 48L24 40L20 48L16 40L12 48L8 40L4 48L0 40Z`, `viewBox="0 0 40 52"`, `fill-rule="evenodd"`.
- Year-round rosette cut (current component, unchanged): `M20 8L26 16L20 24L14 16Z M9 13L12 17L9 21L6 17Z M31 13L34 17L31 21L28 17Z M20 28L23 32L20 36L17 32Z`; palette `#e3157b #f7a008 #0f9b9b #004de5 #c1502e`.
- `muertos` calavera cut: `M13 11L17 15L13 19L9 15Z M27 11L31 15L27 19L23 15Z M20 18L23 23L17 23Z M12 27H16V31H12Z M18 27H22V31H18Z M24 27H28V31H24Z`; palette `#f7a008 #7b2d8b #e3157b #e2620e #3b2c60`.
- `navidad` nochebuena cut: `M20 6L23 12L20 16L17 12Z M20 30L23 24L20 20L17 24Z M8 18L14 15L18 18L14 21Z M32 18L26 15L22 18L26 21Z M10 8L12 10L10 12L8 10Z M30 8L32 10L30 12L28 10Z M10 24L12 26L10 28L8 26Z M30 24L32 26L30 28L28 26Z`; palette `#b93a2b #1e8449 #d4a017 #7f1d1d #14532d`.
- `patrias`: rosette cut (same as default); palette `#1e8449 #c9b99a #b93a2b` (3-cycle).

**Rendering strategy (client-side swap):** `PapelPicado.astro` keeps server-rendering the default banner exactly as today (15 flags, default cut + CSS nth-child palette). It gains an Astro-processed `<script>` (bundled module, same mechanism as Layout's existing scripts) that imports `seasonFor` + `seasons`, and on load: if `seasonFor(new Date())` returns a season, it rewrites each flag `<path>`'s `d` (base + seasonal cut) and sets each flag's `color` inline from the season's cycle (`colors[i % colors.length]`, overriding the nth-child default). Same flag geometry → zero layout shift. No JS → default banner. Sway animation and its reduced-motion gate are untouched.

*Alternatives rejected:* render all four banners and CSS-toggle (4× DOM for a decoration); build-time selection (stale seasons on a rarely-deployed static site — explicitly rejected by user).

### 3.3 Word of the day

**`src/data/words.ts` gains a pure function** (data shape unchanged):

```ts
export function wordOfTheDay(date: Date): WordPair;
// flatten categories → pool (77 pairs); index = utcDayNumber(date) % pool.length
```

UTC day number (`Math.floor(t/86_400_000)`) keeps it deterministic and simple; the same word shows globally for a given UTC day and rotates through the full pool (~2.5 months per cycle, no repeats within a cycle).

**Hero card:** stays server-rendered with the current fallback pair ("la aventura → adventure") and keeps `aria-hidden` (decorative flavor). The Spanish/English text nodes get stable ids (`wod-es`, `wod-en`). An Astro-processed `<script>` in `Hero.astro` imports `wordOfTheDay` and swaps both text nodes on load. No-JS = today's exact card.

## 4. Testing

- **Unit (pure, in `tests/data.test.ts` or a new small suite):**
  - `seasonFor`: boundary days for each window (Aug 31→null, Sep 1/Sep 30→patrias, Oct 14→null, Oct 15/Nov 8→muertos, Nov 9–14→null, Nov 15/Dec 25/Jan 3/Jan 8→navidad, Jan 9→null); every season has non-empty `cut` and `colors`.
  - `wordOfTheDay`: deterministic (same date → same pair), in-pool, consecutive days differ, cycles at pool length.
- **Build (`tests/build.test.ts`):**
  - Homepage has ≥9 `.es-tip` spans, each with `tabindex="0"`, `lang="es"`, and a `role="tooltip"` child containing non-empty English; the *aventura* h1 span now carries `lang="es"`; the university name is NOT inside an `.es-tip`.
  - Tooltip bubble ids are unique on the page.
  - Papel picado still server-renders 15 default flags; the seasonal + word-of-day scripts are present in the built page.
  - Hero contains `#wod-es`/`#wod-en` with the fallback pair.

## 5. Backward compatibility

- **No-JS = status quo:** default banner, fallback word card, tooltips work (CSS-only) — nothing regresses.
- **No copy changes** (testimonials untouched); no new dependencies; no build-pipeline changes; CF Pages safe.
- **A11y:** tooltips add keyboard/SR support and fix the missing `lang="es"` on *aventura*; all new colors appear only in the decorative banner (aria-hidden) — no text-contrast surface. Reduced-motion gates preserved.
- **CLAUDE.md updates (same change set):** note the two homepage progressive-enhancement scripts (seasonal banner, word of the day), the `EsTip` convention for any future inline Spanish, and the seasonal windows table.
- **Tests:** all existing 213 must stay green; new tests added per §4.

## 6. Out of scope

- Tooltips or seasonal theming on game pages.
- Additional holidays (easy to add later: one entry in `picado-seasons.ts`).
- Any server/SSR logic, analytics, or persistence.
