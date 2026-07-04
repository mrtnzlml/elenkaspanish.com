# Visual Uplift — Design Spec

**Date:** 2026-06-30
**Status:** Approved (direction); pending spec review → implementation plan
**Scope:** Homepage visual redesign + shared design-system changes (Layout, global styles, tokens, fonts). Practice/games pages inherit the shared design system but keep their functional UI largely unchanged.

## 1. Goal

Elevate elenkaspanish.com from its current intentionally-monochromatic blue + cream minimal look into a **warm, colorful, distinctly Mexican** presentation that puts the teacher, **Elena Ramón**, at the center — while keeping the site fast, accessible (WCAG AA), and shippable on Cloudflare Pages.

This **intentionally supersedes** the current CLAUDE.md design rules ("monochromatic blue + cream", "Do NOT add accent/secondary brand colors"). Updating those rules is part of this work (see §7).

**Visual source of truth:** the approved mockup, preserved at
`/.superpowers/brainstorm/51988-1781517158/content/home-elena-vibrant.html` (rendered via the brainstorm companion). The implementation should match its look and feel.

## 2. Chosen direction — "Hola, soy Elena"

A warm, portrait-forward homepage that fuses three things in every key section: **Elena** (her real photo + a personal voice), **Mexican/Spanish culture** (palette + papel-picado + one cultural photo), and **Spanish learning** (a single tasteful learning cue). Earlier explorations were either too place-focused (no Elena), too busy, or too flat; this is the converged middle: **colorful and lively, but controlled.**

## 3. Design system

### 3.1 Palette

Blue stays the **trust anchor** (brand, links, primary actions, headings). Warm Mexican accents join it, used **as accents, not fills** — cream/white-tinted backgrounds still dominate, with at most one dominant accent color per section.

| Token | Hex | Role |
|---|---|---|
| `--color-primary` (blue) | `#004de5` | Brand, links, headings, primary CTA anchor, theme-color |
| `--color-primary-dark` | `#003bb3` | Hover for blue buttons |
| `--color-rosa` (rosa mexicano) | `#e3157b` | Greeting, gradient CTA, accent eyebrows, stat numbers — passes AA normal text (4.51:1) |
| `--color-marigold` | `#f7a008` | Gradients + decorative fills only — fails AA (2.10:1), **never text or contrast-critical icons** |
| `--color-amber` | `#ffb703` | Gradient partner with marigold — decorative only (1.75:1) |
| `--color-terracotta` | `#c1502e` | Section eyebrow italics, warm accents — passes AA normal text (4.71:1) |
| `--color-teal` | `#0f9b9b` | Icons/borders/large text only (3.40:1) |
| `--color-teal-dark` | `#0a7d7d` | Teal for **small** text (4.95:1) |
| `--color-cream` | `#fefdf8` | Base background (unchanged) |
| `--color-ink` | `#16243f` | Primary heading/portrait-context text |

Section background rhythm: soft warm tints instead of flat white/cream (peach, soft rosa, soft teal), kept very light so text contrast holds.

### 3.2 Typography

- **Manrope** (existing, 400/500/700/800) — body + bold headings. Unchanged loading (Google Fonts v20, preloaded).
- **Add Fraunces** (italic, ~500/600) — the personal greeting ("Hola, soy Elena"), accent words (e.g. *aventura*), and elegant section flourishes. Loaded the same way (Google Fonts, `font-display: swap`, preconnect already present). Keep weights minimal for performance.

### 3.3 Motion (deliberately restrained)

Only **three** ambient animations total, all gentle and all gated behind the existing `@media (prefers-reduced-motion: reduce)`:
1. Hero content **fade-up** on load (staggered).
2. Papel-picado **sway** (subtle rotate).
3. Primary CTA **gradient flow** — a seamless `rosa → marigold → rosa` gradient sliding exactly one tile (no seam/hard edge).

Plus interaction-only effects (hover lift on cards/buttons). No drifting particles, rotating medallions, or multiple competing motions.

### 3.4 Cultural elements

- **Papel picado** — an authentic SVG cut-paper banner (rectangular panels with a symmetric perforated motif that shows the background through, a pointed fringe, hung from a cord). One row in the hero. Implement as a reusable Astro component (`PapelPicado.astro`).
- **Per-section accent color** — How It Works = marigold, Why Choose = rosa, About = terracotta, Testimonials = teal (on eyebrows, icon chips, card top-borders).
- **One cultural photograph** — the final CTA uses a real colorful-street photo behind a blue→rosa→marigold scrim (white text).
- **Removed:** the talavera diagonal-stripe motif (felt aggressive) — not used anywhere.

### 3.5 Components

- **Buttons:** primary booking CTA = warm `rosa→marigold→rosa` gradient (hero); blue solid elsewhere (nav, pricing) as the anchor; secondary = outline.
- **Cards:** rounded-2xl, hairline border, soft shadow, subtle hover lift; Why-Choose cards get a colored top-border + matching colored icon chip.
- **Section header:** bold blue/ink `h2` + a Fraunces-italic Spanish eyebrow in the section's accent color (e.g. *Cómo funciona*, *¿Por qué elegirme?*).

## 4. Page-by-page (homepage)

Section order unchanged (nav → Hero → How It Works → Why Choose → About → Pricing → Testimonials → FAQ → final CTA → footer). All **copy is unchanged**, including testimonials (verbatim — never altered).

- **Hero:** Elena's real portrait (`/elena-square.*` via existing `<picture>`), "Hola, soy Elena" greeting, headline "Your Spanish, your *aventura*.", subhead, warm gradient booking CTA + WhatsApp, microcopy, stats (50+/A0–C2/100%), one "word of the day" flashcard, papel-picado bunting on top, soft glow behind portrait.
- **How It Works / Why Choose / About / Pricing / Testimonials / FAQ:** existing content, restyled with tints, accent eyebrows, colored icon chips/borders. Pricing keeps all three real plans + risk-free guarantee. About reuses Elena's portrait.
- **Final CTA:** cultural photo + multi-color scrim, white text, "Schedule a free 20-minute call".
- **Nav/Footer:** small warm logo accent (solid marigold dot, not a line); footer otherwise unchanged.

## 5. Imagery & sourcing

**Decision (confirmed):** license-free stock (Unsplash/Pexels) for cultural/landmark photos + Elena's existing portrait.

- Elena: existing `public/elena-square.{avif,webp,jpg}` and `public/elena.*` — already optimized, already served via `<picture>`. No new portrait needed.
- Cultural photo(s): the verified Unsplash images used in the mockup (e.g. the colorful colonial street). At implementation time: download, run through the existing `scripts/optimize-images.mjs` to produce AVIF/WebP/JPG, store under `public/`, and record attribution. Serve via plain `<img>`/`<picture>` (NOT astro:assets — sharp breaks the CF Pages build).

## 6. Implementation approach (Astro 6 + Tailwind 4)

Work within the existing component structure; modify in place, don't rebuild.

- **Tokens:** add the new colors to the `@theme` block in `src/styles/global.css` as `--color-rosa`, `--color-marigold`, `--color-amber`, `--color-terracotta`, `--color-teal`, `--color-ink` (Tailwind 4 auto-generates `bg-/text-/border-` utilities). Additive — existing `--color-primary`/`--color-cream` unchanged.
- **Fonts:** add Fraunces `@font-face` + `--font-serif` theme token in `global.css`; add the preload/preconnect in `Layout.astro` next to Manrope.
- **Components:** new `PapelPicado.astro` (SVG) and a small hero flashcard element; restyle `Hero.astro`, `HowItWorks.astro`, `WhyChoose.astro`, `About.astro`, `Pricing.astro`, `Testimonials.astro`, `FAQ.astro`, `ReadyToStart.astro`, and the nav/footer in `Layout.astro`. Per-section tints applied on the section wrappers.
- **Motion:** define the three keyframes in `global.css`; ensure the existing `prefers-reduced-motion` block disables them.

## 7. Backward compatibility & risks

This is the section that matters most for a safe rollout.

1. **CLAUDE.md design rules must be updated** in the same change set: replace the "monochromatic blue + cream / no accent colors" rules with the new palette, accent-usage rules, typography (Fraunces), motion rules, and the papel-picado convention. Otherwise future work will contradict the new design. (Also note talavera was considered and removed.)
2. **Brand/SEO coherence preserved:** blue `#004de5` stays the brand anchor and `theme-color` stays cream `#fefdf8`, so favicons, `site.webmanifest`, OG/Twitter image, and LocalBusiness/Course JSON-LD remain coherent — **no favicon/manifest regeneration needed.**
3. **Accessibility / WCAG AA (hard constraint, currently enforced in CLAUDE.md):** the warm accents are **not all safe as small text** on light backgrounds. Measured contrast ratios vs white (≈ cream), computed for this spec:
   - **Blue `#004de5` 6.58:1, ink `#16243f` 15.46:1, terracotta `#c1502e` 4.71:1, rosa `#e3157b` 4.51:1** — all **pass AA for normal text**. Rosa and terracotta are safe for the accent eyebrows and the greeting.
   - **Teal `#0f9b9b` 3.40:1** — AA for **large text / icons / borders only**; for small text use **`--color-teal-dark` `#0a7d7d` (4.95:1)**.
   - **Marigold `#f7a008` 2.10:1 / amber `#ffb703` 1.75:1** — fail even large-text and graphical thresholds; use **only in gradients and decorative fills**, never as text or contrast-critical icons on light.
   - Rule to add to CLAUDE.md: body/secondary text stays ink/gray; accent colors follow the table above (rosa/terracotta OK for text, teal→teal-dark for small text, marigold/amber decorative only). Verify with the ported `scripts/a11y-audit.mjs` + a manual contrast pass before merge.
4. **Motion:** all new animation honors `prefers-reduced-motion` (already supported since the earlier port). No autoplaying motion without the guard.
5. **Performance:** one added font family (Fraunces, minimal weights) — preload, `font-display: swap`. One added cultural photo — optimized to AVIF/WebP via the existing script. Keep an eye on LCP; the hero LCP image (Elena) preload stays.
6. **Games pages inheritance:** games share `Layout.astro` (nav/footer) + `global.css` (tokens/fonts), so they pick up the new nav/footer/fonts and have the new color utilities available. Their **functional game UI stays as-is** (primarily blue/cream) to limit risk; optionally add light warmth later. Verify a game page still renders correctly after the shared changes.
7. **Tests:** `tests/build.test.ts` is structure/SEO-heavy; most assertions (meta, JSON-LD, picture sources, alt text, a11y attributes, per-game descriptions) should still pass since content/structure are preserved. Any assertion tied to exact markup that legitimately changes will be updated alongside the change. New cultural image/Fraunces additions may warrant a couple of new assertions. Run `npm test` (build + vitest) and the a11y audit before merge; all must pass.
8. **Cloudflare Pages:** keep plain `<img>`/`<picture>` (no astro:assets/sharp). Build command/output unchanged. Nothing in this design requires SSR or new runtime deps.
9. **Rollout:** all work on the `visual-uplift` branch; merge only after build + full test suite + a11y/contrast pass are green. Not pushed to `main` (which triggers production deploy) without explicit approval.

## 8. Out of scope / non-goals

- No copy rewrites (testimonials especially remain verbatim).
- No new pages, routes, or features; no games-logic changes.
- No backend/SSR; no new heavy dependencies.
- Games' in-game visual theming beyond inherited shared changes (possible follow-up).

## 9. Open questions

None blocking. (Imagery sourcing resolved: stock + Elena's existing photo. Scope resolved: full homepage + shared system; games inherit.)
