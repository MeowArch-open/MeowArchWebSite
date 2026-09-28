/* Devices page — fetch MeowArchMobile devices from the Release API, render
   cards, then load the chosen device's latest build. Falls back to built-in
   device data when the API is unreachable. */
(() => {
  "use strict";

  const t = (key, params) => window.MEOWARCH_I18N.t(key, params);
  const { escapeHtml, stateNote, artifactList, checksumBox, metaChips, notesChips } =
    window.MEOWARCH_RENDER;

  const listEl = document.querySelector("#device-list");
  const detailEl = document.querySelector("#device-detail");
  const detailBodyEl = document.querySelector("#device-detail-body");

  /* Offline fallback — mirrors the API seed so the page never breaks. */
  const FALLBACK_DEVICES = [
    {
      brand: "Xiaomi",
      model: "Redmi K80",
      codename: "zorn",
      soc: "Snapdragon 8 Gen 3",
      status: "official",
    },
    {
      brand: "OnePlus",
      model: "OnePlus 9RT",
      codename: "martini",
      soc: "Snapdragon 888",
      status: "community",
    },
  ];

  let devices = null;
  let offline = false;
  let selected = null;
  const releaseCache = new Map(); // codename -> release | null

  function deviceCard(device) {
    const status = device.status || "community";
    const selectable = status === "official";
    const card = document.createElement("article");
    card.className = `device-card ${selectable ? "is-selectable" : "is-muted"}${
      selected === device.codename ? " is-active" : ""
    }`;
    card.innerHTML = `
      <span class="badge is-${escapeHtml(status)}">${escapeHtml(t(`status.${status}`))}</span>
      <h3>${escapeHtml(device.model)}</h3>
      <p class="d-sub">${escapeHtml(device.brand)} · ${escapeHtml(device.codename)}</p>
      ${device.soc ? `<p class="d-soc">${escapeHtml(device.soc)}</p>` : ""}
      ${selectable ? "" : `<p class="d-soc">${escapeHtml(t("dev.pick"))}</p>`}
    `;
    if (selectable) {
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", device.model);
      const select = () => selectDevice(device);
      card.addEventListener("click", select);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
    }
    return card;
  }

  function renderDevices() {
    listEl.innerHTML = "";
    if (offline) {
      listEl.appendChild(stateNote(t("dev.offline"), { variant: "warning" }));
    }
    if (!devices.length) {
      listEl.appendChild(stateNote(t("dev.empty")));
      return;
    }
    devices.forEach((device) => listEl.appendChild(deviceCard(device)));
  }

  function renderDetail(release) {
    const device = release.device || {};
    detailBodyEl.innerHTML = `
      <div class="detail-head">
        <h2><em>MeowArchMobile</em> · ${escapeHtml(device.model || "")}</h2>
        <span class="version-pill">✦ <strong>${escapeHtml(release.version || "")}</strong> · ${escapeHtml(release.releaseDate || "")}</span>
      </div>
      <div class="release-meta">${metaChips(release, { withDevice: false })}</div>
      <div class="release-meta notes-row">${notesChips(release)}</div>
      <div class="release-grid">
        <div class="artifact-list">${artifactList(release)}</div>
        <div>${checksumBox(release)}</div>
      </div>
    `;
  }

  async function selectDevice(device) {
    selected = device.codename;
    renderDevices();
    detailEl.hidden = false;
    detailBodyEl.innerHTML = "";
    detailBodyEl.appendChild(stateNote(t("dev.loading_release", { model: device.model })));

    let release = releaseCache.get(device.codename);
    if (release === undefined) {
      try {
        release = await window.MEOWARCH_API.latestRelease("meowarchmobile", device.codename);
        releaseCache.set(device.codename, release);
      } catch (err) {
        release = err.status === 404 ? null : undefined;
        if (release === undefined) {
          detailBodyEl.innerHTML = "";
          detailBodyEl.appendChild(stateNote(t("dev.load_failed"), { variant: "error" }));
          return;
        }
        releaseCache.set(device.codename, null);
      }
    }

    if (!release) {
      detailBodyEl.innerHTML = "";
      detailBodyEl.appendChild(
        stateNote(t("dev.no_release", { model: device.model }), { variant: "warning" }),
      );
      return;
    }
    renderDetail(release);
    detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function init() {
    listEl.innerHTML = "";
    listEl.appendChild(stateNote(t("dev.loading")));
    try {
      devices = await window.MEOWARCH_API.devices("meowarchmobile");
      offline = false;
    } catch {
      devices = FALLBACK_DEVICES;
      offline = true;
    }
    renderDevices();

    /* Deep link: devices.html?codename=zorn */
    const wanted = new URLSearchParams(window.location.search).get("codename");
    const target = devices.find((d) => d.codename === wanted && (d.status || "community") === "official");
    if (target) selectDevice(target);
  }

  window.addEventListener("meowarch:langchange", () => {
    if (!devices) return;
    renderDevices();
    const release = selected !== null ? releaseCache.get(selected) : undefined;
    if (release) renderDetail(release);
  });

  init();
})();
