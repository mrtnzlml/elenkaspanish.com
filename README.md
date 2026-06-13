# elenkaspanish.com

Website for Spanish with Elena Ramón — personalized online Spanish lessons.

Built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com), deployed on [Cloudflare Pages](https://pages.cloudflare.com).

## Pages

- **Homepage** (`/`) — hero, how it works, why choose, about Elena, pricing, testimonials, FAQ, ready-to-start CTA
- **Practice** (`/games`) — 9 interactive Spanish learning games

## Development

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # production build → ./dist/
npm test          # build + run vitest suite
```

Requires Node.js >= 22.12.0.

## Deployment

Connected to Cloudflare Pages. Pushing to `main` triggers a deploy automatically.

**Cloudflare Pages settings:**
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`
