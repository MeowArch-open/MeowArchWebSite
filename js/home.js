/* Home page — live "Latest build" panel + hero release pill. */
(() => {
  "use strict";

  const t = (key, params) => window.MEOWARCH_I18N.t(key, params);
  const { escapeHtml, stateNote, releaseSummary } = window.MEOWARCH_RENDER;

  const statusEl = document.querySelector("#latest-status");
  const chipsEl = document.querySelector("#latest-chips");
  const releaseEl = document.querySelector("#latest-release");
  const pillVersionEl = document.querySelector("#hero-release-version");
  const pillExtraEl = document.querySelector("#hero-release-extra");
  const pillEl = document.querySelector("#hero-release");

  let devices = null;
  let offline = false;
  let activeCodename = null;
  const releaseCache = new Map(); // codename -> release | null (null = 404)

  function renderChips() {
    chipsEl.innerHTML = "";
    devices.forEach((device) => {
      const status = device.status || "community";
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `device-chip${device.codename === activeCodename ? " is-active" : ""}`;
      chip.innerHTML = `
        <span class="s-dot is-${escapeHtml(status)}"></span>
        ${escapeHtml(device.model)} <span style="color:var(--text-3)">· ${escapeHtml(device.codename)}</span>`;
      chip.addEventListener("click", () => {
        activeCodename = device.codename;
        renderChips();
        loadRelease(device.codename);
      });
      chipsEl.appendChild(chip);
    });
  }

  function showOffline(message) {
    statusEl.innerHTML = "";
    statusEl.appendChild(
      stateNote(t("latest.offline"), {
        variant: "warning",
        actionLabel: t("latest.retry"),
        onAction: init,
      }),
    );
  }

  function setLoading() {
    statusEl.innerHTML = "";
    statusEl.appendChild(stateNote(t("latest.loading")));
  }

  async function loadRelease(codename) {
    releaseEl.hidden = true;
    setLoading();
    let release = releaseCache.get(codename);
    if (release === undefined) {
      try {
        release = await window.MEOWARCH_API.latestRelease("meowarchmobile", codename);
        releaseCache.set(codename, release);
      } catch (err) {
        release = err.status === 404 ? null : undefined;
        if (release === undefined) {
          showOffline();
          return;
        }
        releaseCache.set(codename, null);
      }
    }
    statusEl.innerHTML = "";
    if (!release) {
      statusEl.appendChild(stateNote(t("dev.no_release", { model: codename })));
      return;
    }
    releaseEl.innerHTML = releaseSummary(release);
    releaseEl.hidden = false;
  }

  async function init() {
    setLoading();
    try {
      devices = await window.MEOWARCH_API.devices("meowarchmobile");
      offline = false;
    } catch {
      devices = null;
      offline = true;
    }

    if (!devices || devices.length === 0) {
      showOffline();
      pillVersionEl.textContent = t("pill.offline");
      pillExtraEl.textContent = "";
      return;
    }

    statusEl.innerHTML = "";
    chipsEl.hidden = false;

    if (offline) {
      statusEl.appendChild(stateNote(t("latest.offline"), { variant: "warning" }));
    }

    const preferred =
      devices.find((d) => (d.status || "community") === "official") || devices[0];
    activeCodename = preferred.codename;
    renderChips();
    loadRelease(preferred.codename);
  }

  async function updatePill({ silent = false } = {}) {
    const dotEl = pillEl.querySelector(".dot");
    if (!silent) pillEl.classList.add("is-loading");
    pillVersionEl.textContent = silent ? pillVersionEl.textContent : t("pill.loading");
    if (!silent) {
      pillExtraEl.textContent = "";
      if (dotEl) dotEl.hidden = true;
    }
    try {
      const devices = await window.MEOWARCH_API.devices("meowarchmobile");
      const device = devices.find((d) => (d.status || "community") === "official") || devices[0];
      const release = await window.MEOWARCH_API.latestRelease("meowarchmobile", device.codename);
      pillVersionEl.textContent = `${release.version} · ${release.device.model}`;
      pillExtraEl.textContent = release.releaseDate || "";
      if (dotEl) dotEl.hidden = !release.releaseDate;
    } catch {
      pillVersionEl.textContent = t("pill.offline");
      pillExtraEl.textContent = "MeowArchMobile";
      if (dotEl) dotEl.hidden = false;
    } finally {
      pillEl.classList.remove("is-loading");
    }
  }

  /* Re-render cached data when the language changes (no refetch). */
  window.addEventListener("meowarch:langchange", () => {
    if (devices) {
      renderChips();
      if (releaseCache.get(activeCodename)) {
        releaseEl.innerHTML = releaseSummary(releaseCache.get(activeCodename));
      }
    }
    updatePill({ silent: true });
  });

  updatePill();
  init();
})();
