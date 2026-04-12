# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```sh
npm install        # Install dependencies
npm run dev        # Dev server at http://localhost:4321
npm run build      # Production build → ./dist/ (static output)
npm run preview    # Preview production build locally
```

No linter, formatter, or test runner is configured — there are no lint/test commands to run.

Requires Node.js >=22.12.0. Deployed to Cloudflare Pages (push to `main` triggers auto-deploy, build command: `npm run build`, output: `dist`, env: `NODE_VERSION=22`). Site: https://elenkaspanish.com

## Architecture

**Static site built with Astro 6 + Tailwind CSS 4.** Zero client-side JavaScript by default — games use inline `<script>` blocks with vanilla JS, no framework hydration.

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

- **Primary (only brand color):** `#004de5` (blue) — headings, buttons, links, icons, progress bars
- **Background:** `#fefdf8` (cream) — body background
- **White sections:** `bg-white` for alternating section backgrounds (WhyChoose, Pricing, Contact)
- **Text:** `text-gray-800` (body), `text-gray-600` (descriptions), `text-gray-500` (secondary/hints)
- **Feedback:** `text-green-700` for correct, `text-red-600` for errors
- **Do NOT add accent/secondary brand colors.** The site is intentionally monochromatic blue + cream.

All text colors must meet **WCAG AA** contrast. Minimum: `text-gray-500` on cream/white backgrounds. Never use `text-gray-400` or lighter for readable text.

### Typography

- **Font:** Manrope (400 + 700 weights only), defined in `src/styles/global.css`
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
- Company logos live in `public/logos/`

## Content rules

- **Never rewrite testimonial text.** Testimonials in `src/components/Testimonials.astro` are real quotes from real students. Do not shorten, rephrase, rearrange, or otherwise alter the wording. You may change layout/styling around them but the `quote` strings must remain exactly as written.

## Adding a new game

1. Create data in `src/data/` if needed (export typed arrays)
2. Create `src/pages/games/your-game.astro` following the existing pattern
3. Add entry to the `games` array in `src/pages/games/index.astro`
4. Use the standard localStorage persistence pattern (`GK`, `EXP`, `save`/`load`/`clear`)
5. Add `aria-live="polite"` on feedback elements, `role="progressbar"` on progress bars, `cursor-pointer` on all buttons
6. Ensure all touch targets are >=44px and test on 375px mobile viewport
