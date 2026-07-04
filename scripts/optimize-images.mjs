#!/usr/bin/env node
// One-off image optimizer. Run manually when source images change:
//   node scripts/optimize-images.mjs
// Uses `sharp` (already a transitive dep via Astro).

import sharp from "sharp";
import { stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

// Favicon variants. Source is a 512×512 RGBA PNG. Browser tab icon renders at
// 16×16 or 32×32; apple-touch-icon spec is 180×180. Serving the 512 master
// everywhere forces every visitor to download ~8.5 KB for an icon the
// browser will then downsample to 32 pixels. The low-entropy, flat-color
// source compresses well with palette mode, so the variants are small.
const favicons = [
  { src: "public/favicon.png", out: "public/favicon-32.png", size: 32 },
  { src: "public/favicon.png", out: "public/favicon-180.png", size: 180 },
];

const targets = [
  // Full-size variants. elena.jpg (512×908 portrait) is kept unchanged so it
  // continues to serve as og:image / JSON-LD image. Its webp/avif mirrors are
  // retained too — nothing in the tree references them today (the picture tags
  // use the -square variants below), but they're cheap to keep as siblings.
  { src: "public/elena.jpg", webp: "public/elena.webp", avif: "public/elena.avif" },
  // Square 512×512 crop used by Hero + About <picture> blocks. Both render at
  // a 1:1 aspect ratio via object-cover, so the portrait source wastes ~43% of
  // downloaded pixels. The extract region below matches the default
  // object-position: center cover crop of the portrait, so the displayed face
  // composition is pixel-identical to the old image.
  {
    src: "public/elena.jpg",
    webp: "public/elena-square.webp",
    avif: "public/elena-square.avif",
    jpg: "public/elena-square.jpg",
    extract: { left: 0, top: 198, width: 512, height: 512 },
  },
];

function kb(bytes) {
  return (bytes / 1024).toFixed(1) + " KB";
}

for (const t of targets) {
  const srcPath = resolve(ROOT, t.src);
  const webpPath = resolve(ROOT, t.webp);
  const avifPath = resolve(ROOT, t.avif);

  const srcSize = (await stat(srcPath)).size;

  const pipe = () => {
    const p = sharp(srcPath);
    return t.extract ? p.extract(t.extract) : p;
  };

  await pipe().webp({ quality: 82 }).toFile(webpPath);
  await pipe().avif({ quality: 55 }).toFile(avifPath);
  if (t.jpg) {
    const jpgPath = resolve(ROOT, t.jpg);
    await pipe().jpeg({ quality: 85, mozjpeg: true }).toFile(jpgPath);
    const jpgSize = (await stat(jpgPath)).size;
    console.log(`${t.src}${t.extract ? ` [${t.extract.width}×${t.extract.height} crop]` : ""}: ${kb(srcSize)} (source)`);
    console.log(`  → ${t.jpg}: ${kb(jpgSize)}`);
    const webpSize = (await stat(webpPath)).size;
    const avifSize = (await stat(avifPath)).size;
    console.log(`  → ${t.webp}: ${kb(webpSize)}`);
    console.log(`  → ${t.avif}: ${kb(avifSize)}`);
    continue;
  }

  const webpSize = (await stat(webpPath)).size;
  const avifSize = (await stat(avifPath)).size;

  const pct = (n) => ((1 - n / srcSize) * 100).toFixed(0) + "%";
  console.log(`${t.src}: ${kb(srcSize)} (source)`);
  console.log(`  → ${t.webp}: ${kb(webpSize)} (${pct(webpSize)} smaller)`);
  console.log(`  → ${t.avif}: ${kb(avifSize)} (${pct(avifSize)} smaller)`);
}

// public/calle.* — Unsplash photo-1518105779142-d975f22f1b0a (Unsplash License)
// Cultural hero photo (colorful colonial Mexican street) used by the final CTA.
// The source is a license-free Unsplash photo rather than a file in public/, so
// we fetch it on demand (cached at /tmp) and crop to a 1600×900 16:9 banner.
// Same resize/quality settings as the one-off generation that produced the
// committed variants, so re-running this reproduces them byte-for-byte-ish.
{
  const UNSPLASH_ID = "photo-1518105779142-d975f22f1b0a";
  const srcUrl = `https://images.unsplash.com/${UNSPLASH_ID}?w=1600&q=80&auto=format&fit=crop`;
  const srcPath = "/tmp/calle-src.jpg";
  const resize = { fit: "cover", position: "centre" };

  if (!existsSync(srcPath)) {
    const res = await fetch(srcUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${srcUrl}: ${res.status}`);
    await writeFile(srcPath, Buffer.from(await res.arrayBuffer()));
  }

  const avifPath = resolve(ROOT, "public/calle.avif");
  const webpPath = resolve(ROOT, "public/calle.webp");
  const jpgPath = resolve(ROOT, "public/calle.jpg");

  await sharp(srcPath).resize(1600, 900, resize).avif({ quality: 55 }).toFile(avifPath);
  await sharp(srcPath).resize(1600, 900, resize).webp({ quality: 80 }).toFile(webpPath);
  await sharp(srcPath).resize(1600, 900, resize).jpeg({ quality: 82, mozjpeg: true }).toFile(jpgPath);

  const srcSize = (await stat(srcPath)).size;
  console.log(`public/calle.* [1600×900 cover] from Unsplash ${UNSPLASH_ID}: ${kb(srcSize)} (source)`);
  console.log(`  → public/calle.avif: ${kb((await stat(avifPath)).size)}`);
  console.log(`  → public/calle.webp: ${kb((await stat(webpPath)).size)}`);
  console.log(`  → public/calle.jpg: ${kb((await stat(jpgPath)).size)}`);
}

for (const f of favicons) {
  const srcPath = resolve(ROOT, f.src);
  const outPath = resolve(ROOT, f.out);
  const srcSize = (await stat(srcPath)).size;
  await sharp(srcPath)
    .resize(f.size, f.size)
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  const outSize = (await stat(outPath)).size;
  const pct = ((1 - outSize / srcSize) * 100).toFixed(0) + "%";
  console.log(
    `${f.src} → ${f.out} [${f.size}×${f.size}]: ${kb(srcSize)} → ${kb(outSize)} (${pct} smaller)`,
  );
}

// Maskable icon. Android's adaptive-icon spec masks the icon with a
// launcher-chosen shape (circle, squircle, rounded-square…), cropping up
// to ~10% from each edge — so meaningful content must fit inside the 80%
// diameter "safe zone" circle, and the background must bleed to 512×512.
// The source favicon is a rounded tile (transparent corners) with an "Ele"
// glyph; we scale it to 70% so the glyph lands well inside the safe zone,
// then composite onto a solid canvas matching the favicon's own tile blue
// (#3858e9 — NOT the CSS --color-primary #004de5; the existing icon asset
// uses a slightly different hue and we match THAT so there's no visible
// seam between the inner tile and the bleed). Paired with the existing
// purpose:"any" entry so launchers that don't honor "maskable" fall back.
{
  const size = 512;
  const inner = Math.round(size * 0.7);
  const srcPath = resolve(ROOT, "public/favicon.png");
  const outPath = resolve(ROOT, "public/favicon-maskable.png");
  const srcSize = (await stat(srcPath)).size;
  const innerBuf = await sharp(srcPath).resize(inner, inner).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#3858e9" },
  })
    .composite([{ input: innerBuf, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  const outSize = (await stat(outPath)).size;
  console.log(
    `public/favicon.png → public/favicon-maskable.png [${size}×${size} maskable]: ${kb(srcSize)} → ${kb(outSize)}`,
  );
}
