/* MeowArch Docs behaviour:
     - sidebar (active link + mobile collapse)
     - client-side MDX rendering of the page body from docs/content/*.mdx
       (per language; re-fetched on language change)
     - auto TOC from the rendered headings, with scroll spy
     - cross-tab theme/language sync
   Loading / error states reuse the site-wide .state-note look. */
(() => {
  "use strict";

  const i18n = window.MEOWARCH_I18N;
  const t = (key, params) => (i18n ? i18n.t(key, params) : key);

  /* ---- sidebar: highlight the current page ---- */
  const here = window.location.pathname.replace(/\/+$/, "");
  document.querySelectorAll(".docs-side nav a").forEach((a) => {
    const target = new URL(a.href, window.location.href);
    if (target.pathname.replace(/\/+$/, "") === here) {
      a.classList.add("is-active");
      a.setAttribute("aria-current", "page");
    }
  });

  /* ---- sidebar: mobile collapse ---- */
  const side = document.querySelector(".docs-side");
  const toggle = document.querySelector(".docs-side-toggle");
  if (side && toggle) {
    toggle.addEventListener("click", () => {
      const open = side.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    side.querySelectorAll("nav a").forEach((a) =>
      a.addEventListener("click", () => side.classList.remove("is-open")),
    );
  }

  /* ---- state notes (same markup as js/render.js stateNote) ---- */
  function stateNote(message, { variant = "", actionLabel, onAction } = {}) {
    const note = document.createElement("div");
    note.className = `state-note${variant ? ` is-${variant}` : ""}`;
    note.textContent = message;
    if (actionLabel && onAction) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-ghost btn-sm";
      button.style.marginLeft = "auto";
      button.textContent = actionLabel;
      button.addEventListener("click", onAction);
      note.appendChild(button);
    }
    return note;
  }

  /* ---- table of contents (right rail) ---- */
  const tocEl = document.querySelector(".docs-toc");
  let tocTitle = null;
  let tocList = null;
  let spy = null;

  function ensureToc() {
    if (!tocEl || tocTitle) return;
    tocTitle = document.createElement("p");
    tocTitle.className = "docs-toc-title";
    tocList = document.createElement("nav");
    tocList.setAttribute("aria-label", "Table of contents");
    tocEl.append(tocTitle, tocList);
  }

  function buildToc(host) {
    if (!tocEl || !("IntersectionObserver" in window)) return;
    ensureToc();
    if (spy) spy.disconnect();
    spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          tocList.querySelectorAll("a").forEach((l) =>
            l.classList.toggle("is-active", l.getAttribute("href") === `#${entry.target.id}`),
          );
        });
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    tocList.innerHTML = "";
    tocTitle.textContent = t("docs.on_this_page");
    const headings = host ? [...host.querySelectorAll("h2")] : [];
    headings.forEach((h, index) => {
      if (!h.id) h.id = `sec-${index + 1}`;
      const link = document.createElement("a");
      link.href = `#${h.id}`;
      link.textContent = h.textContent;
      tocList.appendChild(link);
      spy.observe(h);
    });
  }

  /* ---- hydrate rendered MDX (post-innerHTML behaviours; idempotent) ---- */
  function hydrateCode(host) {
    /* syntax highlight (browser-only; renderer emits plain language-* code) */
    if (window.hljs) {
      host.querySelectorAll("pre code[class*='language-']").forEach((el) => {
        try { window.hljs.highlightElement(el); } catch { /* ignore */ }
      });
    }
    /* wrap each <pre> in a header row (language label + copy button) */
    host.querySelectorAll("pre").forEach((pre) => {
      if (pre.parentElement && pre.parentElement.classList.contains("code-block")) return;
      const code = pre.querySelector("code[class*='language-']");
      const m = code && code.className.match(/language-([\w-]+)/);
      const lang = m ? m[1] : "shell";

      const block = document.createElement("div");
      block.className = "code-block";
      const head = document.createElement("div");
      head.className = "code-head";
      const label = document.createElement("span");
      label.className = "code-lang";
      label.textContent = lang;
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "code-copy";
      copy.textContent = t("docs.copy");
      copy.addEventListener("click", async () => {
        const text = (code || pre).textContent;
        try {
          await navigator.clipboard.writeText(text);
          copy.textContent = t("docs.copied");
          copy.classList.add("is-done");
          setTimeout(() => { copy.textContent = t("docs.copy"); copy.classList.remove("is-done"); }, 1600);
        } catch { /* clipboard blocked; no-op */ }
      });
      head.append(label, copy);

      pre.parentNode.insertBefore(block, pre);
      block.append(head, pre);
    });
  }

  function hydrateTabs(host) {
    host.querySelectorAll(".tabs").forEach((group) => {
      const tabs = [...group.querySelectorAll('[role="tab"]')];
      const select = (idx) => {
        tabs.forEach((tab, i) => {
          const on = i === idx;
          tab.setAttribute("aria-selected", String(on));
          tab.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(tab.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
      };
      tabs.forEach((tab, idx) => {
        tab.addEventListener("click", () => select(idx));
        tab.addEventListener("keydown", (e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          e.preventDefault();
          const next = (idx + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
          tabs[next].focus();
          select(next);
        });
      });
    });
  }

  function hydrateAnchors(host) {
    host.addEventListener("click", (e) => {
      const link = e.target.closest && e.target.closest('a.anchor, a[href^="#"]');
      if (!link) return;
      const id = decodeURIComponent(link.getAttribute("href").slice(1));
      const target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    });
  }

  function hydrate(host) {
    hydrateCode(host);
    hydrateTabs(host);
    if (!host.dataset.anchorsBound) { hydrateAnchors(host); host.dataset.anchorsBound = "1"; }
    wireReleasePanels(); // baked #dl-release + inline :::api-latest placeholders
  }

  /* ---- page actions toolbar (copy Markdown / open) ----
     Injected just under the lede so the layout reads title -> lede -> actions,
     like the reference docs. Opt out per page with `pageActions: false`. */
  function injectPageActions(host, src, lang) {
    const anchor = host.querySelector(".prose-lede") || host.querySelector("h1");
    if (!anchor) return;
    const base = host.dataset.doc;
    const rawUrl = `${base}.${lang}.mdx`;
    const abs = new URL(rawUrl, window.location.href).href;

    const bar = document.createElement("div");
    bar.className = "doc-actions";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn btn-ghost btn-sm";
    copy.textContent = t("docs.copy_md");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(src);
        copy.textContent = t("docs.copied");
        copy.classList.add("is-done");
        setTimeout(() => { copy.textContent = t("docs.copy_md"); copy.classList.remove("is-done"); }, 1600);
      } catch { /* clipboard blocked; no-op */ }
    });

    const open = document.createElement("details");
    open.className = "doc-open";
    const summary = document.createElement("summary");
    summary.className = "btn btn-ghost btn-sm";
    summary.textContent = t("docs.open");
    const menu = document.createElement("div");
    menu.className = "doc-open-menu";
    const q = encodeURIComponent(t("docs.ai_prompt", { url: abs }));
    const item = (labelKey, href) => {
      const a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = t(labelKey);
      a.addEventListener("click", () => { open.open = false; });
      return a;
    };
    menu.append(
      item("docs.open_raw", rawUrl),
      item("docs.open_chatgpt", `https://chatgpt.com/?q=${q}`),
      item("docs.open_claude", `https://claude.ai/new?q=${q}`),
    );
    open.append(summary, menu);

    bar.append(copy, open);
    anchor.insertAdjacentElement("afterend", bar);
  }

  /* close any open "打开" menu when clicking outside it */
  document.addEventListener("click", (e) => {
    document.querySelectorAll("details.doc-open[open]").forEach((d) => {
      if (!d.contains(e.target)) d.open = false;
    });
  });

  /* ---- MDX rendering ---- */
  const host = document.querySelector("[data-doc]");
  if (host && window.MEOWARCH_MDX) {
    const base = host.dataset.doc;
    let loadSeq = 0;
    let inFlight = null;

    function showLoading() {
      host.innerHTML = "";
      host.appendChild(stateNote(t("docs.loading")));
    }

    function showError() {
      host.innerHTML = "";
      host.appendChild(
        stateNote(t("docs.load_error"), {
          variant: "error",
          actionLabel: t("docs.retry"),
          onAction: load,
        }),
      );
    }

    async function load() {
      const myId = ++loadSeq;
      if (inFlight) inFlight.abort();
      const controller = new AbortController();
      inFlight = controller;
      const lang = i18n ? i18n.getLang() : "en";
      showLoading();
      try {
        const res = await fetch(`${base}.${lang}.mdx`, { cache: "no-cache", signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const src = await res.text();
        if (myId !== loadSeq) return; // a newer load() superseded this one
        const { html, frontmatter } = window.MEOWARCH_MDX.render(src);
        host.innerHTML = html;
        if (frontmatter.pageActions !== false) injectPageActions(host, src, lang);
        if (i18n) i18n.apply(host); // localise pager labels (data-i18n)
        hydrate(host);
        buildToc(host);
      } catch (err) {
        if (err && err.name === "AbortError") return; // superseded fetch
        if (myId !== loadSeq) return;
        showError();
        buildToc(host);
      }
    }

    load();
    window.addEventListener("meowarch:langchange", load);
  } else if (host) {
    buildToc(host);
  }

  /* ---- live "latest build" panel ----
     Two entry points, one shared fetch/state:
       1. the baked #dl-release block (download page, `apiPanel: true`);
       2. inline :::api-latest placeholders (`apiPanel: inline` + the directive),
          which let an author drop the live panel anywhere in the body.
     wireReleasePanels() is idempotent — it discovers new targets, prunes ones
     detached by a re-render, and (re)renders from the cached release. */
  const API_PANEL_HTML =
    '<div class="section-head" style="margin-bottom:4px">' +
      '<span class="kicker" data-i18n="latest.kicker"></span>' +
      '<h2 style="margin-top:8px;border-bottom:none" data-i18n="docs.latest_live"></h2>' +
      '<p class="sub" style="font-size:15px" data-i18n="docs.latest_live_sub"></p>' +
    '</div>' +
    '<div class="dl-status"></div>' +
    '<div class="panel" hidden style="margin:14px 0 26px"><div class="panel-pad"></div></div>';

  const releaseTargets = [];
  let releaseState = "idle"; // idle | loading | done | error
  let releaseCurrent = null;
  let releaseErr = null;
  let releaseListenerBound = false;

  function renderReleaseTarget(tg) {
    if (!tg.panel || !tg.panel.isConnected) return; // stale node from a prior render
    const renderer = window.MEOWARCH_RENDER;
    const note = (renderer && renderer.stateNote) || stateNote;
    if (releaseState === "loading") {
      tg.statusEl.innerHTML = "";
      tg.panel.hidden = true;
      tg.statusEl.appendChild(note(t("latest.loading")));
    } else if (releaseState === "done") {
      tg.statusEl.innerHTML = "";
      tg.panel.hidden = false;
      tg.bodyEl.innerHTML = renderer.releaseSummary(releaseCurrent);
    } else if (releaseState === "error") {
      tg.statusEl.innerHTML = "";
      tg.panel.hidden = true;
      tg.statusEl.appendChild(
        note(releaseErr === 404 ? t("dev.empty") : t("latest.offline"), {
          variant: releaseErr === 404 ? "" : "warning",
        }),
      );
    }
  }

  function renderAllReleaseTargets() { releaseTargets.forEach(renderReleaseTarget); }

  async function loadReleaseOnce() {
    const api = window.MEOWARCH_API;
    if (!api) return;
    if (releaseState === "loading" || releaseState === "done") { renderAllReleaseTargets(); return; }
    releaseState = "loading";
    renderAllReleaseTargets();
    try {
      const devices = await api.devices("meowarchmobile");
      const device = devices.find((d) => (d.status || "community") === "official") || devices[0];
      releaseCurrent = await api.latestRelease("meowarchmobile", device.codename);
      releaseState = "done";
    } catch (err) {
      releaseCurrent = null;
      releaseErr = err && err.status;
      releaseState = "error";
    }
    renderAllReleaseTargets();
  }

  function wireReleasePanels() {
    const api = window.MEOWARCH_API;
    const renderer = window.MEOWARCH_RENDER;
    if (!api || !renderer) return; // page didn't load the API scripts

    // Drop targets whose DOM was replaced by a langchange re-render.
    for (let k = releaseTargets.length - 1; k >= 0; k--) {
      if (!releaseTargets[k].panel || !releaseTargets[k].panel.isConnected) releaseTargets.splice(k, 1);
    }

    let added = false;

    // 1) baked download panel (#dl-release, static chrome above the body)
    const baked = document.querySelector("#dl-release");
    if (baked && !baked.dataset.ready) {
      const statusEl = document.querySelector("#dl-status");
      const bodyEl = document.querySelector("#dl-release-body");
      if (statusEl && bodyEl) {
        baked.dataset.ready = "1";
        releaseTargets.push({ panel: baked, statusEl, bodyEl });
        added = true;
      }
    }

    // 2) inline :::api-latest placeholders (rendered into the body)
    document.querySelectorAll('[data-component="api-latest"]').forEach((ph) => {
      if (ph.dataset.ready) return;
      ph.dataset.ready = "1";
      ph.classList.add("api-latest");
      ph.innerHTML = API_PANEL_HTML;
      if (i18n) i18n.apply(ph);
      releaseTargets.push({
        panel: ph.querySelector(".panel"),
        statusEl: ph.querySelector(".dl-status"),
        bodyEl: ph.querySelector(".panel-pad"),
      });
      added = true;
    });

    if (!releaseListenerBound) {
      releaseListenerBound = true;
      window.addEventListener("meowarch:langchange", () => {
        if (releaseState === "done") renderAllReleaseTargets();
      });
    }

    if (added) loadReleaseOnce();
    else if (releaseState === "done") renderAllReleaseTargets();
  }


  /* ---- cross-tab sync (theme / language changed in another tab) ---- */
  window.addEventListener("storage", (event) => {
    if (event.key === "meowarch_theme" && event.newValue) {
      document.documentElement.dataset.theme = event.newValue;
    }
    if (event.key === "meowarch_lang" && event.newValue && i18n) {
      i18n.setLang(event.newValue);
    }
  });
})();
