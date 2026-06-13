#!/usr/bin/env node
// Static a11y sweep over built HTML. Manual invocation only:
//   node scripts/a11y-audit.mjs                  → stdout summary
//   node scripts/a11y-audit.mjs > report.md      → capture to file
//
// Scope: the WCAG signals that are statically decidable from HTML alone —
// missing alt, unlabeled form controls, heading-order gaps, landmark labels,
// empty accessible names on links/buttons, document-level lang/title/desc.
// Color contrast and dynamic focus behaviour are explicitly out of scope
// (require a real browser). See `steward-baseline/a11y-<date>.md` for the
// most recent run against main.
//
// Intentionally dependency-free (plain regex + node:fs). Not wired into
// `npm test` or `npm run build`.

import { readdir, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = resolve(ROOT, "dist");

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith(".html")) yield full;
  }
}

const stripAttr = (s) => s.replace(/\s+/g, " ").trim();
const hasAttr = (tag, name) => new RegExp(`\\s${name}(?=[\\s=>])`, "i").test(tag);
const getAttr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"))
    || tag.match(new RegExp(`\\s${name}\\s*=\\s*'([^']*)'`, "i"));
  return m ? m[1] : null;
};

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;

// Strip scripts/styles so their contents don't confuse the element scanner.
const stripInert = (html) =>
  html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

const findElements = (html, name) => {
  const out = [];
  const re = new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)</${name}>`, "gi");
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({ attrs: `<${name} ${m[1]}>`, inner: m[2] });
  }
  return out;
};

const findVoidElements = (html, name) => {
  const out = [];
  const re = new RegExp(`<${name}\\b([^>]*?)/?>`, "gi");
  let m;
  while ((m = re.exec(html)) !== null) out.push(`<${name} ${m[1]}>`);
  return out;
};

const textOf = (inner) =>
  inner
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

function auditPage(html, rel) {
  const findings = [];
  const add = (severity, rule, detail) =>
    findings.push({ severity, rule, detail: stripAttr(detail).slice(0, 200) });

  // Document-level
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? "";
  if (!getAttr(htmlTag, "lang")) add("error", "html-lang", "missing lang on <html>");
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
  if (!title) add("error", "title", "missing or empty <title>");
  const desc = html.match(/<meta\s+name="description"[^>]*>/i)?.[0];
  if (!desc) add("warn", "meta-description", "missing meta description");

  const body = stripInert(html);

  // Images — alt is required (alt="" is explicit decorative and OK).
  for (const tag of findVoidElements(body, "img")) {
    if (!hasAttr(tag, "alt")) add("error", "img-alt", `img missing alt: ${tag}`);
  }

  // Form controls must have a name.
  for (const name of ["input", "textarea", "select"]) {
    for (const tag of findVoidElements(body, name)) {
      const type = getAttr(tag, "type")?.toLowerCase();
      if (name === "input" && (type === "hidden" || type === "submit" || type === "button" || type === "reset")) continue;
      const id = getAttr(tag, "id");
      const ariaLabel = getAttr(tag, "aria-label");
      const ariaLabelledby = getAttr(tag, "aria-labelledby");
      const hasLabelEl = id && new RegExp(`<label\\b[^>]*\\sfor=["']${id}["']`, "i").test(body);
      if (!ariaLabel && !ariaLabelledby && !hasLabelEl) {
        add("error", "form-label", `${name} has no accessible label: ${tag}`);
      }
    }
  }

  // Links must have an accessible name.
  for (const { attrs, inner } of findElements(body, "a")) {
    if (!hasAttr(attrs, "href")) continue;
    const ariaLabel = getAttr(attrs, "aria-label");
    const ariaLabelledby = getAttr(attrs, "aria-labelledby");
    if (ariaLabel || ariaLabelledby) continue;
    const text = textOf(inner);
    const imgAlt = inner.match(/<img\b[^>]*\salt="([^"]+)"/i)?.[1];
    if (!text && !imgAlt) add("error", "link-name", `link has no text: ${attrs}`);
  }

  // Buttons must have an accessible name.
  for (const { attrs, inner } of findElements(body, "button")) {
    const ariaLabel = getAttr(attrs, "aria-label");
    const ariaLabelledby = getAttr(attrs, "aria-labelledby");
    if (ariaLabel || ariaLabelledby) continue;
    const text = textOf(inner);
    const imgAlt = inner.match(/<img\b[^>]*\salt="([^"]+)"/i)?.[1];
    if (!text && !imgAlt) add("error", "button-name", `button has no text: ${attrs}`);
  }

  // Landmarks — each <nav> should be distinguishable.
  const navs = findElements(body, "nav");
  for (const { attrs } of navs) {
    if (!getAttr(attrs, "aria-label") && !getAttr(attrs, "aria-labelledby")) {
      add("warn", "nav-label", `nav without accessible name: ${attrs}`);
    }
  }

  // Heading hierarchy — walk in document order, flag downward skips (h2→h4).
  const headings = [];
  const hRe = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = hRe.exec(body)) !== null) headings.push({ level: Number(m[1]), text: textOf(m[2]) });
  if (headings.length && headings[0].level !== 1) {
    add("warn", "heading-first", `first heading is h${headings[0].level}, expected h1`);
  }
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].level;
    const cur = headings[i].level;
    if (cur > prev + 1) add("warn", "heading-gap", `h${prev} → h${cur} skips a level (at "${headings[i].text.slice(0, 60)}")`);
  }

  return { page: rel, headings: headings.length, findings };
}

async function main() {
  const pages = [];
  for await (const f of walk(DIST)) pages.push(f);
  pages.sort();

  const results = [];
  for (const f of pages) {
    const rel = relative(DIST, f);
    const html = await readFile(f, "utf8");
    results.push(auditPage(html, rel));
  }

  const date = new Date().toISOString().slice(0, 10);
  const totals = { error: 0, warn: 0 };
  for (const r of results) for (const f of r.findings) totals[f.severity]++;

  const byRule = new Map();
  for (const r of results) {
    for (const f of r.findings) {
      const key = `${f.severity}:${f.rule}`;
      byRule.set(key, (byRule.get(key) ?? 0) + 1);
    }
  }

  const lines = [];
  lines.push(`# Static a11y baseline — ${date}`);
  lines.push("");
  lines.push(`Generated by \`scripts/a11y-audit.mjs\` against \`dist/\` after \`npm run build\`.`);
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push("Static-only sweep: missing alt, unlabeled form controls, empty accessible names on links/buttons, unlabeled navs, heading-order gaps, and document-level lang/title/description. Color contrast, focus visibility, keyboard traps, and motion preferences need a real browser (Lighthouse / axe) — not covered here.");
  lines.push("");
  lines.push(`## Totals — ${pages.length} pages scanned`);
  lines.push("");
  lines.push(`- errors: **${totals.error}**`);
  lines.push(`- warnings: **${totals.warn}**`);
  lines.push("");
  lines.push("### By rule");
  lines.push("");
  if (byRule.size === 0) {
    lines.push("_None — all static checks clean._");
  } else {
    for (const [key, n] of [...byRule.entries()].sort()) {
      lines.push(`- \`${key}\` × ${n}`);
    }
  }
  lines.push("");
  lines.push("## Per-page detail");
  lines.push("");
  for (const r of results) {
    lines.push(`### \`${r.page}\` — ${r.headings} headings, ${r.findings.length} findings`);
    if (r.findings.length === 0) {
      lines.push("_Clean._");
    } else {
      for (const f of r.findings) {
        lines.push(`- **${f.severity}** \`${f.rule}\` — ${f.detail}`);
      }
    }
    lines.push("");
  }

  process.stdout.write(lines.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
