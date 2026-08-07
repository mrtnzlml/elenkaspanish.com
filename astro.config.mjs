// @ts-check
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";

const REPO_ROOT = fileURLToPath(new URL(".", import.meta.url));

/** URL pathname → source file used for git mtime lookup. */
function pageFileForUrl(pathname) {
  if (pathname === "/") return "src/pages/index.astro";
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  const flat = `src/pages/${slug}.astro`;
  if (existsSync(`${REPO_ROOT}${flat}`)) return flat;
  return `src/pages/${slug}/index.astro`;
}

const mtimeCache = new Map();

/** Most recent commit time for `file`, or null if unavailable. */
function gitMtime(file) {
  if (mtimeCache.has(file)) return mtimeCache.get(file);
  const abs = `${REPO_ROOT}${file}`;
  if (!existsSync(abs)) {
    mtimeCache.set(file, null);
    return null;
  }
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", file],
      { cwd: REPO_ROOT, encoding: "utf-8" },
    ).trim();
    if (!out) console.warn(`[sitemap] no git history for ${file} — lastmod omitted`);
    const value = out ? new Date(out) : null;
    mtimeCache.set(file, value);
    return value;
  } catch (err) {
    console.warn(`[sitemap] git lookup failed for ${file} — lastmod omitted (${err?.message ?? err})`);
    mtimeCache.set(file, null);
    return null;
  }
}

/**
 * Latest commit across the shared UI (layout, components, styles, data)
 * that shapes every page. A page's true lastmod is the newer of its own
 * file and this — otherwise a full redesign done in components would leave
 * the sitemap claiming pages are unchanged.
 */
const SHARED_PATHS = ["src/components", "src/layouts", "src/styles", "src/data"];
let sharedMtimeCache;
function sharedMtime() {
  if (sharedMtimeCache !== undefined) return sharedMtimeCache;
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", ...SHARED_PATHS],
      { cwd: REPO_ROOT, encoding: "utf-8" },
    ).trim();
    sharedMtimeCache = out ? new Date(out) : null;
  } catch (err) {
    console.warn(`[sitemap] shared-mtime git lookup failed (${err?.message ?? err})`);
    sharedMtimeCache = null;
  }
  return sharedMtimeCache;
}

// https://astro.build/config
export default defineConfig({
  site: "https://elenkaspanish.com",

  // Astro 7 switched the default to 'jsx', which strips whitespace and line
  // breaks around elements — that silently closes up the gaps between inline
  // elements written across separate lines (nav links, footer links, the
  // inline-block <EsTip> spans). `true` is the pre-v7 lossless mode, which
  // preserves whitespace where it affects visual rendering. Keep it until the
  // markup is audited for JSX whitespace rules.
  compressHTML: true,

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const file = pageFileForUrl(pathname);
        const page = gitMtime(file);
        const shared = sharedMtime();
        const mtime =
          page && shared ? (page > shared ? page : shared) : page || shared;
        if (mtime) item.lastmod = mtime.toISOString();
        return item;
      },
    }),
  ],
});
