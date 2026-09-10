/* MeowArchMobile device picker — powered by the MeowArch Release API. */
const API = window.MEOWARCH_API_BASE || "http://127.0.0.1:3000/api/v1";
const REQUEST_TIMEOUT_MS = 5000;
const t = (key, params) => window.MEOWARCH_I18N.t(key, params);

const deviceListEl = document.querySelector("#device-list");
const deviceDetailEl = document.querySelector("#device-detail");

/* Cached render state, so a language switch re-renders without refetching. */
let lastDevices = null;
let lastOffline = false;
let lastRelease = null;

/* Offline fallback — mirrors the API seed data so the page never breaks. */
const FALLBACK_DEVICES = [
  {
    brand: "Xiaomi",
    model: "Redmi K80",
    codename: "munch",
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(
        body.message || t("a.request_failed", { status: res.status }),
      );
      error.status = res.status;
      throw error;
    }
    return body.data;
  } finally {
    clearTimeout(timer);
  }
}

/* ---- rendering helpers ---- */

function stateNote(message, { retry = false } = {}) {
  deviceListEl.innerHTML = "";
  const note = document.createElement("div");
  note.className = "state-note";
  note.textContent = message;
  if (retry) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-secondary retry-button";
    button.textContent = t("retry");
    button.addEventListener("click", init);
    note.appendChild(button);
  }
  deviceListEl.appendChild(note);
}

function deviceCard(device) {
  const article = document.createElement("article");
  const status = device.status || "community";
  const unavailable = status === "community";

  article.className = `device-card${unavailable ? " is-unavailable" : ""}`;
  article.dataset.codename = device.codename;

  if (unavailable) {
    article.setAttribute("aria-disabled", "true");
    article.setAttribute(
      "aria-label",
      t("devices.card_unavailable_aria", { model: device.model }),
    );
  } else {
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute(
      "aria-label",
      t("devices.card_aria", { model: device.model }),
    );
  }

  article.innerHTML = `
    <span class="device-badge is-${escapeHtml(status)}">${escapeHtml(t(`status.${status}`))}</span>
    <h3>${escapeHtml(device.model)}</h3>
    <p class="device-brand">${escapeHtml(device.brand)} · ${escapeHtml(device.codename)}</p>
    <p class="device-soc">${escapeHtml(device.soc || "")}</p>
    ${unavailable ? `<p class="device-unavailable-note">${escapeHtml(t("devices.not_available"))}</p>` : ""}
  `;

  if (!unavailable) {
    const select = () => selectDevice(device);
    article.addEventListener("click", select);
    article.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
  }

  return article;
}

function renderDevices(devices, { offline = false } = {}) {
  lastDevices = devices;
  lastOffline = offline;
  deviceListEl.innerHTML = "";
  if (offline) {
    const note = document.createElement("div");
    note.className = "state-note is-warning";
    note.textContent = t("offline_warning");
    deviceListEl.appendChild(note);
  }
  devices.forEach((device) => deviceListEl.appendChild(deviceCard(device)));
}

function artifactButton(artifact, label, primary = false) {
  if (!artifact?.url) return "";
  const cls = primary ? "button button-primary" : "button button-secondary";
  return `<a class="${cls}" href="${escapeHtml(artifact.url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}${artifact.fileSize ? ` (${escapeHtml(artifact.fileSize)})` : ""}</a>`;
}

function renderDetail(release, { scroll = true } = {}) {
  const iso = release.artifacts?.iso;
  const torrent = release.artifacts?.torrent;
  const bootImg = release.artifacts?.bootImg;
  const device = release.device || {};
  const checksum =
    iso?.sha256 ||
    bootImg?.sha256 ||
    "0000000000000000000000000000000000000000000000000000000000000000";
  const bootLabel = t("detail.boot_image_html", {
    name: escapeHtml(bootImg.fileName || "boot"),
  });

  lastRelease = release;
  deviceDetailEl.innerHTML = `
    <div class="detail-head">
      <h2><span>MeowArchMobile</span> <strong>${escapeHtml(device.model || "")}</strong></h2>
      <span class="release-pill">
        <span class="release-spark">✦</span>
        <span>${escapeHtml(t("pill.latest"))}</span>
        <strong>${escapeHtml(release.version || "")}</strong>
        <span class="release-dot">•</span>
        <span>${escapeHtml(release.releaseDate || "")}</span>
      </span>
    </div>
    <div class="detail-meta">
      <span>${escapeHtml(t("detail.channel"))} <strong>${escapeHtml(release.channel || "stable")}</strong></span>
      <span>${escapeHtml(t("detail.codename"))} <strong>${escapeHtml(device.codename || "")}</strong></span>
      ${device.arch ? `<span>${escapeHtml(t("detail.arch"))} <strong>${escapeHtml(device.arch)}</strong></span>` : ""}
      ${device.soc ? `<span>${escapeHtml(t("detail.soc"))} <strong>${escapeHtml(device.soc)}</strong></span>` : ""}
    </div>
    <div class="detail-artifacts">
      ${artifactButton(iso, t("d.download_iso"), true)}
      ${artifactButton(torrent, t("detail.torrent"))}
      ${bootImg?.url ? `<a class="text-link boot-img-link" href="${escapeHtml(bootImg.url)}" target="_blank" rel="noreferrer">${bootLabel}</a>` : ""}
    </div>
    ${
      iso?.fileName
        ? `<div class="checksum-box" role="group" aria-label="${escapeHtml(t("aria.checksum"))}">
      <code>$ sha256sum ${escapeHtml(iso.fileName)}</code>
      <code class="checksum-hash">${escapeHtml(checksum)} &nbsp;${escapeHtml(iso.fileName)}</code>
    </div>`
        : ""
    }
    ${
      release.notes
        ? `<div class="detail-notes">
      ${release.notes.androidBase ? `<span>${escapeHtml(t("detail.android_base"))} <strong>${escapeHtml(release.notes.androidBase)}</strong></span>` : ""}
      ${release.notes.kernelVersion ? `<span>${escapeHtml(t("detail.kernel"))} <strong>${escapeHtml(release.notes.kernelVersion)}</strong></span>` : ""}
    </div>`
        : ""
    }
  `;
  deviceDetailEl.hidden = false;
  if (scroll) {
    deviceDetailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function selectDevice(device) {
  lastRelease = null;
  deviceDetailEl.hidden = false;
  deviceDetailEl.innerHTML = `<div class="state-note">${escapeHtml(t("loading_release", { model: device.model }))}</div>`;
  try {
    const release = await fetchJson(
      `${API}/releases/latest?flavor=meowarchmobile&codename=${encodeURIComponent(device.codename)}`,
    );
    renderDetail(release);
  } catch (error) {
    if (error.status === 404) {
      deviceDetailEl.innerHTML = `<div class="state-note">${escapeHtml(t("no_release", { model: device.model }))}</div>`;
    } else {
      deviceDetailEl.innerHTML = `<div class="state-note is-warning">${escapeHtml(t("load_release_failed"))}</div>`;
    }
  }
}

async function init() {
  lastRelease = null;
  deviceDetailEl.hidden = true;
  deviceListEl.innerHTML = `<div class="state-note">${escapeHtml(t("loading_devices"))}</div>`;
  try {
    const devices = await fetchJson(`${API}/devices?flavor=meowarchmobile`);
    if (!Array.isArray(devices) || devices.length === 0) {
      lastDevices = null;
      stateNote(t("empty_devices"));
      return;
    }
    renderDevices(devices);
  } catch {
    renderDevices(FALLBACK_DEVICES, { offline: true });
  }
}

/* ---- re-render on language switch (no refetch; data stays cached) ---- */

window.addEventListener("meowarch:langchange", () => {
  if (lastDevices) renderDevices(lastDevices, { offline: lastOffline });
  if (lastRelease) renderDetail(lastRelease, { scroll: false });
});

init();
