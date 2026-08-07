# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```sh
npm install        # Install dependencies
npm run dev        # Dev server at http://localhost:4321
npm run build      # Production build → ./dist/ (static output)
npm run preview    # Preview production build locally
```

No linter or formatter is configured. Tests: `npm test` (production build + vitest assertions over `dist/`), also run in CI (`.github/workflows/ci.yml`).

Requires Node.js >=22.12.0. Deployed to Cloudflare Workers Builds: push to `main` triggers `npm run build` then `npx wrangler deploy`, which serves `./dist` as static assets per `wrangler.jsonc` (no Worker script, no SSR adapter — keep it that way). Site: https://elenkaspanish.com

## Architecture

**Static site built with Astro 7 + Tailwind CSS 4.** Zero client-side JavaScript by default — games use inline `<script>` blocks with vanilla JS, no framework hydration. The homepage additionally ships three tiny progressive-enhancement scripts (seasonal papel-picado swap, daily word-of-the-day, EsTip width measurement); with JS disabled it renders the year-round banner, the fallback word, and Spanish-sized swap boxes.

### Key directories

- `src/pages/` — File-based routing. Each `.astro` file = one page.
- `src/pages/games/` — Interactive Spanish learning games + index hub.
- `src/data/` — Shared TypeScript data modules (vocabulary, verbs, sentences, accents). Pure exports, no components. All games import from here.
- `src/components/` — Homepage section components (Hero, Pricing, Testimonials, etc.), assembled in `src/pages/index.astro`.
- `src/layouts/Layout.astro` — Global shell: sticky nav, mobile hamburger, footer, SEO meta (Open Graph, JSON-LD), font preloading, skip-to-content link, floating WhatsApp button, sticky mobile CTA bar.

### Game architecture pattern

Every game page follows the same structure:

1. **Frontmatter** imports Layout + data module (e.g., `import { gapSentences } from "../../data/fill-the-gap"`)
2. **HTML** defines the game UI with `id`-based elements (progress bar, feedback, results screen)
3. **`<script define:vars={{ data }}>`** passes server-side data into client JS as serialized variables
4. **Vanilla JS** implements: `start()` → `showQuestion()` → `handleAnswer()` → `advance()` → results
5. **localStorage persistence** with 1-hour expiry: `save()`, `load()`, `clear()` using a unique `GK` key per game
6. Wrong answers show a "Continue" button (user-paced learning); correct answers auto-advance

### External integrations

- **Google Calendar** — Booking link in Hero and Pricing components
- **Web Speech API** — Listening Quiz uses browser speech synthesis (prefers es-MX voice)

## Design rules

Follow these rules strictly when making visual changes. Do NOT introduce new colors, patterns, or styles that break these conventions.

### Color palette

- **Primary / brand anchor:** `#004de5` (blue) — brand, links, headings, primary blue CTAs, `theme-color`, JSON-LD. Do not change the brand blue (favicons/manifest/OG depend on it).
- **Background:** `#fefdf8` (cream) base; soft warm tints per section (`.tint-peach/.tint-rosa/.tint-warm/.tint-teal/.tint-mist/.tint-amber` in `global.css`).
- **Warm accents (Mexican palette):** rosa `#e3157b`, marigold `#f7a008`, amber `#ffb703`, terracotta `#c1502e`, teal `#0f9b9b`, teal-dark `#0a7d7d`. Use as accents, not fills — at most one dominant accent per section.
- **WCAG AA accent rules (enforced):** text-safe accents are blue, ink `#16243f`, terracotta (4.71:1), rosa (4.51:1), teal-dark (4.95:1). Teal `#0f9b9b` is large-text/icons/borders only. **Marigold/amber are decorative only (gradients/fills/chip backgrounds) — never text or contrast-critical icons on light.** Body/secondary text stays `text-gray-800/600/500`. Never `text-gray-400` or lighter.
- **Feedback:** `text-green-700` correct, `text-red-600` errors (unchanged).

### Typography

- **Font:** Manrope (400 + 700 weights only), defined in `src/styles/global.css`
- **Serif accent:** Fraunces (italic) via Google Fonts — used for the "Hola, soy Elena" greeting, accent words (e.g. *aventura*), and section eyebrows. Manrope remains the body/heading font.
- **Headings:** `font-bold text-primary`. Page h1: `text-3xl md:text-4xl`. Section h2: `text-2xl md:text-3xl`.
- **Body text:** `text-gray-600 leading-relaxed`

### Spacing

- **Homepage sections:** `py-16` vertical padding consistently
- **Game pages:** `py-16` vertical padding (matching homepage)
- **Max widths:** `max-w-4xl` for content sections, `max-w-2xl` for game pages, `max-w-5xl` for pricing
- **Grid gaps:** `gap-8` for content grids, `gap-6` for card grids

### Components

- **Cards:** `rounded-xl border border-gray-200 shadow-sm` at rest, `hover:shadow-md hover:-translate-y-0.5` on interactive cards
- **Primary buttons (CTA):** `bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/20`
- **Standard buttons:** `px-6 py-3 rounded-lg font-bold`
- **Decorative elements:** Use `bg-primary/5` or `bg-primary/10` blobs/patterns, always `aria-hidden="true"`
- **Icons:** Heroicons (outline, stroke-width 1.5). Icon containers: `bg-primary/10 rounded-xl`

### Motion & cultural elements

- **Motion is minimal and gated:** only `rise` (hero fade-up), `sway` (papel picado), and `flow` (CTA gradient) keyframes, all disabled under `@media (prefers-reduced-motion: reduce)`. Do not add ambient motion without the guard.
- **Papel picado:** the `PapelPicado.astro` SVG banner is the signature cultural motif (hero). The talavera diagonal-stripe motif was considered and intentionally removed — do not reintroduce it.
- **Cultural photography:** license-free (Unsplash/Pexels) + Elena's own portrait; optimized to AVIF/WebP/JPG via `scripts/optimize-images.mjs`; served with plain `<img>`/`<picture>` (never astro:assets/sharp — breaks CF Pages).
- **Seasonal papel picado:** variants (cuts + palettes + date windows) live in `src/data/picado-seasons.ts` — patrias Sep 1–30, muertos Oct 15–Nov 8, navidad Nov 15–Jan 8; `PapelPicado.astro` swaps them client-side from the visitor's date. Add new holidays there, not in the component.
- **Inline Spanish:** wrap any Spanish word/phrase inside English copy in `<EsTip en="…">` (`src/components/EsTip.astro`) — on hover/focus/tap the word morphs into its English translation: a measure script records both faces' widths so the box width animates and neighbors glide aside (reduced-motion-gated, correct `lang` tags on both faces; no-JS falls back to a Spanish-sized box). Proper nouns keep a plain `lang="es"` span, no translation.

### Mobile optimization

- All interactive elements must have **minimum 44x44px touch targets** (use `py-3`+ padding on buttons)
- JS-created buttons must include `cursor-pointer` in className
- Fixed-width elements must use responsive alternatives (e.g., `w-full max-w-64` instead of `w-64`)
- Test grids on 375px viewport — use `sm:` breakpoints for multi-column layouts
- Progress bars: `h-2.5` (not h-2)

### Accessibility

- `aria-live="polite"` on all dynamic feedback elements
- `role="progressbar"` with `aria-valuenow/min/max` on progress bars
- `aria-hidden="true"` on decorative elements (emojis, SVG patterns, blobs)
- `cursor-pointer` on all clickable elements
- Global `:focus-visible` ring defined in CSS — do not override

### Images

- Serve images from `public/` directory with plain `<img>` tags (do NOT use Astro's `<Image>` component — it requires `sharp` which fails on Cloudflare Pages build)

## Content rules

- **Never rewrite testimonial text.** Testimonials in `src/components/Testimonials.astro` are real quotes from real students. Do not shorten, rephrase, rearrange, or otherwise alter the wording. You may change layout/styling around them but the `quote` strings must remain exactly as written.

## Adding a new game

1. Create data in `src/data/` if needed (export typed arrays)
2. Create `src/pages/games/your-game.astro` following the existing pattern
3. Add entry to the `games` array in `src/data/games.ts` (drives the hub grid AND the BookingCta related-games rotation)
4. Use the standard localStorage persistence pattern (`GK`, `EXP`, `save`/`load`/`clear`)
5. Add `aria-live="polite"` on feedback elements, `role="progressbar"` on progress bars, `cursor-pointer` on all buttons
6. Ensure all touch targets are >=44px and test on 375px mobile viewport
