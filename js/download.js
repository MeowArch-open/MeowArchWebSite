/* Download page — live device list + latest mobile build from the API.
   Device cards deep-link into devices.html?codename=…; the latest official
   build is rendered inline. Offline state keeps the page usable. */
(() => {
  "use strict";

  const t = (key, params) => window.MEOWARCH_I18N.t(key, params);
  const { escapeHtml, stateNote, releaseSummary } = window.MEOWARCH_RENDER;

  const statusEl = document.querySelector("#dl-status");
  const gridEl = document.querySelector("#dl-devices");
  const releaseStatusEl = document.querySelector("#dl-release-status");
  const releaseEl = document.querySelector("#dl-release");

  const FALLBACK_DEVICES = [
    { brand: "Xiaomi", model: "Redmi K80", codename: "zorn", soc: "Snapdragon 8 Gen 3", status: "official" },
  ];

  let devices = null;
  let offline = false;
  let currentRelease = null;

  function deviceCard(device) {
    const status = device.status || "community";
    const selectable = status === "official";
    const card = document.createElement("a");
    card.className = `device-card ${selectable ? "is-selectable" : "is-muted"}`;
    if (selectable) {
      card.href = `devices.html?codename=${encodeURIComponent(device.codename)}`;
    } else {
      card.href = "devices.html";
    }
    card.innerHTML = `
      <span class="badge is-${escapeHtml(status)}">${escapeHtml(t(`status.${status}`))}</span>
      <h3>${escapeHtml(device.model)}</h3>
      <p class="d-sub">${escapeHtml(device.brand)} · ${escapeHtml(device.codename)}</p>
      ${device.soc ? `<p class="d-soc">${escapeHtml(device.soc)}</p>` : ""}
    `;
    return card;
  }

  function renderDevices() {
    gridEl.innerHTML = "";
    if (offline) {
      statusEl.innerHTML = "";
      statusEl.appendChild(stateNote(t("dl.devices.offline"), { variant: "warning" }));
    } else {
      statusEl.innerHTML = "";
    }
    if (!devices.length) {
      gridEl.appendChild(stateNote(t("dev.empty")));
      return;
    }
    devices.forEach((device) => gridEl.appendChild(deviceCard(device)));
  }

  async function loadLatest() {
    releaseStatusEl.innerHTML = "";
    releaseEl.hidden = true;
    releaseStatusEl.appendChild(stateNote(t("latest.loading")));
    try {
      const devices = await window.MEOWARCH_API.devices("meowarchmobile");
      const device = devices.find((d) => (d.status || "community") === "official") || devices[0];
      currentRelease = await window.MEOWARCH_API.latestRelease("meowarchmobile", device.codename);
      releaseStatusEl.innerHTML = "";
      releaseEl.innerHTML = releaseSummary(currentRelease);
      releaseEl.hidden = false;
    } catch (err) {
      currentRelease = null;
      releaseStatusEl.innerHTML = "";
      releaseStatusEl.appendChild(
        stateNote(err.status === 404 ? t("dev.empty") : t("latest.offline"), {
          variant: err.status === 404 ? "" : "warning",
        }),
      );
    }
  }

  async function init() {
    gridEl.innerHTML = "";
    statusEl.innerHTML = "";
    statusEl.appendChild(stateNote(t("dl.devices.loading")));
    try {
      devices = await window.MEOWARCH_API.devices("meowarchmobile");
      offline = false;
    } catch {
      devices = FALLBACK_DEVICES;
      offline = true;
    }
    renderDevices();
    loadLatest();
  }

  window.addEventListener("meowarch:langchange", () => {
    if (devices) renderDevices();
    if (currentRelease) releaseEl.innerHTML = releaseSummary(currentRelease);
  });

  init();
})();
