import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

function readBuiltCss(): string {
  const dir = join(DIST, "_astro");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(dir, f), "utf-8"))
    .join("\n");
}

function readBuiltJs(): string {
  const dir = join(DIST, "_astro");
  if (!existsSync(dir)) return "";
  return readdirSync(dir)
    .filter((f) => f.endsWith(".js"))
    .map((f) => readFileSync(join(dir, f), "utf-8"))
    .join("\n");
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

    it("sitemap lastmod is present, valid, and reflects shared-component changes", () => {
      const xml = readFileSync(join(DIST, "sitemap-0.xml"), "utf-8");
      const urls = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]);
      expect(urls.length).toBeGreaterThan(0);
      let homeLastmod = "";
      for (const u of urls) {
        const match = u.match(/<lastmod>([^<]+)<\/lastmod>/);
        expect(match, "every URL has a <lastmod>").not.toBeNull();
        expect(
          Number.isNaN(Date.parse(match![1])),
          "lastmod parses as a date",
        ).toBe(false);
        if (u.includes("<loc>https://elenkaspanish.com/</loc>")) {
          homeLastmod = match![1];
        }
      }
      // The homepage is composed from shared components; its lastmod must be
      // at least as new as the last commit touching Hero.astro (regression
      // guard: lastmod once tracked only the page's own file, claiming the
      // homepage was unchanged right after a component-level redesign).
      const heroCommit = execFileSync(
        "git",
        ["log", "-1", "--format=%cI", "--", "src/components/Hero.astro"],
        { cwd: join(import.meta.dirname, ".."), encoding: "utf-8" },
      ).trim();
      expect(homeLastmod, "homepage present in sitemap").not.toBe("");
      expect(Date.parse(homeLastmod)).toBeGreaterThanOrEqual(
        Date.parse(heroCommit),
      );
    });

    it("robots.txt exists", () => {
      expect(existsSync(join(DIST, "robots.txt"))).toBe(true);
    });

    it("favicon.png exists", () => {
      expect(existsSync(join(DIST, "favicon.png"))).toBe(true);
    });

    it("favicon-32.png and favicon-180.png exist", () => {
      expect(existsSync(join(DIST, "favicon-32.png"))).toBe(true);
      expect(existsSync(join(DIST, "favicon-180.png"))).toBe(true);
    });

    it("built CSS honors prefers-reduced-motion (WCAG 2.3.3)", () => {
      const astroDir = join(DIST, "_astro");
      const cssFiles = existsSync(astroDir)
        ? readdirSync(astroDir).filter((f) => f.endsWith(".css"))
        : [];
      expect(cssFiles.length, "built CSS bundle present").toBeGreaterThan(0);
      const css = cssFiles
        .map((f) => readFileSync(join(astroDir, f), "utf-8"))
        .join("\n");
      expect(css).toMatch(/@media[^{]*prefers-reduced-motion[^{]*reduce/);
    });

    it("site.webmanifest exists with required fields and icons resolve", () => {
      const manifestPath = join(DIST, "site.webmanifest");
      expect(existsSync(manifestPath), "site.webmanifest missing").toBe(true);
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      expect(manifest.name, "manifest name").toBeTruthy();
      expect(manifest.short_name, "manifest short_name").toBeTruthy();
      expect(manifest.start_url, "manifest start_url").toBe("/");
      expect(manifest.display, "manifest display").toBeTruthy();
      expect(manifest.theme_color, "manifest theme_color matches meta").toBe(
        "#fefdf8",
      );
      expect(manifest.background_color, "manifest background_color").toBe(
        "#fefdf8",
      );
      expect(
        Array.isArray(manifest.icons) && manifest.icons.length > 0,
        "manifest icons array",
      ).toBe(true);
      for (const icon of manifest.icons) {
        expect(icon.src, "icon src").toBeTruthy();
        const rel = icon.src.replace(/^\//, "");
        expect(
          existsSync(join(DIST, rel)),
          `manifest icon ${icon.src} missing from dist`,
        ).toBe(true);
      }
    });

    it("manifest declares W3C-standard categories for store/launcher classification", () => {
      const manifest = JSON.parse(
        readFileSync(join(DIST, "site.webmanifest"), "utf-8"),
      );
      expect(
        Array.isArray(manifest.categories),
        "manifest.categories must be an array",
      ).toBe(true);
      expect(manifest.categories).toContain("education");
    });

    it("manifest declares a 512x512 maskable icon for Android adaptive launchers", () => {
      const manifest = JSON.parse(
        readFileSync(join(DIST, "site.webmanifest"), "utf-8"),
      );
      const maskable = manifest.icons.find((i: { purpose?: string }) =>
        typeof i.purpose === "string" && i.purpose.split(/\s+/).includes("maskable"),
      );
      expect(maskable, "no maskable icon entry in manifest").toBeTruthy();
      expect(maskable.sizes).toBe("512x512");
      expect(maskable.type).toBe("image/png");
    });

    it("every page links the web app manifest and mobile app-name meta", () => {
      for (const page of ALL_PAGES) {
        const $ = readPage(page);
        expect(
          $('link[rel="manifest"]').attr("href"),
          `${page} missing manifest link`,
        ).toBe("/site.webmanifest");
        expect(
          $('meta[name="apple-mobile-web-app-title"]').attr("content"),
          `${page} missing apple-mobile-web-app-title`,
        ).toBe("Elenka Spanish");
        expect(
          $('meta[name="application-name"]').attr("content"),
          `${page} missing application-name`,
        ).toBe("Elenka Spanish");
      }
    });

    it("every page pins color-scheme to light (built-in UI renders consistently on dark-mode OS)", () => {
      for (const page of ALL_PAGES) {
        const $ = readPage(page);
        expect(
          $('meta[name="color-scheme"]').attr("content"),
          `${page} missing color-scheme meta`,
        ).toBe("light");
      }
    });

    it("every page disables iOS telephone auto-linking (keeps pricing/dates from styling as tel: links)", () => {
      for (const page of ALL_PAGES) {
        const $ = readPage(page);
        expect(
          $('meta[name="format-detection"]').attr("content"),
          `${page} missing format-detection meta`,
        ).toBe("telephone=no");
      }
    });

    it("every page declares a strict Referrer-Policy (trims Referer on cross-origin navigations)", () => {
      for (const page of ALL_PAGES) {
        const $ = readPage(page);
        expect(
          $('meta[name="referrer"]').attr("content"),
          `${page} missing referrer meta`,
        ).toBe("strict-origin-when-cross-origin");
      }
    });

    it("every page declares standalone web-app-capable + iOS status bar style", () => {
      for (const page of ALL_PAGES) {
        const $ = readPage(page);
        expect(
          $('meta[name="apple-mobile-web-app-capable"]').attr("content"),
          `${page} missing apple-mobile-web-app-capable`,
        ).toBe("yes");
        expect(
          $('meta[name="mobile-web-app-capable"]').attr("content"),
          `${page} missing mobile-web-app-capable`,
        ).toBe("yes");
        expect(
          $('meta[name="apple-mobile-web-app-status-bar-style"]').attr(
            "content",
          ),
          `${page} missing apple-mobile-web-app-status-bar-style`,
        ).toBe("default");
      }
    });

    it("every page links sized favicon variants (32, 512) + apple-touch 180", () => {
      for (const page of ALL_PAGES) {
        const $ = readPage(page);
        const icons = $('link[rel="icon"]')
          .map((_, el) => ({
            href: $(el).attr("href"),
            sizes: $(el).attr("sizes"),
          }))
          .get();
        expect(icons, `${page} missing 32x32 favicon`).toContainEqual({
          href: "/favicon-32.png",
          sizes: "32x32",
        });
        expect(icons, `${page} missing 512x512 favicon`).toContainEqual({
          href: "/favicon.png",
          sizes: "512x512",
        });
        const apple = $('link[rel="apple-touch-icon"]').attr("href");
        expect(apple, `${page} apple-touch-icon`).toBe("/favicon-180.png");
      }
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

  it("every page has theme-color and preconnects to fonts.gstatic.com", () => {
    for (const page of ALL_PAGES) {
      const $ = readPage(page);
      expect(
        $('meta[name="theme-color"]').attr("content"),
        `${page} missing theme-color`,
      ).toBe("#fefdf8");
      const preconnectHrefs = $('link[rel="preconnect"]')
        .map((_, el) => $(el).attr("href"))
        .get();
      expect(
        preconnectHrefs,
        `${page} missing fonts.gstatic.com preconnect`,
      ).toContain("https://fonts.gstatic.com");
    }
  });

  it("every page dns-prefetches Google Calendar and wa.me", () => {
    for (const page of ALL_PAGES) {
      const $ = readPage(page);
      const dnsPrefetchHrefs = $('link[rel="dns-prefetch"]')
        .map((_, el) => $(el).attr("href"))
        .get();
      expect(
        dnsPrefetchHrefs,
        `${page} missing calendar.google.com dns-prefetch`,
      ).toContain("https://calendar.google.com");
      expect(
        dnsPrefetchHrefs,
        `${page} missing wa.me dns-prefetch`,
      ).toContain("https://wa.me");
    }
  });

  it("homepage preloads the square AVIF hero image, not the portrait original", () => {
    const $ = readPage("/");
    const preloadHref = $('link[rel="preload"][as="image"]').attr("href");
    expect(preloadHref).toBe("/elena-square.avif");
  });

  it("Hero and About <picture> blocks reference the square image variants", () => {
    const $ = readPage("/");
    const avifSources = $('source[type="image/avif"]')
      .map((_, el) => $(el).attr("srcset"))
      .get();
    expect(avifSources).toContain("/elena-square.avif");
    expect(avifSources).not.toContain("/elena.avif");
  });

  it("homepage has Open Graph tags", () => {
    const $ = readPage("/");
    expect($('meta[property="og:title"]').attr("content")).toBeTruthy();
    expect($('meta[property="og:description"]').attr("content")).toBeTruthy();
    expect($('meta[property="og:image"]').attr("content")).toBeTruthy();
    expect($('meta[property="og:url"]').attr("content")).toBeTruthy();
  });

  it("every page declares og:image:type and og:image:secure_url for crawler spec-completeness", () => {
    for (const page of ALL_PAGES) {
      const $ = readPage(page);
      const ogImage = $('meta[property="og:image"]').attr("content");
      expect(ogImage, `${page} missing og:image`).toBeTruthy();
      expect(ogImage!.startsWith("https://")).toBe(true);
      expect(
        $('meta[property="og:image:type"]').attr("content"),
        `${page} missing og:image:type`,
      ).toBe("image/jpeg");
      expect(
        $('meta[property="og:image:secure_url"]').attr("content"),
        `${page} og:image:secure_url should mirror og:image`,
      ).toBe(ogImage);
    }
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
    expect(data.areaServed).toBeTruthy();
    expect(data.knowsLanguage).toEqual(expect.arrayContaining(["es", "en"]));
  });

  it("LocalBusiness JSON-LD includes makesOffer matching the Pricing component", () => {
    const $ = readPage("/");
    const raw = $('script[type="application/ld+json"]').html();
    const data = JSON.parse(raw!);
    expect(data.priceRange).toMatch(/14[\s\S]*24\s*USD/);
    expect(Array.isArray(data.makesOffer)).toBe(true);
    expect(data.makesOffer).toHaveLength(3);
    const prices = data.makesOffer.map((o: { price: string }) => o.price);
    expect(prices).toEqual(expect.arrayContaining(["14", "18", "24"]));
    for (const offer of data.makesOffer) {
      expect(offer["@type"]).toBe("Offer");
      expect(offer.priceCurrency).toBe("USD");
      expect(offer.name).toBeTruthy();
    }
  });

  it("LocalBusiness JSON-LD includes a Person founder matching the About component", () => {
    const $ = readPage("/");
    const raw = $('script[type="application/ld+json"]').html();
    const data = JSON.parse(raw!);
    expect(data.founder).toBeDefined();
    expect(data.founder["@type"]).toBe("Person");
    expect(data.founder.name).toBe("Elena María Ramón Martínez");
    expect(data.founder.jobTitle).toBeTruthy();
    expect(data.founder.nationality).toBe("Mexican");
    expect(data.founder.knowsLanguage).toEqual(
      expect.arrayContaining(["es", "en"]),
    );
    expect(data.founder.alumniOf["@type"]).toBe("CollegeOrUniversity");
    expect(data.founder.alumniOf.name).toBe(
      "Universidad Europea Miguel de Cervantes",
    );
  });

  it("homepage emits Course JSON-LD sourced from the Pricing component", () => {
    const $ = readPage("/");
    const scripts = $('script[type="application/ld+json"]')
      .map((_, el) => $(el).html())
      .get();
    const parsed = scripts.map((s) => JSON.parse(s!));
    const course = parsed.find((d) => d["@type"] === "Course");
    expect(course, "missing Course JSON-LD on homepage").toBeDefined();
    expect(course.name).toMatch(/Spanish/i);
    expect(course.description).toBeTruthy();
    expect(course.url).toBe("https://elenkaspanish.com/");
    expect(course.inLanguage).toBe("es");
    expect(course.teaches).toBeTruthy();
    expect(course.provider["@type"]).toBe("Organization");
    expect(course.provider.name).toBeTruthy();
    expect(course.provider.url).toBe("https://elenkaspanish.com");
    // CourseInstance: online, 55-minute session, Spanish-language, instructor Elena
    expect(course.hasCourseInstance["@type"]).toBe("CourseInstance");
    expect(course.hasCourseInstance.courseMode).toBe("Online");
    expect(course.hasCourseInstance.courseWorkload).toBe("PT55M");
    expect(course.hasCourseInstance.inLanguage).toBe("es");
    expect(course.hasCourseInstance.location["@type"]).toBe("VirtualLocation");
    expect(course.hasCourseInstance.instructor["@type"]).toBe("Person");
    expect(course.hasCourseInstance.instructor.name).toBe(
      "Elena María Ramón Martínez",
    );
    // Offers: 3 Paid Offers priced in USD matching the Pricing card copy (14/18/24).
    expect(Array.isArray(course.offers)).toBe(true);
    expect(course.offers).toHaveLength(3);
    const prices = course.offers.map((o: { price: string }) => o.price);
    expect(prices).toEqual(expect.arrayContaining(["14", "18", "24"]));
    for (const offer of course.offers) {
      expect(offer["@type"]).toBe("Offer");
      expect(offer.priceCurrency).toBe("USD");
      expect(offer.category).toBe("Paid");
      expect(offer.name).toBeTruthy();
      expect(offer.availability).toBe("https://schema.org/InStock");
    }
  });

  it("Course JSON-LD is emitted only on the homepage (where Pricing mounts)", () => {
    const nonHomepagePages = [
      "/404",
      "/games",
      ...GAME_PAGES,
    ];
    for (const page of nonHomepagePages) {
      const p =
        page === "/404"
          ? join(DIST, "404.html")
          : join(DIST, page, "index.html");
      if (!existsSync(p)) continue;
      const $ = load(readFileSync(p, "utf-8"));
      const scripts = $('script[type="application/ld+json"]')
        .map((_, el) => $(el).html())
        .get();
      const hasCourse = scripts
        .map((s) => JSON.parse(s!))
        .some((d) => d["@type"] === "Course");
      expect(hasCourse, `unexpected Course JSON-LD on ${page}`).toBe(false);
    }
  });

  it("game pages have unique titles", () => {
    const titles = GAME_PAGES.map((p) => readPage(p)("title").text());
    const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
    expect(dupes).toEqual([]);
  });

  it("game pages emit BreadcrumbList JSON-LD (Home > Games > <Game>)", () => {
    for (const page of GAME_PAGES) {
      const $ = readPage(page);
      const scripts = $('script[type="application/ld+json"]')
        .map((_, el) => $(el).html())
        .get();
      const breadcrumb = scripts
        .map((s) => JSON.parse(s!))
        .find((d) => d["@type"] === "BreadcrumbList");
      expect(breadcrumb, `missing BreadcrumbList on ${page}`).toBeDefined();
      expect(breadcrumb.itemListElement).toHaveLength(3);
      expect(breadcrumb.itemListElement[0].name).toBe("Home");
      expect(breadcrumb.itemListElement[1].name).toBe("Practice Games");
      expect(breadcrumb.itemListElement[2].item).toBe(
        `https://elenkaspanish.com${page}/`,
      );
    }
  });

  it("games hub emits BreadcrumbList (Home > Practice Games)", () => {
    const $ = readPage("/games");
    const scripts = $('script[type="application/ld+json"]')
      .map((_, el) => $(el).html())
      .get();
    const breadcrumb = scripts
      .map((s) => JSON.parse(s!))
      .find((d) => d["@type"] === "BreadcrumbList");
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb.itemListElement).toHaveLength(2);
    expect(breadcrumb.itemListElement[1].name).toBe("Practice Games");
  });

  it("homepage and 404 do NOT emit BreadcrumbList (single-segment or noindex)", () => {
    for (const page of ["/", "/404"]) {
      const p =
        page === "/404"
          ? join(DIST, "404.html")
          : join(DIST, "index.html");
      if (!existsSync(p)) continue;
      const $ = load(readFileSync(p, "utf-8"));
      const scripts = $('script[type="application/ld+json"]')
        .map((_, el) => $(el).html())
        .get();
      const hasBreadcrumb = scripts
        .map((s) => JSON.parse(s!))
        .some((d) => d["@type"] === "BreadcrumbList");
      expect(hasBreadcrumb, `unexpected BreadcrumbList on ${page}`).toBe(false);
    }
  });

  it("game pages render a visible breadcrumb nav matching the JSON-LD", () => {
    for (const page of GAME_PAGES) {
      const $ = readPage(page);
      const nav = $('nav[aria-label="Breadcrumb"]');
      expect(nav.length, `missing breadcrumb nav on ${page}`).toBe(1);
      const items = nav.find("ol > li");
      expect(items.length, `wrong item count on ${page}`).toBe(3);
      // Home + Practice Games are links; current page is aria-current
      expect(nav.find('a[href="/"]').length).toBe(1);
      expect(nav.find('a[href="/games/"]').length).toBe(1);
      expect(nav.find('[aria-current="page"]').length).toBe(1);
    }
  });

  it("games hub renders a 2-item visible breadcrumb (Home > Practice Games)", () => {
    const $ = readPage("/games");
    const nav = $('nav[aria-label="Breadcrumb"]');
    expect(nav.length).toBe(1);
    expect(nav.find("ol > li").length).toBe(2);
    expect(nav.find('a[href="/"]').length).toBe(1);
    expect(nav.find('[aria-current="page"]').text()).toBe("Practice Games");
  });

  it("homepage and 404 do NOT render a visible breadcrumb", () => {
    for (const page of ["/", "/404"]) {
      const p =
        page === "/404"
          ? join(DIST, "404.html")
          : join(DIST, "index.html");
      if (!existsSync(p)) continue;
      const $ = load(readFileSync(p, "utf-8"));
      expect(
        $('nav[aria-label="Breadcrumb"]').length,
        `unexpected breadcrumb on ${page}`,
      ).toBe(0);
    }
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

  it("icon-only WhatsApp links carry aria-labels", () => {
    const $ = readPage("/");
    const iconOnly = $("a[href*='wa.me']").filter((_, el) => $(el).text().trim() === "");
    expect(iconOnly.length).toBeGreaterThanOrEqual(2); // floating (desktop) + sticky bar (mobile)
    iconOnly.each((_, el) => {
      expect($(el).attr("aria-label"), "icon-only wa.me link needs aria-label").toBeTruthy();
    });
  });
  it("WhatsApp buttons have aria-labels (floating + sticky bar)", () => {
    const $ = readPage("/");
    expect($('a[aria-label="Chat on WhatsApp"]').length).toBe(2);
  });

  it("mobile CTA bar pairs booking with WhatsApp; floating button is desktop-only", () => {
    const $ = readPage("/");
    const bar = $("#mobile-cta");
    expect(bar.find("a[href*='calendar.google.com']").length).toBe(1);
    const barWa = bar.find("a[href*='wa.me']");
    expect(barWa.length).toBe(1);
    expect(barWa.attr("aria-label"), "icon-only bar button labeled").toBeTruthy();
    const floatingClass =
      $("a[href*='wa.me']")
        .filter((_, el) => $(el).closest("#mobile-cta").length === 0 && $(el).text().trim() === "")
        .attr("class") ?? "";
    expect(floatingClass, "floating button hidden on mobile").toContain("hidden");
    expect(floatingClass, "floating button shown on desktop").toContain("md:flex");
  });

  it("mobile menu toggle has aria-expanded", () => {
    const $ = readPage("/");
    expect($("#menu-toggle").attr("aria-expanded")).toBe("false");
    expect($("#menu-toggle").attr("aria-label")).toBeTruthy();
  });

  // WAI-ARIA disclosure pattern: aria-controls points the toggle at the
  // region it reveals so assistive tech can jump between them. The target
  // id must also exist in the document.
  it("mobile menu toggle has aria-controls pointing at an existing region", () => {
    const $ = readPage("/");
    const target = $("#menu-toggle").attr("aria-controls");
    expect(target).toBe("mobile-menu");
    expect($(`#${target}`).length).toBe(1);
  });

  // WAI-ARIA disclosure pattern: pressing Escape while the mobile menu is
  // open should close it and return focus to the toggle. Asserts the keydown
  // handler is present in the inline layout script.
  it("mobile menu closes on Escape (WAI-ARIA disclosure)", () => {
    const html = readFileSync(htmlPath("/"), "utf-8");
    // Minified vars change name, but the call structure is stable: a keydown
    // listener that checks `key === "Escape"`, inspects `nav-open`, and calls
    // `.focus()` to restore focus to the toggle.
    expect(html).toMatch(/addEventListener\("keydown"/);
    expect(html).toMatch(/"Escape"[\s\S]{0,120}"nav-open"[\s\S]{0,120}\.focus\(\)/);
  });

  it("decorative blobs are aria-hidden", () => {
    const $ = readPage("/");
    $("main > div.absolute").each((_, el) => {
      expect($(el).attr("aria-hidden")).toBe("true");
    });
  });

  it("homepage Practice nav link is NOT aria-current", () => {
    const $ = readPage("/");
    const practiceLinks = $('nav a[href="/games"]');
    expect(practiceLinks.length).toBe(3);
    practiceLinks.each((_, el) => {
      expect($(el).attr("aria-current")).toBeUndefined();
    });
  });

  it.each(["/games", ...GAME_PAGES])(
    "%s → Practice nav links carry aria-current=\"page\"",
    (page) => {
      const $ = readPage(page);
      const practiceLinks = $('nav a[href="/games"]');
      expect(practiceLinks.length).toBe(3);
      practiceLinks.each((_, el) => {
        expect($(el).attr("aria-current")).toBe("page");
      });
    },
  );

  it("memory-match tiles get an aria-label when hidden", () => {
    const html = readFileSync(htmlPath("/games/memory-match"), "utf-8");
    expect(
      html,
      "newGame should set aria-label on each hidden tile",
    ).toMatch(/setAttribute\("aria-label",\s*`Hidden tile \$\{idx \+ 1\} of \$\{tiles\.length\}`\)/);
    expect(
      html,
      "reveal() should remove aria-label so textContent becomes the name",
    ).toMatch(/removeAttribute\("aria-label"\)/);
    expect(
      html,
      "hide() should restore aria-label when a mismatch flips back",
    ).toMatch(/setAttribute\("aria-label",\s*`Hidden tile \$\{idx \+ 1\} of \$\{cards\.length\}`\)/);
  });

  it("verb-conjugation input has an accessible name", () => {
    const $ = readPage("/games/verb-conjugation");
    const input = $("#answer-input");
    expect(input.length).toBe(1);
    const labelledBy = input.attr("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    labelledBy!.split(/\s+/).forEach((id) => {
      expect($(`#${id}`).length, `aria-labelledby target #${id} missing`).toBe(1);
    });
    const describedBy = input.attr("aria-describedby");
    expect(describedBy).toBeTruthy();
    describedBy!.split(/\s+/).forEach((id) => {
      expect($(`#${id}`).length, `aria-describedby target #${id} missing`).toBe(1);
    });
  });

  it("hangman reveals a prominent replay CTA when the round ends", () => {
    const $ = readPage("/games/hangman");
    const container = $("#round-end");
    expect(container.length, "#round-end container missing").toBe(1);
    expect(container.hasClass("hidden"), "#round-end starts hidden during play").toBe(true);
    const btn = $("#btn-try-again");
    expect(btn.length, "#btn-try-again missing").toBe(1);
    expect(btn.text().trim()).toBe("Try another word");
    expect(btn.hasClass("cursor-pointer"), "replay CTA needs cursor-pointer").toBe(true);
    const html = readFileSync(htmlPath("/games/hangman"), "utf-8");
    expect(
      html,
      "newGame() should re-hide the replay CTA",
    ).toMatch(/\$\("round-end"\)\.classList\.add\("hidden"\)/);
    expect(
      html.match(/\$\("round-end"\)\.classList\.remove\("hidden"\)/g)?.length ?? 0,
      "win and loss branches should each reveal the replay CTA",
    ).toBe(2);
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

  it("homepage links to the games hub", () => {
    // The Elena-centric hero (visual uplift) dropped the in-hero games link,
    // but the games hub stays reachable via the global nav + footer.
    const $ = readPage("/");
    const gamesLinks = $('a[href="/games"]');
    expect(gamesLinks.length).toBeGreaterThan(0);
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

  it("Elena portrait alt identifies her and her role (Spanish teacher)", () => {
    const $ = readPage("/");
    const alts = $('img[src="/elena-square.jpg"]')
      .map((_, el) => $(el).attr("alt"))
      .get();
    expect(alts.length).toBeGreaterThanOrEqual(2);
    for (const alt of alts) {
      expect(alt).toContain("Elena María Ramón Martínez");
      expect(alt).toContain("Spanish teacher");
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

  it("has a secondary link to /games for recovery", () => {
    // 404 is a recovery moment — surfacing the practice-games hub (the
    // second-most-engaging destination after the homepage) gives users who
    // mistyped a game URL a one-click path back onto the learning surface
    // instead of only the generic homepage.
    const $ = load(readFileSync(join(DIST, "404.html"), "utf-8"));
    const $gamesLink = $('main a[href="/games"]');
    expect($gamesLink.length).toBeGreaterThan(0);
    expect($gamesLink.first().text().trim().toLowerCase()).toContain("games");
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

  it("has an in-flow booking CTA below the game grid", () => {
    // The hub is the one main content page that previously had no in-flow
    // booking prompt — every individual game page has BookingCta after the
    // results screen, and the homepage has Pricing + BookingCta. Visitors
    // who browse the hub are high-intent (they've sought out practice) and
    // deserve a conversion surface below the grid, not just the header/
    // footer/sticky-mobile-bar chrome they share with every other page.
    const $ = readPage("/games");
    const inflow = $('main a[href*="calendar.google.com/calendar"]');
    expect(inflow.length, "no in-flow booking link in <main>").toBeGreaterThan(
      0,
    );
    const text = inflow.first().text().trim().toLowerCase();
    expect(text).toContain("book");
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

  it("flashcards announces the revealed translation via aria-live on #word-en", () => {
    const $ = readPage("games/flashcards");
    const wordEn = $("#word-en");
    expect(wordEn.length).toBe(1);
    expect(wordEn.attr("aria-live")).toBe("polite");
    // #flip-prompt is a static instruction, not a live status — must NOT carry aria-live
    expect($("#flip-prompt").attr("aria-live")).toBeUndefined();
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

// ---------------------------------------------------------------------------
// Design system (visual uplift)
// ---------------------------------------------------------------------------

describe("design system (visual uplift)", () => {
  it("tinted sections are full-bleed (tint on the full-width section, not a max-w container)", () => {
    const $ = readPage("/");
    const tinted = $("section[class*='tint-']");
    expect(tinted.length).toBeGreaterThan(0);
    tinted.each((_, el) => {
      const cls = $(el).attr("class") || "";
      expect(
        cls,
        `tinted section must be full-bleed, not max-w constrained: ${cls}`,
      ).not.toMatch(/\bmax-w-/);
    });
  });
  it("emits the warm palette tokens in built CSS", () => {
    const css = readBuiltCss();
    expect(css).toContain("#e3157b"); // rosa
    expect(css).toContain("#c1502e"); // terracotta
    expect(css).toContain("#0a7d7d"); // teal-dark
  });
  it("defines the three controlled keyframes and gates them on reduced-motion", () => {
    const css = readBuiltCss();
    expect(css).toMatch(/@keyframes flow/);
    expect(css).toMatch(/@keyframes sway/);
    expect(css).toMatch(/@keyframes rise/);
    expect(css).toMatch(/prefers-reduced-motion/);
  });
  it("loads the Fraunces serif accent font on the homepage", () => {
    const $ = readPage("/");
    const head = $("head").html() ?? "";
    expect(head).toMatch(/Fraunces/);
  });
  it("hero shows Elena's personal greeting and papel picado", () => {
    const $ = readPage("/");
    const hero = $("#hero");
    expect(hero.text()).toMatch(/Hola, soy Elena/);
    expect(hero.find(".picado, [class*='picado']").length).toBeGreaterThan(0);
    expect(hero.find("a[href*='calendar.google.com']").length).toBeGreaterThan(0);
  });
  it("papel picado server-renders the default banner", () => {
    const $ = readPage("/");
    const flags = $(".picado .flag");
    expect(flags.length).toBe(15);
    const d = flags.first().find("path").attr("d") ?? "";
    expect(d.startsWith("M0 0H40")).toBe(true);
    expect(d).toContain("M20 8L26 16"); // rosette cut = default
  });
  it("ships the seasonal picado logic to the client", () => {
    const all = readBuiltJs() + (readPage("/").html() ?? "");
    expect(all).toContain("M13 11L17 15"); // calavera cut in client JS
    expect(all).toContain("M20 6L23 12"); // nochebuena cut in client JS
  });
  it("ships the optimized cultural photo for the final CTA", () => {
    expect(existsSync(join(DIST, "calle.avif"))).toBe(true);
    expect(existsSync(join(DIST, "calle.webp"))).toBe(true);
    expect(existsSync(join(DIST, "calle.jpg"))).toBe(true);
  });
  it("final CTA uses the cultural photo behind a scrim", () => {
    const $ = readPage("/");
    const html = $.html();
    expect(html).toMatch(/calle\.(avif|webp|jpg)/);
    expect($("a:contains('Schedule a free')").length).toBeGreaterThan(0);
  });
  it("Spanish words carry hover-swap English translations", () => {
    const $ = readPage("/");
    const tips = $(".es-tip");
    expect(tips.length).toBeGreaterThanOrEqual(8);
    tips.each((_, el) => {
      const t = $(el);
      expect(t.attr("tabindex"), "focusable for keyboard/tap").toBe("0");
      expect(t.attr("lang")).toBe("es");
      expect(t.find(".es-tip-es").length, "Spanish face present").toBe(1);
      const en = t.find(".es-tip-en");
      expect(en.length, "English face present").toBe(1);
      expect(en.attr("lang")).toBe("en");
      expect(en.text().trim()).not.toBe("");
    });
  });
  it("aventura swaps to adventure in the headline", () => {
    const $ = readPage("/");
    expect($("h1 .es-tip .es-tip-es").text()).toContain("aventura");
    expect($("h1 .es-tip .es-tip-en").text()).toContain("adventure");
  });
  it("cards on tinted sections have explicit white surfaces (mockup spec)", () => {
    const $ = readPage("/");
    const gridQuotes = $("#testimonials blockquote").filter(
      (_, el) => !($(el).attr("class") ?? "").includes("bg-primary"),
    );
    expect(gridQuotes.length).toBeGreaterThanOrEqual(4);
    gridQuotes.each((_, el) => expect($(el).attr("class")).toContain("bg-white"));
    const benefitCards = $("#why-choose .grid > div");
    expect(benefitCards.length).toBe(4);
    benefitCards.each((_, el) => expect($(el).attr("class")).toContain("bg-white"));
    const planCards = $("#pricing .grid > div");
    expect(planCards.length).toBe(3);
    planCards.each((_, el) => expect($(el).attr("class")).toContain("bg-white"));
  });
  it("the university proper noun is NOT tooltip-wrapped", () => {
    const $ = readPage("/");
    const uni = $("span[lang='es']:contains('Universidad')");
    expect(uni.length).toBe(1);
    expect(uni.closest(".es-tip").length).toBe(0);
    expect(uni.find(".es-tip").length).toBe(0);
  });
  it("hero word-of-day card has swap targets and ships the daily-word logic", () => {
    const $ = readPage("/");
    expect($("#wod-es").text().trim()).toBe("la aventura"); // SSR fallback
    expect($("#wod-en").text()).toContain("adventure");
    const all = readBuiltJs() + ($.html() ?? "");
    expect(all).toContain("wod-es");
  });
});
