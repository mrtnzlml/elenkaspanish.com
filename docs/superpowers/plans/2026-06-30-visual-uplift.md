# Visual Uplift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the elenkaspanish.com homepage into the approved warm, colorful, Elena-centric "Hola, soy Elena" design while keeping the site fast, WCAG-AA accessible, and Cloudflare-Pages-safe.

**Architecture:** Additive design-system changes in `src/styles/global.css` (color tokens, Fraunces serif, three reduced-motion-gated keyframes, a seamless gradient CTA class) + a new `PapelPicado.astro` SVG component, then restyle the existing homepage section components in place. Copy is unchanged (testimonials verbatim). Blue `#004de5` stays the brand/trust anchor so favicons/manifest/JSON-LD/theme-color stay coherent.

**Tech Stack:** Astro 6 (static output), Tailwind CSS 4 (`@theme` tokens), vanilla CSS keyframes, vitest + cheerio for build-output tests, `sharp` (already transitive) for image optimization.

**Visual source of truth:** the approved mockup at `/.superpowers/brainstorm/51988-1781517158/content/home-elena-vibrant.html`. When this plan says "match the mockup," open that file for exact values.

**Branch:** all work on `visual-uplift` (already created). Do NOT push to `main` (triggers Cloudflare production deploy) without explicit approval.

---

## File Structure

- **Modify** `src/styles/global.css` — add `@theme` color tokens + `--font-serif`; Fraunces `@font-face`-equivalent via Layout link (see Task 1); add `@keyframes flow/sway/rise`; add `.cta-fiesta` and section-tint helper classes; extend the `prefers-reduced-motion` block.
- **Modify** `src/layouts/Layout.astro` — add Fraunces stylesheet link in `<head>`; recolor the nav logo accent.
- **Create** `src/components/PapelPicado.astro` — reusable SVG cut-paper banner.
- **Modify** `src/components/Hero.astro` — greeting, headline accent, papel-picado, gradient CTA, word-of-the-day flashcard, portrait glow, colored stats.
- **Modify** `src/components/HowItWorks.astro`, `WhyChoose.astro`, `About.astro`, `Pricing.astro`, `Testimonials.astro`, `FAQ.astro` — per-section warm tint + accent eyebrow (Fraunces italic) + colored icons/borders. Copy unchanged.
- **Modify** `src/components/ReadyToStart.astro` — cultural photo background + multi-color scrim.
- **Add** `public/calle.{avif,webp,jpg}` — the one cultural photo (final CTA), generated via Task 4.
- **Modify** `scripts/optimize-images.mjs` — add generation of the `calle.*` variants (repeatability).
- **Modify** `CLAUDE.md` — replace the monochrome design rules with the new palette/typography/motion/accessibility rules.
- **Modify** `tests/build.test.ts` — add assertions for the new design facts; update any that legitimately change.

**Accent-color contrast rule (applies to every styling task):** text-colored accents must meet WCAG AA. Safe for text: blue `#004de5`, ink `#16243f`, terracotta `#c1502e` (4.71:1), rosa `#e3157b` (4.51:1), teal-dark `#0a7d7d` (4.95:1). **Teal `#0f9b9b` only for large text/icons/borders. Marigold `#f7a008` / amber `#ffb703` are decorative only (gradients, fills, chip backgrounds) — never text or contrast-critical icons on light.**

---

## Task 1: Design tokens, fonts, keyframes, CTA class

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/layouts/Layout.astro` (Fraunces link)
- Test: `tests/build.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `tests/build.test.ts` (inside the top-level `describe("build output", …)`, after the existing helpers add a CSS reader, then a new describe):

```ts
function readBuiltCss(): string {
  const dir = join(DIST, "_astro");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(dir, f), "utf-8"))
    .join("\n");
}

describe("design system (visual uplift)", () => {
  it("emits the warm palette tokens in built CSS", () => {
    const css = readBuiltCss();
    expect(css).toContain("#e3157b"); // rosa
    expect(css).toContain("#c1502e"); // terracotta
    expect(css).toContain("#0a7d7d"); // teal-dark
  });

  it("defines the three controlled keyframes and gates them on reduced-motion", () => {
    const css = readBuiltCss();
    expect(css).toMatch(/@keyframes flow/);
    expect(css).toMatch(/@keyframes sway/);
    expect(css).toMatch(/@keyframes rise/);
    expect(css).toMatch(/prefers-reduced-motion/);
  });

  it("loads the Fraunces serif accent font on the homepage", () => {
    const $ = readPage("/");
    const head = $("head").html() ?? "";
    expect(head).toMatch(/Fraunces/);
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run build && npx vitest run -t "design system"`
Expected: FAIL (tokens/keyframes/Fraunces not present yet).

- [ ] **Step 3: Add tokens, serif font token, keyframes, CTA + tint classes**

In `src/styles/global.css`, replace the existing `@theme { … }` block with:

```css
@theme {
  --color-primary: #004de5;
  --color-primary-dark: #003bb3;
  --color-cream: #fefdf8;
  --color-rosa: #e3157b;
  --color-marigold: #f7a008;
  --color-amber: #ffb703;
  --color-terracotta: #c1502e;
  --color-teal: #0f9b9b;
  --color-teal-dark: #0a7d7d;
  --color-ink: #16243f;
  --font-sans: "Manrope", sans-serif;
  --font-serif: "Fraunces", Georgia, serif;
}
```

Then append (after the existing `@font-face` / focus-visible rules):

```css
/* ---- Visual uplift: controlled motion ---- */
@keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes sway { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
@keyframes flow { from { background-position: 0 0; } to { background-position: -200% 0; } }

.rise { opacity: 0; animation: rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }
.rise.d1 { animation-delay: 0.05s; } .rise.d2 { animation-delay: 0.13s; }
.rise.d3 { animation-delay: 0.21s; } .rise.d4 { animation-delay: 0.29s; } .rise.d5 { animation-delay: 0.37s; }

/* seamless rosa→marigold→rosa gradient — no hard edge at the loop point */
.cta-fiesta {
  background: linear-gradient(120deg, var(--color-rosa) 0%, var(--color-marigold) 50%, var(--color-rosa) 100%);
  background-size: 200% 100%;
  animation: flow 7s linear infinite;
}

/* soft warm section tints */
.tint-peach { background: linear-gradient(180deg, #fff8ef, #ffeede); }
.tint-rosa  { background: linear-gradient(180deg, #fff, #fdeef6); }
.tint-warm  { background: linear-gradient(160deg, #fff6ea, #ffe7ef); }
.tint-teal  { background: linear-gradient(180deg, #eef9f6, #fff6ea); }
.tint-amber { background: linear-gradient(180deg, #fff, #fff4e6); }

@media (prefers-reduced-motion: reduce) {
  .rise { animation: none; opacity: 1; }
  .cta-fiesta { animation: none; }
}
```

> If `global.css` already has a `prefers-reduced-motion` block (added in a prior change), merge these rules into it instead of adding a second block.

- [ ] **Step 4: Add the Fraunces font link to Layout**

In `src/layouts/Layout.astro` `<head>`, immediately after the existing Manrope `<link rel="preconnect" … fonts.gstatic.com>` lines, add:

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,500;1,9..144,600&display=swap"
/>
```

(Preconnects to `fonts.googleapis.com` / `fonts.gstatic.com` already exist. Self-hosting Fraunces for parity with Manrope is an optional later optimization — out of scope here.)

- [ ] **Step 5: Run tests to verify pass**

Run: `npm run build && npx vitest run -t "design system"`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css src/layouts/Layout.astro tests/build.test.ts
git commit -m "feat(design): add warm palette tokens, Fraunces serif, controlled keyframes"
```

---

## Task 2: PapelPicado component

**Files:**
- Create: `src/components/PapelPicado.astro`
- Test: `tests/build.test.ts` (asserted via Hero in Task 3; this task just creates + unit-renders it)

- [ ] **Step 1: Create the component**

Create `src/components/PapelPicado.astro`:

```astro
---
// Authentic-style papel picado: rectangular cut-paper panels with a symmetric
// perforated motif (cut-outs show the background through), a pointed fringe,
// hung from a cord. Decorative only.
const COUNT = 15;
const PATH =
  "M0 0H40V40L36 48L32 40L28 48L24 40L20 48L16 40L12 48L8 40L4 48L0 40Z " +
  "M20 8L26 16L20 24L14 16Z M9 13L12 17L9 21L6 17Z M31 13L34 17L31 21L28 17Z M20 28L23 32L20 36L17 32Z";
---

<div class="picado" aria-hidden="true">
  {Array.from({ length: COUNT }).map(() => (
    <span class="flag">
      <svg viewBox="0 0 40 52"><path d={PATH} fill="currentColor" fill-rule="evenodd" /></svg>
    </span>
  ))}
</div>

<style>
  .picado { position: relative; display: flex; justify-content: center; flex-wrap: wrap; gap: 5px; padding: 18px 0 8px; }
  .picado::before { content: ""; position: absolute; top: 18px; left: 9%; right: 9%; height: 2px; background: color-mix(in srgb, var(--color-terracotta) 40%, transparent); border-radius: 2px; }
  .flag { width: 34px; height: 46px; transform-origin: top center; animation: sway 3.6s ease-in-out infinite; }
  .flag svg { display: block; width: 100%; height: 100%; filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.08)); }
  .flag:nth-child(5n + 1) { color: var(--color-rosa); }
  .flag:nth-child(5n + 2) { color: var(--color-marigold); }
  .flag:nth-child(5n + 3) { color: var(--color-teal); }
  .flag:nth-child(5n + 4) { color: var(--color-primary); }
  .flag:nth-child(5n + 5) { color: var(--color-terracotta); }
  .flag:nth-child(2n) { animation-delay: -1.7s; }
  .flag:nth-child(3n) { animation-delay: -0.9s; }
  @media (prefers-reduced-motion: reduce) { .flag { animation: none; } }
</style>
```

> `@keyframes sway` is defined globally in `global.css` (Task 1); referencing it from this scoped style is fine.

- [ ] **Step 2: Commit**

```bash
git add src/components/PapelPicado.astro
git commit -m "feat(design): add PapelPicado SVG banner component"
```

---

## Task 3: Hero redesign

**Files:**
- Modify: `src/components/Hero.astro`
- Test: `tests/build.test.ts`

- [ ] **Step 1: Write the failing tests**

Add inside the `describe("design system (visual uplift)", …)` block:

```ts
it("hero shows Elena's personal greeting and papel picado", () => {
  const $ = readPage("/");
  const hero = $("#hero");
  expect(hero.text()).toMatch(/Hola, soy Elena/);
  expect(hero.find(".picado, [class*='picado']").length).toBeGreaterThan(0);
  expect(hero.find("a[href*='calendar.google.com']").length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run build && npx vitest run -t "personal greeting"`
Expected: FAIL.

- [ ] **Step 3: Rewrite the Hero body**

In `src/components/Hero.astro`, keep the frontmatter `bookingUrl` and import the new component; replace the section markup to match the mockup. Frontmatter add:

```astro
import PapelPicado from "./PapelPicado.astro";
```

Replace the `<section id="hero">…</section>` contents with this structure (full markup; copy unchanged; classes use the new tokens). Keep the existing `<picture>` block for Elena exactly as-is (AVIF/WebP/JPG with `fetchpriority="high"`):

```astro
<section id="hero" class="relative overflow-hidden">
  <PapelPicado />
  <div class="max-w-4xl mx-auto px-6 pt-6 pb-20 md:pb-24">
    <div class="flex flex-col md:flex-row md:items-center md:gap-12">
      <div class="flex-1 text-center md:text-left">
        <p class="rise d1" style="font-family:var(--font-serif);font-style:italic;font-weight:600;color:var(--color-rosa);font-size:1.4rem;margin-bottom:.5rem">
          Hola, soy Elena
        </p>
        <h1 class="rise d2 text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight" style="color:var(--color-ink)">
          Your Spanish,<br />your <span style="font-family:var(--font-serif);font-style:italic;font-weight:600;color:var(--color-primary)">aventura</span>.
        </h1>
        <p class="rise d3 text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
          Personalized 1-on-1 lessons with a native Mexican teacher.
          Whether it's for travel, work, or love — your plan is built around your goals.
        </p>
        <div class="rise d4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-5">
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
             class="cta-fiesta inline-block text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-rosa/30 transition-transform hover:-translate-y-0.5">
            Book a free intro call
          </a>
          <a href="https://wa.me/420773710520?text=Hi%20Elena%2C%20I%27m%20interested%20in%20Spanish%20lessons!" target="_blank" rel="noopener noreferrer"
             class="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-xl font-bold hover:bg-primary hover:text-white transition-all">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Message on WhatsApp
          </a>
        </div>
        <p class="rise d5 text-sm text-gray-500">No commitment — just a friendly <span lang="es">charla</span> about your goals</p>
        <div class="rise d5 flex flex-wrap justify-center md:justify-start gap-6 md:gap-10 mt-8 pt-6 border-t border-gray-200/70">
          <div class="text-center"><p class="text-2xl md:text-3xl font-bold" style="color:var(--color-rosa)">50+</p><p class="text-xs text-gray-500 uppercase tracking-wider">Happy students</p></div>
          <div class="text-center"><p class="text-2xl md:text-3xl font-bold" style="color:var(--color-teal-dark)">A0–C2</p><p class="text-xs text-gray-500 uppercase tracking-wider">All levels</p></div>
          <div class="text-center"><p class="text-2xl md:text-3xl font-bold" style="color:var(--color-primary)">100%</p><p class="text-xs text-gray-500 uppercase tracking-wider">Online</p></div>
        </div>
      </div>

      <div class="mt-10 md:mt-0 flex justify-center shrink-0">
        <div class="relative rise d3">
          <div class="absolute -inset-6 rounded-full -z-10" style="background:radial-gradient(circle,rgba(247,160,8,.32),transparent 66%)" aria-hidden="true"></div>
          <!-- KEEP the existing <picture> block exactly as it currently is in Hero.astro -->
          <picture>
            <source srcset="/elena-square.avif" type="image/avif" />
            <source srcset="/elena-square.webp" type="image/webp" />
            <img src="/elena-square.jpg" alt="Elena María Ramón Martínez, Spanish teacher" width="512" height="512" fetchpriority="high" class="relative w-52 h-52 md:w-64 md:h-64 object-cover rounded-2xl shadow-lg" />
          </picture>
          <div class="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-md px-4 py-3 text-left" aria-hidden="true">
            <p class="text-[0.6rem] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Word of the day</p>
            <p style="font-family:var(--font-serif);font-style:italic;font-weight:600;color:var(--color-ink)">la aventura</p>
            <p class="text-xs font-bold" style="color:var(--color-teal-dark)">→ adventure</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

> `shadow-rosa/30` requires the `rosa` color token (Task 1) — Tailwind 4 generates colored shadows from theme colors. If your Tailwind version rejects `shadow-rosa/30`, use inline `style="box-shadow:0 12px 26px -6px rgba(227,21,123,.45)"` instead.

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run build && npx vitest run -t "personal greeting"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro tests/build.test.ts
git commit -m "feat(home): Elena-centric hero (greeting, papel picado, gradient CTA, word card)"
```

---

## Task 4: Cultural photo asset

**Files:**
- Create: `public/calle.avif`, `public/calle.webp`, `public/calle.jpg`
- Modify: `scripts/optimize-images.mjs`
- Test: `tests/build.test.ts`

- [ ] **Step 1: Write the failing test**

Add inside `describe("design system (visual uplift)", …)`:

```ts
it("ships the optimized cultural photo for the final CTA", () => {
  expect(existsSync(join(DIST, "calle.avif"))).toBe(true);
  expect(existsSync(join(DIST, "calle.webp"))).toBe(true);
  expect(existsSync(join(DIST, "calle.jpg"))).toBe(true);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run build && npx vitest run -t "cultural photo"`
Expected: FAIL.

- [ ] **Step 3: Download the verified source + generate variants**

The verified, license-free Unsplash source (a colorful colonial Mexican street) is `https://images.unsplash.com/photo-1518105779142-d975f22f1b0a`. Run from the repo root:

```bash
curl -s -L "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1600&q=80&auto=format&fit=crop" -o /tmp/calle-src.jpg
node -e '
import("sharp").then(async ({default: sharp}) => {
  const src = "/tmp/calle-src.jpg";
  await sharp(src).resize(1600, 900, {fit:"cover", position:"centre"}).avif({quality:55}).toFile("public/calle.avif");
  await sharp(src).resize(1600, 900, {fit:"cover", position:"centre"}).webp({quality:80}).toFile("public/calle.webp");
  await sharp(src).resize(1600, 900, {fit:"cover", position:"centre"}).jpeg({quality:82, mozjpeg:true}).toFile("public/calle.jpg");
  console.log("generated public/calle.{avif,webp,jpg}");
});
'
```

Then add the same three lines to `scripts/optimize-images.mjs` (so the variants are regenerable) — locate where it processes `elena.jpg` and add an analogous block reading a committed source (or document that `calle.*` was generated from the Unsplash id above). Add a short attribution comment in the script: `// public/calle.* — Unsplash photo-1518105779142-d975f22f1b0a (Unsplash License)`.

- [ ] **Step 4: Run test to verify pass**

Run: `npm run build && npx vitest run -t "cultural photo"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/calle.avif public/calle.webp public/calle.jpg scripts/optimize-images.mjs tests/build.test.ts
git commit -m "feat(assets): add optimized cultural photo for final CTA"
```

---

## Task 5: Final CTA (ReadyToStart) with cultural photo

**Files:**
- Modify: `src/components/ReadyToStart.astro`
- Test: `tests/build.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("final CTA uses the cultural photo behind a scrim", () => {
  const $ = readPage("/");
  const html = $.html();
  expect(html).toMatch(/calle\.(avif|webp|jpg)/);
  expect($("a:contains('Schedule a free')").length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run and verify failure** — `npm run build && npx vitest run -t "final CTA uses"` → FAIL.

- [ ] **Step 3: Implement**

Replace the `<section>` body in `src/components/ReadyToStart.astro` (keep the `bookingUrl` frontmatter and the existing CTA text "Schedule a free 20-minute call"):

```astro
<section class="relative overflow-hidden text-center text-white">
  <picture aria-hidden="true">
    <source srcset="/calle.avif" type="image/avif" />
    <source srcset="/calle.webp" type="image/webp" />
    <img src="/calle.jpg" alt="" loading="lazy" decoding="async" class="absolute inset-0 w-full h-full object-cover object-[center_40%]" />
  </picture>
  <div class="absolute inset-0" aria-hidden="true" style="background:linear-gradient(120deg,rgba(0,59,179,.92),rgba(227,21,123,.5) 60%,rgba(247,160,8,.45))"></div>
  <div class="relative max-w-4xl mx-auto px-6 py-20">
    <p class="mb-3" lang="es" style="font-family:var(--font-serif);font-style:italic;color:rgba(255,255,255,.85)">¿Listo para empezar?</p>
    <h2 class="text-2xl md:text-3xl font-bold mb-8">Ready to Start Your Spanish Adventure?</h2>
    <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
       class="inline-block bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg shadow-black/20">
      Schedule a free 20-minute call
    </a>
  </div>
</section>
```

- [ ] **Step 4: Run test to verify pass** — `npm run build && npx vitest run -t "final CTA uses"` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ReadyToStart.astro tests/build.test.ts
git commit -m "feat(home): final CTA over cultural photo with multi-color scrim"
```

---

## Task 6: Section restyle — tints + Fraunces accent eyebrows

This task restyles `HowItWorks`, `WhyChoose`, `About`, `Pricing`, `Testimonials`, `FAQ`. **No copy changes.** For each, do two things:

(a) **Section tint** — add the tint class to the section element (or its top-level wrapper), replacing the plain `bg-white`/`bg-cream`:

| Component | Section tint class |
|---|---|
| HowItWorks | `tint-peach` |
| WhyChoose | `tint-rosa` |
| About | `tint-warm` |
| Pricing | (keep `bg-white`) |
| Testimonials | `tint-teal` |
| FAQ | `tint-amber` |

(b) **Accent eyebrow** — each section already has the eyebrow pattern:
```html
<p class="flex items-center justify-center gap-3 mb-3">
  <span class="w-8 h-px bg-primary/25" aria-hidden="true"></span>
  <span lang="es" class="text-base italic text-primary/50">…</span>
  <span class="w-8 h-px bg-primary/25" aria-hidden="true"></span>
</p>
```
Change the **middle span** to Fraunces italic in the section's **text-safe** accent color, and tint the two rule spans to match. Use these (all text-AA-safe except where noted):

| Component | Eyebrow text color | Rule span color |
|---|---|---|
| HowItWorks | `var(--color-terracotta)` | `bg-terracotta/40` |
| WhyChoose | `var(--color-rosa)` | `bg-rosa/40` |
| About | `var(--color-teal-dark)` | `bg-teal/40` |
| Pricing | `var(--color-primary)` (keep) | `bg-primary/25` (keep) |
| Testimonials | `var(--color-teal-dark)` | `bg-teal/40` |
| FAQ | `var(--color-terracotta)` | `bg-terracotta/40` |

Apply to the middle span like: `<span lang="es" class="text-base" style="font-family:var(--font-serif);font-style:italic;color:var(--color-terracotta)">Cómo funciona</span>`.

- [ ] **Step 1: HowItWorks** — apply tint `tint-peach` to its `<section>`; eyebrow → terracotta; color the two step icon tiles: step 1 chip `style="background:rgba(227,21,123,.12)"` with icon `style="color:var(--color-rosa)"`, step 2 chip `rgba(15,155,155,.16)` icon `color:var(--color-teal)`. Keep the numbered badge blue.

- [ ] **Step 2: WhyChoose** — tint `tint-rosa`; eyebrow → rosa. Give the 4 benefit cards colored top-borders + matching icon chips by card index (1-based):
  - card 1: `border-t-4` + `style="border-top-color:var(--color-marigold)"`, icon chip `background:rgba(247,160,8,.16);color:var(--color-marigold)`
  - card 2: rosa — `border-top-color:var(--color-rosa)`, chip `rgba(227,21,123,.12)/color rosa`
  - card 3: teal — `border-top-color:var(--color-teal)`, chip `rgba(15,155,155,.16)/color teal`
  - card 4: terracotta — `border-top-color:var(--color-terracotta)`, chip `rgba(193,80,46,.14)/color terracotta`
  (Marigold here is an icon glyph on a tinted chip + a 4px border — decorative, not text; acceptable. Keep card body text gray.)

- [ ] **Step 3: About** — tint `tint-warm`; eyebrow → teal-dark. Keep Elena's `<picture>` and the `shrink-0` fix already present; remove no copy. Optionally wrap the portrait in a white frame (`border-4 border-white rounded-2xl shadow-lg`) to match the mockup.

- [ ] **Step 4: Pricing** — keep `bg-white`; eyebrow stays blue. Change ONLY the highlighted plan's badge to marigold: on the "Most popular" badge span add `style="background:var(--color-marigold);color:#3a2400"` (decorative chip, AA-safe dark text on marigold). Leave Duo/Small Group badges blue. Prices/plans unchanged.

- [ ] **Step 5: Testimonials** — tint `tint-teal`; eyebrow → teal-dark. **Do not touch any `quote` strings or the `featured`/`testimonials` arrays.** Only the section background + eyebrow change.

- [ ] **Step 6: FAQ** — tint `tint-amber`; eyebrow → terracotta. Accordion behavior + copy unchanged.

- [ ] **Step 7: Build, run full suite, eyeball**

Run: `npm run build && npx vitest run`
Expected: all tests PASS (the testimonials-verbatim and structure tests confirm copy is intact).

- [ ] **Step 8: Commit**

```bash
git add src/components/HowItWorks.astro src/components/WhyChoose.astro src/components/About.astro src/components/Pricing.astro src/components/Testimonials.astro src/components/FAQ.astro
git commit -m "feat(home): warm tints + Fraunces accent eyebrows + colored icons across sections"
```

---

## Task 7: Layout nav/footer accent

**Files:**
- Modify: `src/layouts/Layout.astro`

- [ ] **Step 1: Recolor the logo accent (if present)** — if the nav logo has a decorative dot/square, set it to a small solid marigold circle: `style="background:var(--color-marigold)"` with `rounded-full`. If the current logo is text-only, add a small `<span aria-hidden="true" class="inline-block w-3 h-3 rounded-full align-middle mr-2" style="background:var(--color-marigold)"></span>` before "Elenka Spanish". Nav links/CTA stay blue.

- [ ] **Step 2: Footer** — leave structure/links as-is. (No talavera strip — none exists in the real footer.)

- [ ] **Step 3: Build + verify nav/footer unchanged structurally**

Run: `npm run build && npx vitest run`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat(nav): warm logo accent"
```

---

## Task 8: Update CLAUDE.md design rules

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace the "Color palette" section**

In `CLAUDE.md`, replace the current Color palette rules (the monochrome blue+cream / "Do NOT add accent colors" block) with:

```markdown
### Color palette

- **Primary / brand anchor:** `#004de5` (blue) — brand, links, headings, primary blue CTAs, `theme-color`, JSON-LD. Do not change the brand blue (favicons/manifest/OG depend on it).
- **Background:** `#fefdf8` (cream) base; soft warm tints per section (`.tint-peach/.tint-rosa/.tint-warm/.tint-teal/.tint-amber` in `global.css`).
- **Warm accents (Mexican palette):** rosa `#e3157b`, marigold `#f7a008`, amber `#ffb703`, terracotta `#c1502e`, teal `#0f9b9b`, teal-dark `#0a7d7d`. Use as accents, not fills — at most one dominant accent per section.
- **WCAG AA accent rules (enforced):** text-safe accents are blue, ink `#16243f`, terracotta (4.71:1), rosa (4.51:1), teal-dark (4.95:1). Teal `#0f9b9b` is large-text/icons/borders only. **Marigold/amber are decorative only (gradients/fills/chip backgrounds) — never text or contrast-critical icons on light.** Body/secondary text stays `text-gray-800/600/500`. Never `text-gray-400` or lighter.
- **Feedback:** `text-green-700` correct, `text-red-600` errors (unchanged).
```

- [ ] **Step 2: Add typography + motion + cultural notes**

Under Typography, add: `**Serif accent:** Fraunces (italic) via Google Fonts — used for the "Hola, soy Elena" greeting and accent words (e.g. *aventura*) and section eyebrows. Manrope remains the body/heading font.`

Add a new subsection:

```markdown
### Motion & cultural elements

- **Motion is minimal and gated:** only `rise` (hero fade-up), `sway` (papel picado), and `flow` (CTA gradient) keyframes, all disabled under `@media (prefers-reduced-motion: reduce)`. Do not add ambient motion without the guard.
- **Papel picado:** the `PapelPicado.astro` SVG banner is the signature cultural motif (hero). The talavera diagonal-stripe motif was considered and intentionally removed — do not reintroduce it.
- **Cultural photography:** license-free (Unsplash/Pexels) + Elena's own portrait; optimized to AVIF/WebP/JPG via `scripts/optimize-images.mjs`; served with plain `<img>`/`<picture>` (never astro:assets/sharp — breaks CF Pages).
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update design rules for the colorful Elena-centric system"
```

---

## Task 9: Final verification

**Files:** none (verification + fixups only)

- [ ] **Step 1: Full build + test suite**

Run: `npm test` (= `astro build && vitest run`)
Expected: all tests PASS. If any pre-existing assertion legitimately broke due to a markup change, fix the assertion to match the new (correct) output — do NOT loosen a meaningful check. Re-run until green.

- [ ] **Step 2: Accessibility audit**

Run: `node scripts/a11y-audit.mjs`
Expected: 0 findings across pages. Fix any flagged missing alt/labels.

- [ ] **Step 3: Manual contrast pass**

Confirm no accent color is used as small text in violation of the rule in the File Structure header (grep components for `color:var(--color-marigold)` / `text-marigold` on text elements; there should be none on body/small text). Confirm the hero greeting, eyebrows, and stat numbers use only text-safe accents.

- [ ] **Step 4: Manual visual check**

Run: `npm run preview` and open the printed URL. Compare against the mockup (`/.superpowers/brainstorm/51988-1781517158/content/home-elena-vibrant.html`). Check: hero greeting + papel picado + gradient CTA (no seam) + word card; section tints + accent eyebrows; colored Why-Choose cards; About portrait; pricing marigold badge; final CTA photo+scrim; reduced-motion (toggle OS setting) stills the animations. Test at 375px width.

- [ ] **Step 5: Verify a game page still renders**

Open `/games/flashcards` in preview — confirm nav/footer/fonts inherited cleanly and the game UI still works (blue/cream). No regressions.

- [ ] **Step 6: Final commit (if fixups were made)**

```bash
git add -A
git commit -m "test: align assertions + a11y fixups for visual uplift"
```

- [ ] **Step 7: Report for merge decision** — summarize results; do NOT merge to `main` or push without explicit user approval (push to `main` triggers the Cloudflare production deploy).
```
