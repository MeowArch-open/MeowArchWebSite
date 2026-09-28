#!/usr/bin/env node
/* gen-docs.mjs — build the MeowArch docs site from docs/content/*.mdx.

   One .mdx pair per document (<slug>.en.mdx + <slug>.zh-CN.mdx) with flat
   frontmatter drives EVERYTHING: the sidebar, the reading order, the pager,
   the landing cards, and the per-document i18n strings. Adding a document is
   "drop the two .mdx files, run `node scripts/gen-docs.mjs`".

   Outputs (all under docs/):
     - <section-dir>/<slug>.html   one static page per document (shared chrome)
     - index.html                  the docs landing (hero + cards)
     - docs-i18n.js                window.MEOWARCH_DOCS_I18N = { en, "zh-CN" }
                                   (loaded before js/i18n.js, merged into it)
     - docs-manifest.json          build/test artifact (not needed at runtime)

   The page BODIES are not rendered here — docs.js fetches the current
   language's .mdx and renders it client-side, so language switching never
   reloads. Everything the generator bakes (sidebar, pager, cards, <title>)
   is therefore a runtime-resolvable data-i18n key, localized live. */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DOCS = join(ROOT, "docs");
const CONTENT = join(DOCS, "content");

/* Reuse the renderer's frontmatter parser so coercion never drifts. mdx.js is
   a browser IIFE that assigns globalThis.MEOWARCH_MDX; eval it once to load. */
(0, eval)(readFileSync(join(DOCS, "mdx.js"), "utf8"));
const { parseFrontmatter, escapeHtml } = globalThis.MEOWARCH_MDX;

/* ---- registries (generator config, not frontmatter) ---- */
/* Ordered: section -> output dir + sidebar/label i18n key (+ EN fallback). */
export const SECTIONS = {
  guide: { dir: "guide/", label: "docs.guide", labelEn: "Guide" },
  quickstart: { dir: "guide/", label: "docs.quickstart", labelEn: "Quick start" },
  develop: { dir: "guide/", label: "docs.develop", labelEn: "Development" },
  downloads: { dir: "", label: "docs.download", labelEn: "Downloads" },
};
const SECTION_ORDER = Object.keys(SECTIONS);

/* Landing-card icons, keyed by frontmatter `icon`. Inner SVG only. */
export const ICONS = {
  code: '<path d="M8 6 3 12l5 6" ></path><path d="m16 6 5 6-5 6" ></path>',
  download: '<path d="M12 3v11" ></path><path d="m8 10 4 4 4-4" ></path><path d="M5 20h14" ></path>',
  help: '<circle cx="12" cy="12" r="9" ></circle><path d="M9.2 9a2.9 2.9 0 0 1 5.6.9c0 1.8-2.4 2.2-2.4 3.6" ></path><path d="M12 17h.01" ></path>',
  device: '<rect x="7" y="2.5" width="10" height="19" rx="2.5" ></rect><path d="M10.5 18.5h3" ></path>',
};

/* Positional landing-card accents (match the hand-built index.html order). */
const TINTS = ["", " tint-sky", " tint-green", " tint-red"];
/* ---- site-root-relative asset paths (resolved per page via relpath) ---- */
const ASSET = {
  home: "index.html",
  downloadRoot: "download.html",
  docsIndex: "docs/index.html",
  devices: "devices.html",
  admin: "admin.html",
  styles: "styles.css",
  docsCss: "docs/docs.css",
  hljsCss: "docs/vendor/highlight/meowarch-hljs.css",
  faviconSvg: "assets/favicon.svg",
  faviconIco: "assets/favicon.ico",
  appleTouch: "assets/apple-touch-icon.png",
  logo: "assets/logo.svg",
  i18n: "js/i18n.js",
  ui: "js/ui.js",
  api: "js/api.js",
  render: "js/render.js",
  apiConfig: "api-config.js",
  docsI18n: "docs/docs-i18n.js",
  mdxJs: "docs/mdx.js",
  hljsJs: "docs/vendor/highlight/highlight.min.js",
  docsJs: "docs/docs.js",
};

/* ---- path helpers (POSIX, site-root-relative in / out) ---- */
export function relpath(fromFile, toFile) {
  const from = fromFile.split("/").slice(0, -1);
  const to = toFile.split("/");
  const name = to.pop();
  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i += 1;
  const parts = [...from.slice(i).map(() => ".."), ...to.slice(i), name];
  return parts.join("/") || name;
}

export function resolveHref(fromFile, href) {
  const stack = fromFile.split("/").slice(0, -1);
  for (const p of href.split("/")) {
    if (p === "..") stack.pop();
    else if (p !== "." && p !== "") stack.push(p);
  }
  return stack.join("/");
}

function rel(outPath, key) {
  return relpath(outPath, ASSET[key]);
}

/* ---- build document records from the .mdx frontmatter ---- */
// Normalise the frontmatter `apiPanel` value:
//   true    -> "top"    (load API scripts + bake the panel above the body)
//   "inline" -> "inline" (load API scripts only; :::api-latest places the panel)
//   anything else -> null (no live panel on this page)
export function apiPanelMode(v) {
  if (v === true) return "top";
  if (v === "inline") return "inline";
  return null;
}

export function buildRecords(files) {
  const bySlug = new Map();
  for (const f of files) {
    const { frontmatter: fm } = parseFrontmatter(f.src);
    const slug = fm.slug || f.slug;
    let rec = bySlug.get(slug);
    if (!rec) { rec = { slug, langs: {} }; bySlug.set(slug, rec); }
    rec.langs[f.lang] = fm;
  }
  const records = [];
  for (const rec of bySlug.values()) {
    const en = rec.langs.en || rec.langs["zh-CN"] || {};
    const zh = rec.langs["zh-CN"] || en;
    const section = en.section || zh.section || "guide";
    const sec = SECTIONS[section] || SECTIONS.guide;
    const outPath = `docs/${sec.dir}${rec.slug}.html`;
    records.push({
      slug: rec.slug,
      section,
      order: Number(en.order ?? zh.order ?? 0),
      icon: en.icon || zh.icon || "code",
      landing: en.landing !== false,
      sidebar: en.sidebar !== false,
      // apiPanel: true  -> load the API scripts AND bake the panel at the top.
      // apiPanel: inline -> load the scripts only; author places :::api-latest
      //                     wherever they want the live panel in the body.
      apiPanel: apiPanelMode(en.apiPanel ?? zh.apiPanel) !== null,
      apiPanelBaked: apiPanelMode(en.apiPanel ?? zh.apiPanel) === "top",
      outPath,
      contentBase: relpath(outPath, `docs/content/${rec.slug}`),
      en,
      zh,
    });
  }
  return records;
}

/* ---- global reading order + prev/next chain ---- */
export function computeChain(records) {
  const sorted = [...records].sort((a, b) => {
    const sa = SECTION_ORDER.indexOf(a.section);
    const sb = SECTION_ORDER.indexOf(b.section);
    if (sa !== sb) return sa - sb;
    if (a.order !== b.order) return a.order - b.order;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });
  sorted.forEach((r, i) => {
    r._prev = sorted[i - 1] || null;
    r._next = sorted[i + 1] || null;
  });
  return sorted;
}

function makeCtx(records) {
  const byOutPath = new Map();
  const bySlug = new Map();
  for (const r of records) { byOutPath.set(r.outPath, r.slug); bySlug.set(r.slug, r); }
  return { byOutPath, bySlug };
}
/* ---- pager: frontmatter prev/next overrides beat the computed chain ---- */
export function pagerLink(record, ctx, dir) {
  const isNext = dir === "next";
  const overHref = isNext ? record.en.nextHref : record.en.prevHref;
  if (overHref != null && overHref !== "") {
    const slug = ctx.byOutPath.get(resolveHref(record.outPath, overHref));
    if (slug) {
      return { href: overHref, titleKey: `docs.item.${slug}.title`, fallbackEn: ctx.bySlug.get(slug).en.title || "", minted: null };
    }
    // Off-chain target (e.g. download -> the docs index): mint a pager string.
    const en = (isNext ? record.en.nextTitle : record.en.prevTitle) ?? "";
    const zh = (isNext ? record.zh.nextTitle : record.zh.prevTitle) ?? en;
    return { href: overHref, titleKey: `docs.pager.${record.slug}.${dir}`, fallbackEn: en, minted: { en, zh } };
  }
  const target = isNext ? record._next : record._prev;
  if (!target) return null;
  return { href: relpath(record.outPath, target.outPath), titleKey: `docs.item.${target.slug}.title`, fallbackEn: target.en.title || "", minted: null };
}

export function renderPager(record, ctx) {
  const entry = (dir) => {
    const link = pagerLink(record, ctx, dir);
    if (!link) return "";
    const isNext = dir === "next";
    const cls = isNext ? ' class="is-next"' : "";
    const labelKey = isNext ? "docs.next" : "docs.prev";
    const labelText = isNext ? "Next" : "Previous";
    return `<a${cls} href="${escapeHtml(link.href)}"><span class="pg-label" data-i18n="${labelKey}">${labelText}</span><span class="pg-title" data-i18n="${link.titleKey}">${escapeHtml(link.fallbackEn)}</span></a>`;
  };
  const parts = [entry("prev"), entry("next")].filter(Boolean);
  return parts.length ? `<nav class="docs-pager" aria-label="Pager">${parts.join("")}</nav>` : "";
}

/* ---- generated per-doc i18n dictionary ---- */
export function buildDocsI18n(sorted, ctx) {
  const en = {};
  const zh = {};
  for (const r of sorted) {
    const enTitle = r.en.title || "";
    const zhTitle = r.zh.title || enTitle;
    en[`docs.item.${r.slug}.title`] = enTitle;
    zh[`docs.item.${r.slug}.title`] = zhTitle;
    en[`docs.item.${r.slug}.desc`] = r.en.description || "";
    zh[`docs.item.${r.slug}.desc`] = r.zh.description || r.en.description || "";
    en[`docs.item.${r.slug}.tab`] = `${enTitle} · MeowArch Docs`;
    zh[`docs.item.${r.slug}.tab`] = `${zhTitle} · MeowArch 文档`;
  }
  for (const r of sorted) {
    for (const dir of ["prev", "next"]) {
      const link = pagerLink(r, ctx, dir);
      if (link && link.minted) { en[link.titleKey] = link.minted.en; zh[link.titleKey] = link.minted.zh; }
    }
  }
  return { en, "zh-CN": zh };
}
/* ---- shared chrome ---- */
function head(outPath, { titleKey, titleStatic, descKey, descStatic, hljs }) {
  const hljsLink = hljs ? `\n    <link rel="stylesheet" href="${rel(outPath, "hljsCss")}" >` : "";
  return `<!DOCTYPE html>
<html lang="en" data-i18n-title="${titleKey}" data-theme="dark">
  <head>
    <meta charset="UTF-8" >
    <meta name="viewport" content="width=device-width, initial-scale=1.0" >
    <meta
      name="description"
      data-i18n-meta="${descKey}"
      content="${escapeHtml(descStatic)}"
    >
    <meta name="theme-color" content="#0c0f14" >
    <title>${escapeHtml(titleStatic)}</title>
    <link rel="icon" href="${rel(outPath, "faviconSvg")}" type="image/svg+xml" >
    <link rel="icon" href="${rel(outPath, "faviconIco")}" sizes="32x32" >
    <link rel="apple-touch-icon" href="${rel(outPath, "appleTouch")}" >
    <script>
      /* Apply the stored/URL theme before first paint to avoid a flash. */
      (() => {
        let t = new URLSearchParams(location.search).get("theme");
        if (t !== "light" && t !== "dark") {
          try { t = localStorage.getItem("meowarch_theme"); } catch {}
        }
        document.documentElement.dataset.theme = t === "light" ? "light" : "dark";
      })();
    </script>
    <link rel="stylesheet" href="${rel(outPath, "styles")}" >
    <link rel="stylesheet" href="${rel(outPath, "docsCss")}" >${hljsLink}
  </head>`;
}

function navLinks(outPath, pad) {
  const home = rel(outPath, "home");
  const dl = rel(outPath, "downloadRoot");
  const docs = rel(outPath, "docsIndex");
  return [
    `<a href="${home}" data-i18n="nav.home">Home</a>`,
    `<a href="${home}#features" data-i18n="nav.features">Features</a>`,
    `<a href="${dl}" data-i18n="nav.download">Download</a>`,
    `<a href="${docs}" aria-current="page" data-i18n="nav.docs">Docs</a>`,
    `<a href="${home}#community" data-i18n="nav.community">Community</a>`,
  ].map((l) => pad + l).join("\n");
}

const BODY_OPEN = `  <body id="top" class="docs-page">
    <a class="skip-link" href="#main" data-i18n="aria.skip">Skip to content</a>

    <div class="bg-decor" aria-hidden="true">
      <span class="bg-paw paw-a">🐾</span>
      <span class="bg-paw paw-b">🐾</span>
      <span class="bg-paw paw-c">🐾</span>
    </div>`;
function topbar(outPath) {
  return `    <header class="topbar">
      <div class="shell topbar-inner">
        <a class="brand" href="${rel(outPath, "home")}" aria-label="MeowArch home" data-i18n-aria="aria.brand">
          <svg class="brand-mark" viewBox="0 0 64 60" aria-hidden="true">
            <defs>
              <linearGradient id="brand-fur" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffc9a3" ></stop>
                <stop offset="1" stop-color="#ef9464" ></stop>
              </linearGradient>
            </defs>
            <path fill="url(#brand-fur)" fill-rule="evenodd" d="M 32 14 L 21 4.5 Q 18 2.2 16.5 5 L 8.5 25 Q 6 31 6 37 L 6 42 Q 6 56 20 56 L 44 56 Q 58 56 58 42 L 58 37 Q 58 31 55.5 25 L 47.5 5 Q 46 2.2 43 4.5 L 32 14 Z M 25 56 L 25 47.5 Q 25 40.5 32 40.5 Q 39 40.5 39 47.5 L 39 56 Z M 22.5 31.5 a 3.4 3.4 0 1 0 0.01 0 Z M 41.5 31.5 a 3.4 3.4 0 1 0 0.01 0 Z M 29.5 35.2 L 34.5 35.2 L 32 38.4 Z"></path>
          </svg>
          <span>
            <span class="brand-name">Meow<em>Arch</em></span>
            <span class="brand-tag" data-i18n="brand.tagline">purrfectly minimal arch</span>
          </span>
        </a>

        <nav class="nav" aria-label="Primary navigation" data-i18n-aria="aria.nav">
${navLinks(outPath, "          ")}
        </nav>

        <div class="top-actions">
          <button
            class="icon-button theme-toggle"
            type="button"
            aria-label="Toggle light / dark theme"
            data-i18n-aria="aria.theme"
            aria-pressed="true"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" ></circle>
              <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19" ></path>
            </svg>
          </button>
          <a
            class="icon-button github-link"
            href="https://github.com/MeowArch-open/MeowArchWebSite"
            target="_blank"
            rel="noreferrer"
            aria-label="MeowArch on GitHub"
            data-i18n-aria="aria.github"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 22v-4.1c.1-1 .1-1.5-.5-2.1 3.2-.4 6.5-1.6 6.5-7A5.5 5.5 0 0 0 19.5 5c.1-.4.5-1.8-.1-3.7 0 0-1.2-.4-4 1.5a13.7 13.7 0 0 0-6.8 0c-2.8-1.9-4-1.5-4-1.5C4 3.2 4.4 4.6 4.5 5A5.5 5.5 0 0 0 3 8.8c0 5.4 3.3 6.6 6.5 7-.6.6-.6 1.1-.5 2.1V22" ></path>
              <path d="M9 18c-3.5 1.6-3.5-1.8-5-2" ></path>
            </svg>
          </a>
          <select class="lang-select" aria-label="Language" data-i18n-aria="aria.lang">
            <option value="en">EN</option>
            <option value="zh-CN">中文</option>
          </select>
          <a class="btn btn-primary btn-sm top-cta" href="${rel(outPath, "downloadRoot")}" data-i18n="cta.download">Download</a>
          <button
            class="icon-button menu-toggle"
            type="button"
            aria-label="Open navigation menu"
            data-i18n-aria="aria.menu"
            aria-expanded="false"
            aria-controls="mobile-menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" ></path>
            </svg>
          </button>
        </div>
      </div>
    </header>`;
}

function mobileMenu(outPath) {
  return `    <nav class="mobile-menu" id="mobile-menu" aria-hidden="true" data-i18n-aria="aria.nav">
${navLinks(outPath, "      ")}
    </nav>`;
}
function footer(outPath) {
  return `    <footer class="footer">
      <div class="shell">
        <div class="footer-inner">
          <span class="f-brand">
            <img src="${rel(outPath, "logo")}" alt="" >
            MeowArch
          </span>
          <span data-i18n="footer.tagline">Built with Arch, care, and a quiet purr.</span>
          <span class="f-links">
            <a href="https://github.com/MeowArch-open/MeowArchWebSite" target="_blank" rel="noreferrer" data-i18n="footer.github">GitHub</a>
            <a href="${rel(outPath, "admin")}" data-i18n="footer.admin">Admin</a>
            <a href="#top" data-i18n="footer.back_top">Back to top ↑</a>
          </span>
        </div>
        <p class="footer-note" data-i18n="footer.disclaimer">
          MeowArch is a community project and is not affiliated with Arch Linux.
        </p>
      </div>
    </footer>`;
}

function scripts(outPath, { apiPanel, mdx, hljs }) {
  const srcs = [];
  if (apiPanel) srcs.push("apiConfig");
  srcs.push("docsI18n", "i18n");
  if (apiPanel) srcs.push("api", "render");
  srcs.push("ui");
  if (mdx) srcs.push("mdxJs");
  const lines = srcs.map((k) => `    <script src="${rel(outPath, k)}" ></script>`);
  if (hljs) lines.push(`    <script src="${rel(outPath, "hljsJs")}" defer></script>`);
  lines.push(`    <script src="${rel(outPath, "docsJs")}" ></script>`);
  return lines.join("\n");
}

export function renderSidebar(sorted, currentOutPath) {
  const groups = [];
  let firstLabel = null;
  let firstLabelEn = "Guide";
  for (const section of SECTION_ORDER) {
    const docs = sorted.filter((r) => r.section === section && r.sidebar);
    if (!docs.length) continue;
    const sec = SECTIONS[section];
    if (!firstLabel) { firstLabel = sec.label; firstLabelEn = sec.labelEn; }
    groups.push(`            <p class="docs-side-title" data-i18n="${sec.label}">${escapeHtml(sec.labelEn)}</p>`);
    for (const r of docs) {
      const href = relpath(currentOutPath, r.outPath);
      groups.push(`            <a href="${escapeHtml(href)}" data-i18n="docs.item.${r.slug}.title">${escapeHtml(r.en.title || r.slug)}</a>`);
    }
  }
  return `        <aside class="docs-side">
          <button class="docs-side-toggle" type="button" aria-expanded="false">
            <span data-i18n="${firstLabel || "docs.guide"}">${escapeHtml(firstLabelEn)}</span>
            <span class="chev" aria-hidden="true">▾</span>
          </button>
          <nav aria-label="Documentation">
${groups.join("\n")}
            <p class="docs-side-title" data-i18n="docs.other">Elsewhere</p>
            <a href="${relpath(currentOutPath, ASSET.home)}" data-i18n="nav.home">Home</a>
            <a href="${relpath(currentOutPath, ASSET.downloadRoot)}" data-i18n="docs.main_download">Download page</a>
            <a href="${relpath(currentOutPath, ASSET.devices)}" data-i18n="docs.devices">Device list</a>
          </nav>
        </aside>`;
}

function apiPanelBlock() {
  return `          <div class="section-head" style="margin-bottom: 4px">
            <span class="kicker" data-i18n="latest.kicker">straight from the API</span>
            <h2 style="margin-top: 8px; border-bottom: none" data-i18n="docs.latest_live">Latest build (live)</h2>
            <p class="sub" style="font-size: 15px" data-i18n="docs.latest_live_sub">Fetched live from the MeowArch Release API.</p>
          </div>
          <div id="dl-status"></div>
          <div class="panel" id="dl-release" hidden style="margin: 14px 0 26px">
            <div class="panel-pad" id="dl-release-body"></div>
          </div>`;
}
/* ---- page assembly ---- */
export function renderPage(record, sorted, ctx) {
  const out = record.outPath;
  const titleEn = record.en.title || record.slug;
  const article = [`        <article class="prose">`];
  if (record.apiPanelBaked) { article.push(apiPanelBlock()); article.push(""); }
  article.push(`          <div class="mdx-body" data-doc="${escapeHtml(record.contentBase)}" aria-live="polite"></div>`);
  const pager = renderPager(record, ctx);
  if (pager) article.push(`          ${pager}`);
  article.push(`        </article>`);

  return [
    head(out, {
      titleKey: `docs.item.${record.slug}.tab`,
      titleStatic: `${titleEn} · MeowArch Docs`,
      descKey: `docs.item.${record.slug}.desc`,
      descStatic: record.en.description || "",
      hljs: true,
    }),
    BODY_OPEN,
    "",
    topbar(out),
    "",
    mobileMenu(out),
    "",
    `    <main class="shell" id="main">
      <div class="docs-layout has-toc">`,
    renderSidebar(sorted, out),
    "",
    article.join("\n"),
    "",
    `        <aside class="docs-toc" aria-label="On this page"></aside>
      </div>
    </main>`,
    "",
    footer(out),
    "",
    scripts(out, { apiPanel: record.apiPanel, mdx: true, hljs: true }),
    `  </body>
</html>`,
  ].join("\n") + "\n";
}

export function renderIndexCards(landing) {
  const out = ASSET.docsIndex;
  return landing
    .map((r, i) => {
      const tint = TINTS[i] || "";
      const reveal = i === 0 ? "reveal" : `reveal d${i}`;
      const href = relpath(out, r.outPath);
      const icon = ICONS[r.icon] || ICONS.code;
      return `          <a class="card card--ear link-card ${reveal}" href="${escapeHtml(href)}">
            <span class="feature-icon${tint}" aria-hidden="true">
              <svg viewBox="0 0 24 24">${icon}</svg>
            </span>
            <h3 data-i18n="docs.item.${r.slug}.title">${escapeHtml(r.en.title || "")}</h3>
            <p data-i18n="docs.item.${r.slug}.desc">${escapeHtml(r.en.description || "")}</p>
            <span class="lc-go" data-i18n="docs.read">Read →</span>
          </a>`;
    })
    .join("\n");
}

export function renderIndexPage(sorted) {
  const out = ASSET.docsIndex;
  const landing = sorted.filter((r) => r.landing);
  const heroPrimary = landing[0] || sorted[0];
  const heroSecondary = sorted.find((r) => r.section === "downloads") || landing[landing.length - 1] || heroPrimary;

  return [
    head(out, {
      titleKey: "title.docs",
      titleStatic: "Documentation · MeowArch",
      descKey: "desc.docs",
      descStatic: "MeowArch documentation — getting started, installation, FAQ and downloads.",
      hljs: false,
    }),
    BODY_OPEN,
    "",
    topbar(out),
    "",
    mobileMenu(out),
    "",
    `    <main class="shell" id="main">
      <section class="page-hero" aria-labelledby="docs-title">
        <a class="crumb" href="${relpath(out, ASSET.home)}" data-i18n="docs.crumb">← main site</a>
        <h1 id="docs-title" data-i18n-html="docs.hero_title_html">MeowArch <em>docs</em></h1>
        <p class="sub" data-i18n="docs.hero_sub">
          Everything you need to install, flash, and live with MeowArch — no scratches guaranteed.
        </p>
        <div class="hero-actions" style="margin-top: 24px">
          <a class="btn btn-primary" href="${relpath(out, heroPrimary.outPath)}" data-i18n="docs.item.${heroPrimary.slug}.title">${escapeHtml(heroPrimary.en.title || "")}</a>
          <a class="btn btn-ghost" href="${relpath(out, heroSecondary.outPath)}" data-i18n="docs.item.${heroSecondary.slug}.title">${escapeHtml(heroSecondary.en.title || "")}</a>
        </div>
      </section>

      <section class="section" style="padding-top: 10px" aria-label="Documentation sections">
        <div class="grid grid-2">
${renderIndexCards(landing)}
        </div>
      </section>
    </main>`,
    "",
    footer(out),
    "",
    scripts(out, { apiPanel: false, mdx: false, hljs: false }),
    `  </body>
</html>`,
  ].join("\n") + "\n";
}
/* ---- serialized artifacts ---- */
function serializeDocsI18n(dict) {
  return `/* AUTO-GENERATED by scripts/gen-docs.mjs — do not edit by hand.
   Per-document i18n strings (title / description / browser-tab title / pager
   overrides) derived from docs/content/*.mdx frontmatter. Loaded BEFORE
   js/i18n.js, which merges these into its en / zh-CN dictionaries so the
   generated docs pages stay content-driven without duplicating strings. */
window.MEOWARCH_DOCS_I18N = ${JSON.stringify(dict, null, 2)};
`;
}

function buildManifest(sorted) {
  return {
    generatedBy: "scripts/gen-docs.mjs",
    note: "Build/test artifact derived from docs/content/*.mdx — not loaded at runtime.",
    sections: SECTION_ORDER.map((id) => ({ id, dir: SECTIONS[id].dir, label: SECTIONS[id].label })),
    docs: sorted.map((r) => ({
      slug: r.slug,
      section: r.section,
      order: r.order,
      icon: r.icon,
      landing: r.landing,
      sidebar: r.sidebar,
      apiPanel: r.apiPanel,
      apiPanelBaked: r.apiPanelBaked,
      outPath: r.outPath,
      contentBase: r.contentBase,
      prev: r._prev ? r._prev.slug : null,
      next: r._next ? r._next.slug : null,
    })),
  };
}

/* Pure build: files -> { pages, docsI18n, docsI18nJs, manifest }. No fs, so it
   is testable against fixture content. main() below does all the actual IO. */
export function generate(files) {
  const records = buildRecords(files);
  const sorted = computeChain(records);
  const ctx = makeCtx(records);
  const pages = {};
  for (const r of sorted) pages[r.outPath] = renderPage(r, sorted, ctx);
  pages["docs/index.html"] = renderIndexPage(sorted);
  const docsI18n = buildDocsI18n(sorted, ctx);
  return {
    sorted,
    ctx,
    pages,
    docsI18n,
    docsI18nJs: serializeDocsI18n(docsI18n),
    manifest: buildManifest(sorted),
  };
}

/* ---- fs IO ---- */
function readContent(contentDir) {
  return readdirSync(contentDir)
    .filter((f) => f.endsWith(".mdx"))
    .sort()
    .map((f) => {
      const name = f.slice(0, -4);
      const dot = name.lastIndexOf(".");
      return {
        file: f,
        slug: name.slice(0, dot),
        lang: name.slice(dot + 1),
        src: readFileSync(join(contentDir, f), "utf8"),
      };
    });
}

function main() {
  const files = readContent(CONTENT);
  const { pages, docsI18nJs, manifest } = generate(files);
  for (const [outPath, html] of Object.entries(pages)) {
    const abs = join(ROOT, outPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, html);
  }
  writeFileSync(join(DOCS, "docs-i18n.js"), docsI18nJs);
  writeFileSync(join(DOCS, "docs-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`gen-docs: wrote ${Object.keys(pages).length} pages + docs-i18n.js + docs-manifest.json`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();







