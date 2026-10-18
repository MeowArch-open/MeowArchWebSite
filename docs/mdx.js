/* MeowArch Docs — tiny, dependency-free Markdown/MDX renderer.
   Turns a docs .mdx file (flat frontmatter + rich Markdown) into HTML that
   matches the styling the docs pages used to ship inline. Pure string -> string
   (no DOM), so it is unit-testable outside the browser.

   Blocks : #..###### (h1-h6, slug id + anchor; first <p> after h1 = .prose-lede),
            ``` fenced code (```term keeps the ❯/# terminal look byte-for-byte;
            other langs -> <pre><code class="language-*"> for browser highlight.js),
            > blockquotes (nestable), - / * / + / 1. lists (nested + [ ]/[x] tasks),
            | tables | (optional :---: column alignment), --- horizontal rules,
            [^id]: footnote definitions, ::: component directives.
   Inline : `code`, bold, italic, ~~strike~~, [t](url) links + <url> and
            bare autolinks, ![alt](url) images, [^id] footnote refs.
   Directives : :::tip|note|warning|danger|info admonitions, :::tabs (=== Title),
                :::card, :::cards / :::steps (icon+title+desc card grid, steps
                auto-number), :::details, :::api-latest — declarative, no code exec.
   Security   : raw HTML is ESCAPED, never passed through; javascript:/data:/vbscript:
                URLs are neutralized on links AND images.
   Frontmatter drives the .docs-pager (prev/next) and, for the generator, page meta. */
(function (root) {
  "use strict";

  /* per-render state (slug uniqueness, component ids, footnotes) */
  let S = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  /* ---- flat "key: value" frontmatter between --- fences (bool/int coerced) ---- */
  function coerceValue(v) {
    if (v === "true") return true;
    if (v === "false") return false;
    if (/^-?\d+$/.test(v)) return Number(v);
    return v;
  }

  function parseFrontmatter(src) {
    const frontmatter = {};
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
    if (!match) return { frontmatter, body: src };
    match[1].split(/\r?\n/).forEach((line) => {
      const idx = line.indexOf(":");
      if (idx <= 0) return;
      frontmatter[line.slice(0, idx).trim()] = coerceValue(line.slice(idx + 1).trim());
    });
    return { frontmatter, body: src.slice(match[0].length) };
  }

  /* ---- URL safety + slugs ---- */
  function safeUrl(url) {
    return !/^\s*(?:javascript|data|vbscript):/i.test(url);
  }

  function slugify(text) {
    return String(text)
      .replace(/<[^>]*>/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^\w一-鿿]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  }

  function uniqueSlug(text) {
    const base = slugify(text);
    let slug = base;
    let n = 2;
    while (S.slugs.has(slug)) { slug = `${base}-${n}`; n += 1; }
    S.slugs.set(slug, true);
    return slug;
  }

  /* ---- inline spans: protect code -> escape -> media/links -> emphasis -> restore ---- */
  function inline(text) {
    const store = [];
    const stash = (html) => { store.push(html); return `\u0000${store.length - 1}\u0000`; };
    let s = String(text);

    s = s.replace(/`([^`]+)`/g, (m, code) => stash(`<code>${escapeHtml(code)}</code>`));

    /* footnote refs before escaping so ids match the (raw) definition ids */
    s = s.replace(/\[\^([^\]]+)\]/g, (m, id) => {
      id = id.trim();
      let idx = S.footOrder.indexOf(id);
      if (idx === -1) { S.footOrder.push(id); idx = S.footOrder.length - 1; }
      const sid = slugify(id);
      return stash(`<sup class="fn-ref" id="fnref-${sid}"><a href="#fn-${sid}">${idx + 1}</a></sup>`);
    });

    s = escapeHtml(s);

    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) =>
      safeUrl(url) ? stash(`<img src="${url}" alt="${alt}">`) : alt);

    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
      if (!safeUrl(url)) return label;
      const attrs = /^https?:/i.test(url) ? ' target="_blank" rel="noreferrer"' : "";
      return stash(`<a href="${url}"${attrs}>${label}</a>`);
    });

    s = s.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (m, url) =>
      stash(`<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`));

    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g, (m, pre, url) => {
      const trail = (url.match(/[.,;:!?)\]}]+$/) || [""])[0];
      const clean = url.slice(0, url.length - trail.length);
      return `${pre}${stash(`<a href="${clean}" target="_blank" rel="noreferrer">${clean}</a>`)}${trail}`;
    });

    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^\w_])__([^_]+)__(?!\w)/g, "$1<strong>$2</strong>");
    s = s.replace(/(^|[^\w_])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>");
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");

    s = s.replace(/\u0000(\d+)\u0000/g, (m, n) => store[Number(n)]);
    return s;
  }

  /* ---- fenced code: terminal langs keep the ❯/# look; others -> language-* ---- */
  const TERMINAL_LANGS = new Set(["", "term", "console", "shell", "sh", "bash"]);

  function renderCode(code, lang) {
    if (TERMINAL_LANGS.has(lang)) {
      const body = code.split("\n").map((ln) => {
        if (/^\s*#/.test(ln)) return `<span class="t-dim">${escapeHtml(ln)}</span>`;
        const prompt = /^(\s*)(❯)(\s?)([\s\S]*)$/.exec(ln);
        if (prompt) {
          return `${escapeHtml(prompt[1])}<span class="t-prompt">❯</span>${escapeHtml(prompt[3])}${escapeHtml(prompt[4])}`;
        }
        return escapeHtml(ln);
      }).join("\n");
      return `<pre>${body}</pre>`;
    }
    const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
    return `<pre><code${cls}>${escapeHtml(code)}</code></pre>`;
  }

  /* ---- admonitions ---- */
  const CALLOUTS = {
    tip: { cls: "is-tip", icon: "💡" },
    warning: { cls: "is-warning", icon: "⚠️" },
    danger: { cls: "is-danger", icon: "⛔" },
    info: { cls: "is-info", icon: "ℹ️" },
    note: { cls: "", icon: "📝" },
  };

  function renderCallout(type, label, innerLines) {
    const def = CALLOUTS[type] || CALLOUTS.note;
    const cls = def.cls ? ` ${def.cls}` : "";
    const labelSpan = label ? `<span class="co-label">${inline(label)}</span>` : "";
    const inner = parseBlocks(innerLines, { top: false });
    let body;
    if (/^<p>/.test(inner) && inner.indexOf("<p>", 3) === -1 && /<\/p>$/.test(inner)) {
      body = inner.replace(/^<p>/, `<p>${labelSpan}`);
    } else {
      body = labelSpan + inner;
    }
    return `<div class="callout${cls}"><span class="co-icon" aria-hidden="true">${def.icon}</span>${body}</div>`;
  }

  /* ---- component directives (declarative; no code execution) ---- */
  function renderTabs(args, innerLines) {
    const uid = `tabs-${S.uid++}`;
    const panels = [];
    let cur = null;
    for (const ln of innerLines) {
      const m = /^===\s+(.*)$/.exec(ln);
      if (m) { cur = { title: m[1].trim(), body: [] }; panels.push(cur); }
      else if (cur) cur.body.push(ln);
    }
    if (!panels.length) return "";
    const tabs = panels.map((p, idx) =>
      `<button class="tab" role="tab" type="button" id="${uid}-t${idx}" aria-controls="${uid}-p${idx}" aria-selected="${idx === 0 ? "true" : "false"}"${idx === 0 ? "" : ' tabindex="-1"'}>${inline(p.title)}</button>`,
    ).join("");
    const bodies = panels.map((p, idx) =>
      `<div class="tab-panel" role="tabpanel" id="${uid}-p${idx}" aria-labelledby="${uid}-t${idx}"${idx === 0 ? "" : " hidden"}>${parseBlocks(p.body, { top: false })}</div>`,
    ).join("");
    return `<div class="tabs"><div class="tab-strip" role="tablist">${tabs}</div>${bodies}</div>`;
  }

  function renderCard(args) {
    const parts = args.split("|").map((x) => x.trim());
    const title = parts[0] || "";
    let href = "#";
    for (const p of parts.slice(1)) {
      const h = /^href:\s*(.*)$/.exec(p);
      if (h) href = h[1].trim();
    }
    const safe = safeUrl(href) ? href : "#";
    return `<a class="card card--ear link-card" href="${escapeHtml(safe)}"><h3>${inline(title)}</h3><span class="lc-go" aria-hidden="true">→</span></a>`;
  }

  /* ---- card / step grids: :::cards | :::steps wrapping child :::card blocks ---- */
  const ICONS = {
    code: '<path d="M8 6 3 12l5 6"></path><path d="m16 6 5 6-5 6"></path>',
    download: '<path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path>',
    help: '<circle cx="12" cy="12" r="9"></circle><path d="M9.2 9a2.9 2.9 0 0 1 5.6.9c0 1.8-2.4 2.2-2.4 3.6"></path><path d="M12 17h.01"></path>',
    device: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"></rect><path d="M10.5 18.5h3"></path>',
  };
  const CARD_TINTS = ["", " tint-sky", " tint-green", " tint-red"];

  function parseCardChildren(lines) {
    const cards = [];
    let i = 0;
    while (i < lines.length) {
      const head = /^:::card\b[ \t]*(.*)$/.exec(lines[i]);
      if (!head) { i += 1; continue; }
      const buf = [];
      let depth = 1;
      i += 1;
      while (i < lines.length) {
        if (/^:::\s*$/.test(lines[i])) { depth -= 1; if (depth === 0) { i += 1; break; } buf.push(lines[i]); i += 1; continue; }
        if (/^:::\w/.test(lines[i])) depth += 1;
        buf.push(lines[i]); i += 1;
      }
      cards.push({ args: head[1].trim(), body: buf });
    }
    return cards;
  }

  function renderDetails(args, innerLines) {
    return `<details class="details"><summary>${inline(args || "Details")}</summary><div class="details-body">${parseBlocks(innerLines, { top: false })}</div></details>`;
  }

  function renderGridCard(card, idx, numbered) {
    const parts = card.args.split("|").map((x) => x.trim());
    const title = parts[0] || "";
    let href = "";
    let icon = "";
    for (const p of parts.slice(1)) {
      let m;
      if ((m = /^href:\s*(.*)$/.exec(p))) href = m[1].trim();
      else if ((m = /^icon:\s*(.*)$/.exec(p))) icon = m[1].trim();
    }
    const tint = CARD_TINTS[idx % CARD_TINTS.length];
    const iconHtml = icon && ICONS[icon]
      ? `<span class="feature-icon${tint}" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[icon]}</svg></span>`
      : "";
    const num = numbered ? `<span class="card-num">${idx + 1}.</span> ` : "";
    const body = card.body.length ? parseBlocks(card.body, { top: false }) : "";
    const inner = `${iconHtml}<h3>${num}${inline(title)}</h3>${body}`;
    if (href && safeUrl(href)) {
      const attrs = /^https?:/i.test(href) ? ' target="_blank" rel="noreferrer"' : "";
      return `<a class="card card--ear link-card doc-card" href="${escapeHtml(href)}"${attrs}>${inner}</a>`;
    }
    return `<div class="card doc-card">${inner}</div>`;
  }

  function renderCardGrid(args, innerLines, numbered) {
    const cards = parseCardChildren(innerLines);
    if (!cards.length) return "";
    let cols = 0;
    const cm = /cols:\s*(\d)/.exec(args || "");
    if (cm) cols = Number(cm[1]);
    if (!cols) cols = cards.length % 3 === 0 ? 3 : 2;
    cols = Math.min(Math.max(cols, 1), 4);
    const items = cards.map((c, i) => renderGridCard(c, i, numbered)).join("");
    return `<div class="card-grid grid grid-${cols}${numbered ? " is-steps" : ""}">${items}</div>`;
  }

  const COMPONENTS = {
    tabs: (a, b) => renderTabs(a, b),
    card: (a) => renderCard(a),
    cards: (a, b) => renderCardGrid(a, b, false),
    steps: (a, b) => renderCardGrid(a, b, true),
    details: (a, b) => renderDetails(a, b),
    "api-latest": () => '<div data-component="api-latest"></div>',
  };

  function consumeDirective(lines, start) {
    const head = /^:::([\w-]+)?\s*(.*)$/.exec(lines[start]);
    const name = (head[1] || "note").toLowerCase();
    const args = (head[2] || "").trim();
    const buf = [];
    let depth = 1;
    let i = start + 1;
    while (i < lines.length) {
      if (/^:::\s*$/.test(lines[i])) { depth -= 1; if (depth === 0) { i += 1; break; } buf.push(lines[i]); i += 1; continue; }
      if (/^:::\w/.test(lines[i])) { depth += 1; }
      buf.push(lines[i]); i += 1;
    }
    const html = COMPONENTS[name] ? COMPONENTS[name](args, buf) : renderCallout(name, args, buf);
    return { html, next: i };
  }

  /* ---- tables (optional column alignment from the separator row) ---- */
  function splitRow(row) {
    let r = row.trim();
    if (r.startsWith("|")) r = r.slice(1);
    if (r.endsWith("|")) r = r.slice(0, -1);
    return r.split("|").map((cell) => cell.trim());
  }

  function isTableSeparator(line) {
    if (!line || !line.includes("|")) return false;
    const cells = splitRow(line);
    return cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell));
  }

  function parseAlign(sepLine) {
    return splitRow(sepLine).map((c) => {
      const l = c.startsWith(":");
      const r = c.endsWith(":");
      if (l && r) return "center";
      if (r) return "right";
      if (l) return "left";
      return null;
    });
  }

  function renderTable(header, sep, rows) {
    const aligns = parseAlign(sep);
    const cell = (tag, c, idx) => {
      const a = aligns[idx];
      return `<${tag}${a ? ` class="ta-${a}"` : ""}>${inline(c)}</${tag}>`;
    };
    const head = splitRow(header).map((c, idx) => cell("th", c, idx)).join("");
    const body = rows
      .map((r) => `<tr>${splitRow(r).map((c, idx) => cell("td", c, idx)).join("")}</tr>`)
      .join("");
    return `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  /* ---- lists (nested via indentation; [ ]/[x] -> task items) ---- */
  function matchListItem(line) {
    const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (!m) return null;
    return { indent: m[1].length, ordered: /\d/.test(m[2]), text: m[3] };
  }

  function consumeList(lines, start) {
    const first = matchListItem(lines[start]);
    const baseIndent = first.indent;
    const ordered = first.ordered;
    const items = [];
    let i = start;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*$/.test(line)) {
        const nx = lines[i + 1];
        if (nx != null && !/^\s*$/.test(nx) && (matchListItem(nx) || /^\s{2,}\S/.test(nx))) { i += 1; continue; }
        break;
      }
      const m = matchListItem(line);
      if (m) {
        const diff = m.indent - baseIndent;
        if (diff <= -1) break;
        if (diff >= 2) {
          const nested = consumeList(lines, i);
          if (items.length) items[items.length - 1].parts.push({ html: nested.html });
          i = nested.next;
          continue;
        }
        let text = m.text;
        let checked = null;
        const task = /^\[([ xX])\]\s+(.*)$/.exec(text);
        if (task) { checked = /[xX]/.test(task[1]); text = task[2]; }
        items.push({ checked, parts: [{ text }] });
        i += 1;
        continue;
      }
      if (/^\s+\S/.test(line) && items.length) {
        const last = items[items.length - 1];
        const lp = last.parts[last.parts.length - 1];
        if (lp && lp.text != null) lp.text += ` ${line.trim()}`;
        else last.parts.push({ text: line.trim() });
        i += 1;
        continue;
      }
      break;
    }
    const isTask = items.some((it) => it.checked !== null);
    const tag = ordered ? "ol" : "ul";
    const listCls = isTask ? ' class="task-list"' : "";
    const lis = items.map((it) => {
      const inner = it.parts.map((p) => (p.text != null ? inline(p.text) : p.html)).join("");
      if (it.checked !== null) {
        return `<li class="task-item"><input type="checkbox" disabled${it.checked ? " checked" : ""}> ${inner}</li>`;
      }
      return `<li>${inner}</li>`;
    }).join("");
    return { html: `<${tag}${listCls}>${lis}</${tag}>`, next: i };
  }

  function consumeBlockquote(lines, start) {
    const buf = [];
    let i = start;
    while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
      buf.push(lines[i].replace(/^\s*>\s?/, ""));
      i += 1;
    }
    return { html: `<blockquote>${parseBlocks(buf, { top: false })}</blockquote>`, next: i };
  }

  /* ---- block parser (recursive, container-aware) ---- */
  const HR_RE = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;

  function isBlockStart(line) {
    return (
      /^#{1,6}\s/.test(line) ||
      /^```/.test(line) ||
      /^:::/.test(line) ||
      /^\s*>\s?/.test(line) ||
      HR_RE.test(line) ||
      /^\s*[-*+]\s+/.test(line) ||
      /^\s*\d+[.)]\s+/.test(line) ||
      /^\[\^[^\]]+\]:/.test(line)
    );
  }

  function parseBlocks(lines, opts) {
    const top = !!(opts && opts.top);
    const out = [];
    let i = 0;
    let pendingLede = false;

    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*$/.test(line)) { i += 1; continue; }

      /* fenced code: opening run of >=3 backticks; the closing fence must be a
         line of at least that many backticks (CommonMark). An unmatched fence
         runs to the end of the block instead of stalling the parser. */
      const fence = /^(`{3,})([^`]*)$/.exec(line);
      if (fence) {
        const open = fence[1].length;
        const lang = fence[2].trim().split(/\s+/)[0] || "";
        const buf = [];
        i += 1;
        while (i < lines.length) {
          const close = /^(`{3,})[ \t]*$/.exec(lines[i]);
          if (close && close[1].length >= open) { i += 1; break; }
          buf.push(lines[i]); i += 1;
        }
        out.push(renderCode(buf.join("\n"), lang));
        pendingLede = false;
        continue;
      }

      if (/^:::/.test(line)) {
        const res = consumeDirective(lines, i);
        out.push(res.html);
        i = res.next;
        pendingLede = false;
        continue;
      }

      const heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading) {
        const level = heading[1].length;
        const raw = heading[2].trim().replace(/\s+#+\s*$/, "");
        const slug = uniqueSlug(raw);
        out.push(`<h${level} id="${slug}">${inline(raw)}<a class="anchor" href="#${slug}" aria-hidden="true">#</a></h${level}>`);
        pendingLede = top && level === 1;
        i += 1;
        continue;
      }

      if (/^\s*>\s?/.test(line)) {
        const res = consumeBlockquote(lines, i);
        out.push(res.html);
        i = res.next;
        pendingLede = false;
        continue;
      }

      if (HR_RE.test(line)) { out.push("<hr>"); i += 1; pendingLede = false; continue; }

      if (line.includes("|") && isTableSeparator(lines[i + 1])) {
        const header = line;
        const sep = lines[i + 1];
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes("|") && !/^\s*$/.test(lines[i])) { rows.push(lines[i]); i += 1; }
        out.push(renderTable(header, sep, rows));
        pendingLede = false;
        continue;
      }

      const fnDef = /^\[\^([^\]]+)\]:\s*(.*)$/.exec(line);
      if (fnDef) {
        const buf = [fnDef[2]];
        i += 1;
        while (i < lines.length && /^\s+\S/.test(lines[i])) { buf.push(lines[i].trim()); i += 1; }
        S.footDefs.set(fnDef[1].trim(), buf.join(" ").trim());
        pendingLede = false;
        continue;
      }

      if (matchListItem(line)) {
        const res = consumeList(lines, i);
        out.push(res.html);
        i = res.next;
        pendingLede = false;
        continue;
      }

      /* paragraph: consume the current line up front so a block-looking line no
         handler claimed (e.g. a fence with a stray backtick) still advances i */
      const para = [lines[i]];
      i += 1;
      while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !isBlockStart(lines[i]) &&
        !(lines[i].includes("|") && isTableSeparator(lines[i + 1]))
      ) {
        para.push(lines[i]); i += 1;
      }
      const cls = pendingLede ? ' class="prose-lede"' : "";
      pendingLede = false;
      out.push(`<p${cls}>${inline(para.join(" ").trim())}</p>`);
    }
    return out.filter(Boolean).join("\n");
  }

  /* ---- footnotes (collected during the block pass, emitted at the end) ---- */
  function renderFootnotes() {
    if (!S.footOrder.length) return "";
    const items = S.footOrder.map((id) => {
      const sid = slugify(id);
      const text = S.footDefs.get(id) || "";
      return `<li id="fn-${sid}">${inline(text)} <a href="#fnref-${sid}" class="fn-back" aria-label="Back to reference">↩</a></li>`;
    }).join("");
    return `<section class="footnotes"><hr><ol>${items}</ol></section>`;
  }

  function render(src) {
    S = { uid: 0, slugs: new Map(), footDefs: new Map(), footOrder: [] };
    const { frontmatter, body } = parseFrontmatter(String(src));
    const lines = body.replace(/\r\n/g, "\n").split("\n");
    const parts = [parseBlocks(lines, { top: true })];
    const footnotes = renderFootnotes();
    if (footnotes) parts.push(footnotes);
    return { html: parts.filter(Boolean).join("\n"), frontmatter };
  }

  root.MEOWARCH_MDX = { render, escapeHtml, parseFrontmatter, TERMINAL_LANGS };
})(typeof window !== "undefined" ? window : globalThis);
