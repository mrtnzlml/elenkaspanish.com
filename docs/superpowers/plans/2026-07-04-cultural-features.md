# Tooltips + Seasonal Papel Picado + Word of the Day Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CSS-only Spanish→English translation tooltips, client-side seasonal papel-picado variants, and a deterministic daily word to the homepage — all progressive enhancements (no-JS keeps today's exact appearance).

**Architecture:** Pure data/logic lives in `src/data/` (unit-testable: `wordOfTheDay`, `seasonFor` + season definitions). A new `EsTip.astro` renders zero-JS tooltips. `PapelPicado.astro` and `Hero.astro` each gain a tiny Astro-processed `<script>` (bundled module, same mechanism as Layout's existing scripts) that enhances the server-rendered default on load.

**Tech Stack:** Astro 6 static output, TypeScript data modules, vitest (+cheerio for built HTML). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-04-tooltips-seasons-word-of-day-design.md` — authoritative for translations, cut paths, palettes, windows.

**Branch:** `cultural-features` (created). Do NOT push (pushing `main` deploys; nothing gets pushed without explicit approval).

---

## File Structure

- **Modify** `src/data/words.ts` — add pure `wordOfTheDay(date)` (reuses existing `getAllWords()`).
- **Create** `src/data/picado-seasons.ts` — `FLAG_BASE`, `DEFAULT_CUT`, `seasons[]`, pure `seasonFor(date)`.
- **Create** `src/components/EsTip.astro` — tooltip component (scoped styles, zero JS).
- **Modify** `src/components/PapelPicado.astro` — import base/cut from the data module (DRY) + seasonal swap script.
- **Modify** `src/components/Hero.astro` — EsTip on *aventura*/*charla*; `wod-es`/`wod-en` ids + daily-word script.
- **Modify** `src/components/{HowItWorks,WhyChoose,About,Pricing,Testimonials,FAQ,ReadyToStart}.astro` — wrap eyebrow/kicker Spanish in EsTip.
- **Modify** `tests/data.test.ts` (unit: wordOfTheDay, seasonFor) and `tests/build.test.ts` (tooltips, SSR banner, scripts).
- **Modify** `CLAUDE.md` — document the conventions.

---

## Task 1: `wordOfTheDay` in words.ts

**Files:** Modify `src/data/words.ts`; Test `tests/data.test.ts`.

- [ ] **Step 1: Write the failing tests.** In `tests/data.test.ts` (which already imports from `../src/data/words`), extend the import to `import { categories, getAllWords, shuffle, wordOfTheDay } from "../src/data/words";` and add at the end of the `describe("words.ts", …)` block:

```ts
describe("wordOfTheDay", () => {
  const DAY = 86_400_000;
  it("is deterministic within a UTC day", () => {
    expect(wordOfTheDay(new Date("2026-07-04T00:00:01Z"))).toEqual(
      wordOfTheDay(new Date("2026-07-04T23:59:59Z")),
    );
  });
  it("returns a pair from the pool", () => {
    expect(getAllWords()).toContainEqual(wordOfTheDay(new Date("2026-01-15T12:00:00Z")));
  });
  it("changes on consecutive days and cycles after the pool length", () => {
    const d0 = new Date("2026-03-01T12:00:00Z");
    const d1 = new Date(d0.getTime() + DAY);
    const dn = new Date(d0.getTime() + getAllWords().length * DAY);
    expect(wordOfTheDay(d0)).not.toEqual(wordOfTheDay(d1));
    expect(wordOfTheDay(dn)).toEqual(wordOfTheDay(d0));
  });
});
```

(If `wordOfTheDay` is placed inside the existing top-level describe, nesting a describe is fine — vitest allows it.)

- [ ] **Step 2: Run to verify failure.** `npx vitest run tests/data.test.ts -t "wordOfTheDay"` → FAIL ("wordOfTheDay" is not exported).

- [ ] **Step 3: Implement.** In `src/data/words.ts`, after `getAllWords` (verify it returns the flattened `WordPair[]`; it's already used by games/tests), add:

```ts
/**
 * Deterministic "word of the day": indexes the flattened pool by UTC day
 * number, so every visitor sees the same pair on a given UTC day and the
 * pool cycles with no repeats within a cycle.
 */
export function wordOfTheDay(date: Date): WordPair {
  const pool = getAllWords();
  const day = Math.floor(date.getTime() / 86_400_000);
  return pool[((day % pool.length) + pool.length) % pool.length];
}
```

- [ ] **Step 4: Verify pass.** `npx vitest run tests/data.test.ts -t "wordOfTheDay"` → 3 PASS. (`npm run build` not needed — pure unit tests; but data.test.ts may not require dist. Run `npx vitest run tests/data.test.ts` fully → green.)

- [ ] **Step 5: Commit.**
```bash
git add src/data/words.ts tests/data.test.ts
git commit -m "feat(data): deterministic wordOfTheDay from the game vocabulary"
```

---

## Task 2: `picado-seasons.ts` data module

**Files:** Create `src/data/picado-seasons.ts`; Test `tests/data.test.ts`.

- [ ] **Step 1: Write the failing tests.** Add to `tests/data.test.ts` (new top-level describe; add import `import { seasons, seasonFor, FLAG_BASE, DEFAULT_CUT } from "../src/data/picado-seasons";`):

```ts
describe("picado-seasons.ts", () => {
  const d = (iso: string) => new Date(iso + "T12:00:00");
  it("every season has a name, cut, colors, and window", () => {
    expect(seasons.length).toBe(3);
    for (const s of seasons) {
      expect(s.cut.trim()).toBeTruthy();
      expect(s.colors.length).toBeGreaterThanOrEqual(3);
      expect(s.start.length).toBe(2);
      expect(s.end.length).toBe(2);
    }
    expect(FLAG_BASE.startsWith("M0 0H40")).toBe(true);
    expect(DEFAULT_CUT.trim()).toBeTruthy();
  });
  it("resolves windows inclusively", () => {
    expect(seasonFor(d("2026-08-31"))).toBeNull();
    expect(seasonFor(d("2026-09-01"))?.name).toBe("patrias");
    expect(seasonFor(d("2026-09-30"))?.name).toBe("patrias");
    expect(seasonFor(d("2026-10-14"))).toBeNull();
    expect(seasonFor(d("2026-10-15"))?.name).toBe("muertos");
    expect(seasonFor(d("2026-11-08"))?.name).toBe("muertos");
    expect(seasonFor(d("2026-11-09"))).toBeNull();
    expect(seasonFor(d("2026-11-14"))).toBeNull();
  });
  it("navidad wraps the year end", () => {
    expect(seasonFor(d("2026-11-15"))?.name).toBe("navidad");
    expect(seasonFor(d("2026-12-25"))?.name).toBe("navidad");
    expect(seasonFor(d("2027-01-03"))?.name).toBe("navidad");
    expect(seasonFor(d("2027-01-08"))?.name).toBe("navidad");
    expect(seasonFor(d("2027-01-09"))).toBeNull();
    expect(seasonFor(d("2026-07-04"))).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure.** `npx vitest run tests/data.test.ts -t "picado-seasons"` → FAIL (module not found).

- [ ] **Step 3: Implement.** Create `src/data/picado-seasons.ts`:

```ts
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
```

- [ ] **Step 4: Verify pass.** `npx vitest run tests/data.test.ts` → all green (existing + new).

- [ ] **Step 5: Commit.**
```bash
git add src/data/picado-seasons.ts tests/data.test.ts
git commit -m "feat(data): seasonal papel-picado definitions with date-window resolver"
```

---

## Task 3: EsTip tooltip component + apply to all 9 sites

**Files:** Create `src/components/EsTip.astro`; Modify `Hero.astro`, `HowItWorks.astro`, `WhyChoose.astro`, `About.astro`, `Pricing.astro`, `Testimonials.astro`, `FAQ.astro`, `ReadyToStart.astro`; Test `tests/build.test.ts`.

- [ ] **Step 1: Write the failing tests.** Add inside `describe("design system (visual uplift)", …)` in `tests/build.test.ts`:

```ts
it("Spanish words carry accessible translation tooltips", () => {
  const $ = readPage("/");
  const tips = $(".es-tip");
  expect(tips.length).toBeGreaterThanOrEqual(9);
  tips.each((_, el) => {
    const t = $(el);
    expect(t.attr("tabindex"), "focusable for keyboard/tap").toBe("0");
    expect(t.attr("lang")).toBe("es");
    const bubble = t.find("[role='tooltip']");
    expect(bubble.length).toBe(1);
    expect(bubble.attr("lang")).toBe("en");
    expect(bubble.text().trim()).not.toBe("");
    expect(t.attr("aria-describedby")).toBe(bubble.attr("id"));
  });
});
it("tooltip ids are unique and aventura is tooltip-tagged", () => {
  const $ = readPage("/");
  const ids = $("[role='tooltip']").map((_, el) => $(el).attr("id")).get();
  expect(new Set(ids).size).toBe(ids.length);
  expect($("h1 .es-tip").text()).toContain("aventura");
});
it("the university proper noun is NOT tooltip-wrapped", () => {
  const $ = readPage("/");
  const uni = $("span[lang='es']:contains('Universidad')");
  expect(uni.length).toBe(1);
  expect(uni.closest(".es-tip").length).toBe(0);
  expect(uni.find(".es-tip").length).toBe(0);
});
```

- [ ] **Step 2: Run to verify failure.** `npm run build && npx vitest run -t "translation tooltips"` → FAIL.

- [ ] **Step 3: Create `src/components/EsTip.astro`:**

```astro
---
/**
 * Inline Spanish word/phrase with a CSS-only English translation tooltip.
 * Shows on hover, keyboard focus, and tap (tabindex makes taps focus it).
 * Usage: <EsTip en="chat">charla</EsTip>
 */
interface Props {
  en: string;
}
const { en } = Astro.props;
const id = "tip-" + en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
---

<span class="es-tip" lang="es" tabindex="0" aria-describedby={id}><slot /><span
    class="es-tip-bubble"
    id={id}
    role="tooltip"
    lang="en">{en}</span></span>

<style>
  .es-tip {
    position: relative;
    text-decoration: underline dotted;
    text-decoration-thickness: 1.5px;
    text-underline-offset: 3px;
    cursor: help;
    outline-offset: 3px;
  }
  .es-tip-bubble {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 8px);
    transform: translateX(-50%);
    width: max-content;
    max-width: min(240px, 80vw);
    text-align: center;
    background: var(--color-ink);
    color: #fff;
    font-family: var(--font-sans);
    font-style: normal;
    font-weight: 700;
    font-size: 0.8rem;
    line-height: 1.35;
    letter-spacing: normal;
    padding: 5px 10px;
    border-radius: 8px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease;
    pointer-events: none;
    z-index: 30;
  }
  .es-tip-bubble::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--color-ink);
  }
  .es-tip:hover .es-tip-bubble,
  .es-tip:focus .es-tip-bubble {
    opacity: 1;
    visibility: visible;
  }
  @media (prefers-reduced-motion: reduce) {
    .es-tip-bubble {
      transition: none;
    }
  }
</style>
```

(Bubble resets font-family/style so it stays Manrope even inside Fraunces-italic eyebrows. White-on-ink `#16243f` = 15.5:1 contrast.)

- [ ] **Step 4: Apply to all 9 sites.** In each file add `import EsTip from "./EsTip.astro";` to the frontmatter, then:

1. **Hero.astro h1** (line ~17) — keep the outer styled span, wrap the word:
   `your <span style="font-family:var(--font-serif);font-style:italic;font-weight:600;color:var(--color-primary)"><EsTip en="adventure">aventura</EsTip></span>.`
2. **Hero.astro microcopy** — `<span lang="es">charla</span>` → `<EsTip en="chat">charla</EsTip>`.
3. **HowItWorks.astro eyebrow** — `<span lang="es" class="text-base" style="…terracotta…">C&oacute;mo funciona</span>` → `<span class="text-base" style="font-family:var(--font-serif);font-style:italic;color:var(--color-terracotta)"><EsTip en="How it works">C&oacute;mo funciona</EsTip></span>` (outer `lang` removed — EsTip provides it; styling span kept).
4. **WhyChoose.astro eyebrow** — same pattern, `<EsTip en="Why choose me?">&#191;Por qu&eacute; elegirme?</EsTip>` (rosa styling span kept).
5. **About.astro eyebrow** — `<EsTip en="Get to know me">Con&oacute;ceme</EsTip>` (teal-dark styling span kept). **Do NOT touch the `Universidad Europea Miguel de Cervantes` span** — it keeps its plain `lang="es"`.
6. **Pricing.astro eyebrow** — `<EsTip en="Prices">Precios</EsTip>` (primary styling kept).
7. **Testimonials.astro eyebrow** — `<EsTip en="What my students say">Lo que dicen mis alumnos</EsTip>`. **No other change in this file** (quotes are untouchable).
8. **FAQ.astro eyebrow** — `<EsTip en="Frequently asked questions">Preguntas frecuentes</EsTip>` (terracotta styling kept).
9. **ReadyToStart.astro kicker** — `<p class="mb-3" lang="es" style="…">¿Listo para empezar?</p>` → `<p class="mb-3" style="font-family:var(--font-serif);font-style:italic;color:rgba(255,255,255,.92)"><EsTip en="Ready to start?">¿Listo para empezar?</EsTip></p>` (lang moves to EsTip).

- [ ] **Step 5: Verify pass.** `npm run build && npx vitest run` → ALL green (the three new tests pass; testimonial-verbatim tests confirm no copy drift). Visually spot-check `npm run preview`: hover an eyebrow and *aventura*; tooltip appears above, dotted underline shows.

- [ ] **Step 6: Commit.**
```bash
git add src/components/EsTip.astro src/components/Hero.astro src/components/HowItWorks.astro src/components/WhyChoose.astro src/components/About.astro src/components/Pricing.astro src/components/Testimonials.astro src/components/FAQ.astro src/components/ReadyToStart.astro tests/build.test.ts
git commit -m "feat(home): Spanish translation tooltips via zero-JS EsTip component"
```

---

## Task 4: Seasonal swap in PapelPicado

**Files:** Modify `src/components/PapelPicado.astro`; Test `tests/build.test.ts`.

- [ ] **Step 1: Write the failing tests.** In `tests/build.test.ts` add a `readBuiltJs` helper next to `readBuiltCss` and two tests inside the design-system describe:

```ts
function readBuiltJs(): string {
  const dir = join(DIST, "_astro");
  if (!existsSync(dir)) return "";
  return readdirSync(dir)
    .filter((f) => f.endsWith(".js"))
    .map((f) => readFileSync(join(dir, f), "utf-8"))
    .join("\n");
}
```

```ts
it("papel picado server-renders the default banner", () => {
  const $ = readPage("/");
  const flags = $(".picado .flag");
  expect(flags.length).toBe(15);
  const d = flags.first().find("path").attr("d") ?? "";
  expect(d.startsWith("M0 0H40")).toBe(true);
  expect(d).toContain("M20 8L26 16"); // rosette cut = default
});
it("ships the seasonal picado logic to the client", () => {
  const all = readBuiltJs() + (readPage("/").html() ?? "");
  expect(all).toContain("M13 11L17 15"); // calavera cut in client JS
  expect(all).toContain("M20 6L23 12"); // nochebuena cut in client JS
});
```

- [ ] **Step 2: Run to verify failure.** `npm run build && npx vitest run -t "picado"` → the "server-renders" test may already PASS; "ships the seasonal" must FAIL.

- [ ] **Step 3: Implement.** In `src/components/PapelPicado.astro`: replace the frontmatter `PATH` definition with imports (DRY — single source in the data module) and append the swap script after the markup:

```astro
---
// Authentic-style papel picado … (keep existing comment)
import { FLAG_BASE, DEFAULT_CUT } from "../data/picado-seasons";
const COUNT = 15;
const PATH = `${FLAG_BASE} ${DEFAULT_CUT}`;
---
```

(markup + `<style>` unchanged), then after `</div>`:

```astro
<script>
  import { FLAG_BASE, seasonFor } from "../data/picado-seasons";
  const season = seasonFor(new Date());
  if (season) {
    document.querySelectorAll<HTMLElement>(".picado .flag").forEach((flag, i) => {
      flag.querySelector("path")?.setAttribute("d", `${FLAG_BASE} ${season.cut}`);
      flag.style.color = season.colors[i % season.colors.length];
    });
  }
</script>
```

(Inline `style.color` overrides the nth-child defaults; identical geometry → no layout shift; no-JS visitors keep the default banner.)

- [ ] **Step 4: Verify pass.** `npm run build && npx vitest run` → all green. Manual: `npm run preview`, in DevTools console run `document.querySelectorAll('.picado .flag')[0].querySelector('path').getAttribute('d')` — shows default today; optionally fake a date by temporarily editing `seasonFor(new Date())` to `seasonFor(new Date("2026-11-01"))`, rebuild, confirm calavera + palette, then revert.

- [ ] **Step 5: Commit.**
```bash
git add src/components/PapelPicado.astro tests/build.test.ts
git commit -m "feat(home): seasonal papel-picado variants swapped client-side by date"
```

---

## Task 5: Daily word in the hero card

**Files:** Modify `src/components/Hero.astro`; Test `tests/build.test.ts`.

- [ ] **Step 1: Write the failing test.** Inside the design-system describe:

```ts
it("hero word-of-day card has swap targets and ships the daily-word logic", () => {
  const $ = readPage("/");
  expect($("#wod-es").text().trim()).toBe("la aventura"); // SSR fallback
  expect($("#wod-en").text()).toContain("adventure");
  const all = readBuiltJs() + ($.html() ?? "");
  expect(all).toContain("wod-es");
});
```

- [ ] **Step 2: Run to verify failure.** `npm run build && npx vitest run -t "word-of-day card"` → FAIL (no ids).

- [ ] **Step 3: Implement.** In `src/components/Hero.astro`, add ids to the two card lines (~59-60):

```astro
<p id="wod-es" style="font-family:var(--font-serif);font-style:italic;font-weight:600;color:var(--color-ink)">la aventura</p>
<p id="wod-en" class="text-xs font-bold" style="color:var(--color-teal-dark)">→ adventure</p>
```

and append at the end of the file:

```astro
<script>
  import { wordOfTheDay } from "../data/words";
  const w = wordOfTheDay(new Date());
  const es = document.getElementById("wod-es");
  const en = document.getElementById("wod-en");
  if (es && en) {
    es.textContent = w.es;
    en.textContent = `→ ${w.en}`;
  }
</script>
```

- [ ] **Step 4: Verify pass.** `npm run build && npx vitest run` → all green. Manual: `npm run preview` — the card shows today's word (very likely ≠ "la aventura"); the card is `aria-hidden` so the swap is invisible to screen readers.

- [ ] **Step 5: Commit.**
```bash
git add src/components/Hero.astro tests/build.test.ts
git commit -m "feat(home): true daily word-of-the-day in the hero card"
```

---

## Task 6: CLAUDE.md conventions + final verification

**Files:** Modify `CLAUDE.md`.

- [ ] **Step 1: Document.** In `CLAUDE.md`:
  - In the **Architecture** intro sentence ("Zero client-side JavaScript by default — games use inline `<script>` blocks…"), append: `The homepage additionally ships two tiny progressive-enhancement scripts (seasonal papel-picado swap, daily word-of-the-day); with JS disabled it renders the year-round banner and the fallback word.`
  - In the **Motion & cultural elements** subsection add two bullets:

```markdown
- **Seasonal papel picado:** variants (cuts + palettes + date windows) live in `src/data/picado-seasons.ts` — patrias Sep 1–30, muertos Oct 15–Nov 8, navidad Nov 15–Jan 8; `PapelPicado.astro` swaps them client-side from the visitor's date. Add new holidays there, not in the component.
- **Inline Spanish:** wrap any Spanish word/phrase inside English copy in `<EsTip en="…">` (`src/components/EsTip.astro`) — it renders the dotted-underline translation tooltip and the `lang="es"` tag. Proper nouns keep a plain `lang="es"` span, no tooltip.
```

- [ ] **Step 2: Full verification gate.**
  - `npm test` → build + entire suite green.
  - `node scripts/a11y-audit.mjs` → 0 findings.
  - `npm run preview` → hover/focus/tab a tooltip (keyboard reachable), check 375px width (tooltips don't overflow), confirm banner + word card render, spot-check one game page.

- [ ] **Step 3: Commit.**
```bash
git add CLAUDE.md
git commit -m "docs: EsTip + seasonal-picado conventions"
```
