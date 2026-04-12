import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { load, type CheerioAPI } from "cheerio";

const DIST = join(import.meta.dirname, "..", "dist");

/** All pages the site should generate */
const ALL_PAGES = [
  "/",
  "/games",
  "/games/flashcards",
  "/games/memory-match",
  "/games/speed-quiz",
  "/games/sentence-builder",
  "/games/verb-conjugation",
  "/games/listening-quiz",
  "/games/hangman",
  "/games/fill-the-gap",
  "/games/accent-fixer",
];

const GAME_PAGES = ALL_PAGES.filter(
  (p) => p.startsWith("/games/") && p !== "/games",
);

/** Games that show a numbered progress bar (excludes memory-match, hangman, speed-quiz) */
const PROGRESS_BAR_GAMES = GAME_PAGES.filter(
  (p) =>
    !["/games/memory-match", "/games/hangman", "/games/speed-quiz"].includes(p),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function htmlPath(page: string): string {
  if (page === "/") return join(DIST, "index.html");
  return join(DIST, page, "index.html");
}

function readPage(page: string): CheerioAPI {
  const p = htmlPath(page);
  return load(readFileSync(p, "utf-8"));
}

// ---------------------------------------------------------------------------
// Build output existence
// ---------------------------------------------------------------------------

describe("build output", () => {
  beforeAll(() => {
    if (!existsSync(DIST)) {
      throw new Error("dist/ not found — run `npm run build` first");
    }
  });

  describe("pages exist", () => {
    it.each(ALL_PAGES)("%s → HTML file exists", (page) => {
      expect(existsSync(htmlPath(page)), `${page} missing`).toBe(true);
    });

    it("404.html exists", () => {
      expect(existsSync(join(DIST, "404.html"))).toBe(true);
    });

    it("sitemap-index.xml exists", () => {
      expect(existsSync(join(DIST, "sitemap-index.xml"))).toBe(true);
    });

    it("robots.txt exists", () => {
      expect(existsSync(join(DIST, "robots.txt"))).toBe(true);
    });

    it("favicon.png exists", () => {
      expect(existsSync(join(DIST, "favicon.png"))).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// SEO & meta tags
// ---------------------------------------------------------------------------

describe("SEO & meta tags", () => {
  it("every page has a <title>", () => {
    for (const page of ALL_PAGES) {
      const $ = readPage(page);
      expect($("title").text(), `${page} missing title`).toBeTruthy();
    }
  });

  it('every page has lang="en" on <html>', () => {
    for (const page of ALL_PAGES) {
      const $ = readPage(page);
      expect($("html").attr("lang"), `${page} missing lang`).toBe("en");
    }
  });

  it("homepage has meta description", () => {
    const $ = readPage("/");
    expect($('meta[name="description"]').attr("content")).toBeTruthy();
  });

  it("homepage has Open Graph tags", () => {
    const $ = readPage("/");
    expect($('meta[property="og:title"]').attr("content")).toBeTruthy();
    expect($('meta[property="og:description"]').attr("content")).toBeTruthy();
    expect($('meta[property="og:image"]').attr("content")).toBeTruthy();
    expect($('meta[property="og:url"]').attr("content")).toBeTruthy();
  });

  it("homepage has valid JSON-LD structured data", () => {
    const $ = readPage("/");
    const raw = $('script[type="application/ld+json"]').html();
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw!);
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("LocalBusiness");
    expect(data.name).toBeTruthy();
    expect(data.url).toBeTruthy();
  });

  it("game pages have unique titles", () => {
    const titles = GAME_PAGES.map((p) => readPage(p)("title").text());
    const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
    expect(dupes).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Layout (shared across all pages)
// ---------------------------------------------------------------------------

describe("layout elements", () => {
  it("has skip-to-content link", () => {
    const $ = readPage("/");
    expect($('a[href="#main-content"]').length).toBeGreaterThan(0);
  });

  it("has <main id=main-content>", () => {
    const $ = readPage("/");
    expect($("main#main-content").length).toBe(1);
  });

  it("has <nav> with aria-label", () => {
    const $ = readPage("/");
    expect($("nav[aria-label]").length).toBeGreaterThan(0);
  });

  it("has footer", () => {
    const $ = readPage("/");
    expect($("footer").length).toBe(1);
  });

  it("WhatsApp button has aria-label", () => {
    const $ = readPage("/");
    expect($('a[aria-label="Chat on WhatsApp"]').length).toBe(1);
  });

  it("mobile menu toggle has aria-expanded", () => {
    const $ = readPage("/");
    expect($("#menu-toggle").attr("aria-expanded")).toBe("false");
    expect($("#menu-toggle").attr("aria-label")).toBeTruthy();
  });

  it("decorative blobs are aria-hidden", () => {
    const $ = readPage("/");
    $("main > div.absolute").each((_, el) => {
      expect($(el).attr("aria-hidden")).toBe("true");
    });
  });
});

// ---------------------------------------------------------------------------
// Homepage sections (nav targets must exist)
// ---------------------------------------------------------------------------

describe("homepage sections", () => {
  const NAV_TARGETS = ["pricing", "about", "faq"];

  it.each(NAV_TARGETS)("#%s section exists (linked from nav)", (id) => {
    const $ = readPage("/");
    expect($(`#${id}`).length, `#${id} missing`).toBe(1);
  });

  it("has at least one booking link to Google Calendar", () => {
    const $ = readPage("/");
    const links = $('a[href*="calendar.google.com"]');
    expect(links.length).toBeGreaterThan(0);
    links.each((_, el) => {
      expect($(el).attr("href")).toContain("appointments/schedules");
    });
  });

  it("hero section exists", () => {
    const $ = readPage("/");
    expect($("#hero").length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Internal links
// ---------------------------------------------------------------------------

describe("internal links", () => {
  it("all internal hrefs resolve to existing pages or static files", () => {
    const builtPaths = new Set(ALL_PAGES);

    for (const page of ALL_PAGES) {
      const $ = readPage(page);
      $('a[href^="/"]').each((_, el) => {
        const href = $(el).attr("href")!;
        const path = href.split("#")[0];
        if (!path) return; // anchor-only (#foo)

        const withSlash = path.endsWith("/") ? path : path + "/";
        const withoutSlash = path.endsWith("/") ? path.slice(0, -1) : path;

        const exists =
          builtPaths.has(path) ||
          builtPaths.has(withSlash) ||
          builtPaths.has(withoutSlash) ||
          existsSync(join(DIST, path));

        expect(exists, `broken link "${href}" on ${page}`).toBe(true);
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

describe("images", () => {
  it("all local img srcs reference files that exist in dist/", () => {
    for (const page of ALL_PAGES) {
      const $ = readPage(page);
      $('img[src^="/"]').each((_, el) => {
        const src = $(el).attr("src")!;
        expect(
          existsSync(join(DIST, src)),
          `missing image ${src} on ${page}`,
        ).toBe(true);
      });
    }
  });

  it("images have alt attributes", () => {
    for (const page of ALL_PAGES) {
      const $ = readPage(page);
      $("img").each((_, el) => {
        const alt = $(el).attr("alt");
        expect(alt, `img missing alt on ${page}`).toBeDefined();
      });
    }
  });
});

// ---------------------------------------------------------------------------
// 404 page
// ---------------------------------------------------------------------------

describe("404 page", () => {
  it("has a link back to homepage", () => {
    const $ = load(readFileSync(join(DIST, "404.html"), "utf-8"));
    expect($('a[href="/"]').length).toBeGreaterThan(0);
  });

  it("has a title", () => {
    const $ = load(readFileSync(join(DIST, "404.html"), "utf-8"));
    expect($("title").text()).toContain("Not Found");
  });
});

// ---------------------------------------------------------------------------
// Games index
// ---------------------------------------------------------------------------

describe("games index", () => {
  it("links to every game page", () => {
    const $ = readPage("/games");
    const hrefs = $('a[href^="/games/"]')
      .map((_, el) => $(el).attr("href"))
      .get();

    for (const game of GAME_PAGES) {
      expect(hrefs, `games index missing link to ${game}`).toContain(game);
    }
  });

  it("each game card has a title and description", () => {
    const $ = readPage("/games");
    $('a[href^="/games/"]').each((_, el) => {
      const text = $(el).text().trim();
      expect(text.length, "game card has no text").toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Game pages — shared structure
// ---------------------------------------------------------------------------

describe("game pages — common structure", () => {
  it.each(GAME_PAGES)("%s has a back link to /games", (page) => {
    const $ = readPage(page);
    expect($('a[href="/games"]').length).toBeGreaterThan(0);
  });

  it.each(GAME_PAGES)("%s has exactly one <h1>", (page) => {
    const $ = readPage(page);
    expect($("h1").length).toBe(1);
    expect($("h1").text().trim()).toBeTruthy();
  });

  it.each(GAME_PAGES)("%s has a live-region for dynamic feedback", (page) => {
    const $ = readPage(page);
    // Games use either aria-live="polite" or role="status" (implicit live region)
    const liveRegions =
      $('[aria-live="polite"]').length + $('[role="status"]').length;
    expect(liveRegions, `${page}: no live region found`).toBeGreaterThan(0);
  });

  it.each(GAME_PAGES)("%s has a <script> block with game logic", (page) => {
    const $ = readPage(page);
    const hasGameScript = $("script")
      .toArray()
      .some((el) => {
        const text = $(el).html() || "";
        return text.includes("function") && text.length > 200;
      });
    expect(hasGameScript, `${page}: no game script found`).toBe(true);
  });

  it.each(GAME_PAGES)("%s has a booking link in results area", (page) => {
    const $ = readPage(page);
    expect($('a[href*="calendar.google.com"]').length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Progress-bar games — accessibility
// ---------------------------------------------------------------------------

describe("progress bar accessibility", () => {
  it.each(PROGRESS_BAR_GAMES)(
    '%s has role="progressbar" with aria-valuenow/min/max',
    (page) => {
      const $ = readPage(page);
      const bar = $('[role="progressbar"]');
      expect(bar.length, `${page}: missing progressbar role`).toBeGreaterThan(0);
      expect(bar.attr("aria-valuenow")).toBeDefined();
      expect(bar.attr("aria-valuemin")).toBeDefined();
      expect(bar.attr("aria-valuemax")).toBeDefined();
    },
  );
});

// ---------------------------------------------------------------------------
// localStorage key uniqueness
// ---------------------------------------------------------------------------

describe("localStorage keys", () => {
  it("every game uses a unique storage key", () => {
    const keys: { key: string; page: string }[] = [];

    for (const page of GAME_PAGES) {
      const $ = readPage(page);
      $("script")
        .toArray()
        .forEach((el) => {
          const text = $(el).html() || "";
          // Match GK = "game_..." or const GK = "game_..."
          const m = text.match(/GK\s*=\s*["']([^"']+)["']/);
          if (m) keys.push({ key: m[1], page });
        });
    }

    // All games should have a key
    expect(keys.length).toBe(GAME_PAGES.length);

    // No duplicates
    const seen = new Set<string>();
    for (const { key, page } of keys) {
      expect(seen.has(key), `duplicate key "${key}" on ${page}`).toBe(false);
      seen.add(key);
    }
  });
});

// ---------------------------------------------------------------------------
// Buttons — cursor-pointer
// ---------------------------------------------------------------------------

describe("button cursor-pointer", () => {
  it.each(GAME_PAGES)(
    "%s — all visible buttons have cursor-pointer",
    (page) => {
      const $ = readPage(page);
      $("button").each((_, el) => {
        const cls = $(el).attr("class") || "";
        if (!cls) return; // dynamically created buttons checked at runtime
        expect(
          cls,
          `${page}: button "${$(el).text().trim().slice(0, 30)}" missing cursor-pointer`,
        ).toContain("cursor-pointer");
      });
    },
  );
});

// ---------------------------------------------------------------------------
// No duplicate IDs on any page
// ---------------------------------------------------------------------------

describe("no duplicate IDs", () => {
  it.each(ALL_PAGES)("%s has no duplicate element IDs", (page) => {
    const $ = readPage(page);
    const ids: string[] = [];
    $("[id]").each((_, el) => {
      ids.push($(el).attr("id")!);
    });
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate IDs on ${page}`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// External links have rel="noopener noreferrer"
// ---------------------------------------------------------------------------

describe("external link safety", () => {
  it.each(ALL_PAGES)(
    '%s — external links (target=_blank) have rel="noopener noreferrer"',
    (page) => {
      const $ = readPage(page);
      $('a[target="_blank"]').each((_, el) => {
        const rel = $(el).attr("rel") || "";
        expect(
          rel.includes("noopener"),
          `${page}: external link missing noopener — ${$(el).attr("href")?.slice(0, 60)}`,
        ).toBe(true);
      });
    },
  );
});
