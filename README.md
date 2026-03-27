# elenkaspanish.com

Personal website for Spanish with Elena Ramón — online Spanish lessons.

Built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com), deployed on [Cloudflare Pages](https://pages.cloudflare.com).

## Development

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # production build → ./dist/
```

## Deployment

Connected to Cloudflare Pages. Pushing to `main` triggers a deploy automatically.

**Cloudflare Pages settings:**
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: 20

## Setup checklist

- [ ] Add `elena.jpg` photo to `public/`
- [ ] Create a Google Form with the questionnaire fields, then replace the placeholder URL in `src/pages/questionnaire.astro`
- [ ] Connect the GitHub repo to Cloudflare Pages
- [ ] Add custom domain `elenkaspanish.com` in Cloudflare Pages
