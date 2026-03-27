# elenkaspanish.com

Website for Spanish with Elena Ramón — personalized online Spanish lessons.

Built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com), deployed on [Cloudflare Pages](https://pages.cloudflare.com).

## Pages

- **Homepage** — hero, how it works, pricing, testimonials, contact
- **FAQ** — frequently asked questions
- **Questionnaire** — embedded Google Form for student intake
- **Whiteboard** — collaborative Excalidraw canvas for lessons
- **Games** — 9 interactive Spanish learning games:
  - Flashcards, Memory Match, Speed Quiz, Sentence Builder
  - Verb Conjugation, Listening Quiz, Hangman
  - Fill the Gap, Accent Fixer

## Development

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # production build → ./dist/
```

Requires Node.js >= 22.

## Deployment

Connected to Cloudflare Pages. Pushing to `main` triggers a deploy automatically.

**Cloudflare Pages settings:**
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`
