# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```sh
npm run dev        # Dev server at http://localhost:4321
npm run build      # Production build → ./dist/ (static output)
npm run preview    # Preview production build locally
```

Requires Node.js >=22.12.0. Deployed to Cloudflare Pages (push to `main` triggers auto-deploy, build command: `npm run build`, output: `dist`).

## Architecture

**Static site built with Astro 6 + Tailwind CSS 4.** Zero client-side JavaScript by default — games use inline `<script>` blocks with vanilla JS, no framework hydration.

### Key directories

- `src/pages/` — File-based routing. Each `.astro` file = one page.
- `src/pages/games/` — 9 interactive Spanish learning games + index hub.
- `src/data/` — Shared TypeScript data modules (vocabulary, verbs, sentences, accents). Pure exports, no components. All games import from here.
- `src/components/` — Homepage section components (Hero, Pricing, Testimonials, etc.), assembled in `src/pages/index.astro`.
- `src/layouts/Layout.astro` — Global shell: sticky nav (desktop dropdown + mobile hamburger), footer, SEO meta (Open Graph, JSON-LD), font preloading, skip-to-content link.

### Game architecture pattern

Every game page follows the same structure:

1. **Frontmatter** imports Layout + data module (e.g., `import { gapSentences } from "../../data/fill-the-gap"`)
2. **HTML** defines the game UI with `id`-based elements (progress bar, feedback, results screen)
3. **`<script define:vars={{ data }}>`** passes server-side data into client JS as serialized variables
4. **Vanilla JS** implements: `start()` → `showQuestion()` → `handleAnswer()` → `advance()` → results
5. **localStorage persistence** with 1-hour expiry: `save()`, `load()`, `clear()` using a unique `GK` key per game
6. Wrong answers show a "Continue" button (user-paced learning); correct answers auto-advance

### Design system

- Primary: `#004de5`, Background: `#fefdf8` (cream), Font: Manrope
- Theme defined in `src/styles/global.css` via `@theme` block
- All colors meet WCAG AA contrast (gray-500 minimum for text on cream/white, green-700 for success, red-600 for errors)

### External integrations

- **Google Forms** — Questionnaire embed in `src/pages/questionnaire.astro`
- **Google Calendar** — Booking link in Hero and Pricing components
- **Excalidraw** — Collaborative whiteboard embed in `src/pages/whiteboard.astro`
- **Web Speech API** — Listening Quiz uses browser speech synthesis (prefers es-MX voice)

## Adding a new game

1. Create data in `src/data/` if needed (export typed arrays)
2. Create `src/pages/games/your-game.astro` following the existing pattern
3. Add entry to the `games` array in `src/pages/games/index.astro`
4. Use the standard localStorage persistence pattern (`GK`, `EXP`, `save`/`load`/`clear`)
5. Add `aria-live="polite"` on feedback elements, `role="progressbar"` on progress bars, `cursor-pointer` on all buttons
