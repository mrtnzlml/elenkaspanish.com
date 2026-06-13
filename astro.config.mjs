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
    const value = out ? new Date(out) : null;
    mtimeCache.set(file, value);
    return value;
  } catch {
    mtimeCache.set(file, null);
    return null;
  }
}

// https://astro.build/config
export default defineConfig({
  site: "https://elenkaspanish.com",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const file = pageFileForUrl(pathname);
        const mtime = gitMtime(file);
        if (mtime) item.lastmod = mtime.toISOString();
        return item;
      },
    }),
  ],
});
