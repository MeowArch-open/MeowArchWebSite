/* MeowArch data management — powered by the MeowArch Release API. */
const API = window.MEOWARCH_API_BASE || "http://127.0.0.1:3000/api/v1";
const REQUEST_TIMEOUT_MS = 8000;
const TOKEN_KEY = "meowarch_admin_token";

const authPanel = document.querySelector("#auth-panel");
const manager = document.querySelector("#manager");
const releaseManager = document.querySelector("#release-manager");
const deviceListEl = document.querySelector("#device-list");
const adminStatusEl = document.querySelector("#admin-status");
const deviceEditor = document.querySelector("#device-editor");
const releaseEditorEl = document.querySelector("#release-editor");

let currentDevices = [];
let editingDevice = null; // device being edited, or null when creating
let releaseDevice = null; // device whose release editor is open

/* ---- token (session-scoped only) ---- */

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}
function setToken(value) {
  sessionStorage.setItem(TOKEN_KEY, value);
}
function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

/* ---- helpers ---- */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function fetchJson(url, { method = "GET", body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers = { Authorization: `Bearer ${getToken()}` };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearToken();
      showAuthPanel("Token expired or invalid — please sign in again.");
      throw new Error("unauthorized");
    }
    if (!res.ok) {
      const error = new Error(
        payload.message || `Request failed (${res.status})`,
      );
      error.status = res.status;
      throw error;
    }
    return payload.data;
  } finally {
    clearTimeout(timer);
  }
}

function showStatus(message, { warning = false } = {}) {
  adminStatusEl.hidden = false;
  adminStatusEl.textContent = message;
  adminStatusEl.classList.toggle("is-warning", warning);
}
function hideStatus() {
  adminStatusEl.hidden = true;
}

/* ---- auth panel ---- */

function showAuthPanel(message) {
  authPanel.hidden = false;
  manager.hidden = true;
  releaseManager.hidden = true;
  releaseDevice = null;
  const errEl = document.querySelector("#auth-error");
  errEl.textContent = message || "";
  errEl.hidden = !message;
}

document
  .querySelector("#auth-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#token-input");
    setToken(input.value.trim());
    input.value = "";
    try {
      await loadDevices(); // verifies the token
      authPanel.hidden = true;
      manager.hidden = false;
    } catch (err) {
      if (err.message !== "unauthorized") {
        showAuthPanel(`Couldn't reach the API: ${err.message}`);
      }
    }
  });

/* ---- devices ---- */

function deviceRow(device) {
  const row = document.createElement("div");
  row.className = "admin-row";
  row.innerHTML = `
    <div class="admin-row-main">
      <span class="device-badge is-${escapeHtml(device.status || "community")}">${escapeHtml(device.status || "community")}</span>
      <strong>${escapeHtml(device.model)}</strong>
      <span class="admin-row-sub">${escapeHtml(device.brand)} · ${escapeHtml(device.codename)}${device.soc ? ` · ${escapeHtml(device.soc)}` : ""}</span>
    </div>
    <div class="admin-row-actions">
      <button type="button" class="button button-secondary admin-btn" data-act="release">Release</button>
      <button type="button" class="button button-secondary admin-btn" data-act="edit">Edit</button>
      <button type="button" class="button button-danger admin-btn" data-act="delete">Delete</button>
    </div>`;
  row
    .querySelector('[data-act="release"]')
    .addEventListener("click", () => openReleaseEditor(device));
  row
    .querySelector('[data-act="edit"]')
    .addEventListener("click", () => openDeviceEditor(device));
  row
    .querySelector('[data-act="delete"]')
    .addEventListener("click", () => deleteDevice(device));
  return row;
}

function renderDeviceList() {
  deviceListEl.innerHTML = "";
  if (currentDevices.length === 0) {
    deviceListEl.innerHTML =
      '<div class="state-note">No devices yet. Add one to get started.</div>';
    return;
  }
  currentDevices.forEach((device) =>
    deviceListEl.appendChild(deviceRow(device)),
  );
}

async function loadDevices() {
  hideStatus();
  deviceListEl.innerHTML = '<div class="state-note">Loading devices…</div>';
  currentDevices = await fetchJson(`${API}/devices?flavor=meowarchmobile`);
  renderDeviceList();
}

function openDeviceEditor(device = null) {
  editingDevice = device;
  deviceEditor.hidden = false;
  document.querySelector("#device-editor-title").textContent = device
    ? `Edit ${device.model}`
    : "Add device";
  document.querySelector("#device-flavor").value =
    device?.flavor || "meowarchmobile";
  document.querySelector("#device-brand").value = device?.brand || "";
  document.querySelector("#device-model").value = device?.model || "";
  document.querySelector("#device-codename").value = device?.codename || "";
  document.querySelector("#device-codename").disabled = Boolean(device);
  document.querySelector("#device-soc").value = device?.soc || "";
  document.querySelector("#device-status").value =
    device?.status || "community";
  deviceEditor.scrollIntoView({ behavior: "smooth", block: "start" });
}

document
  .querySelector("#add-device-btn")
  .addEventListener("click", () => openDeviceEditor());

document.querySelector("#device-cancel-btn").addEventListener("click", () => {
  deviceEditor.hidden = true;
  editingDevice = null;
});

document
  .querySelector("#device-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = {
      flavor: document.querySelector("#device-flavor").value,
      brand: document.querySelector("#device-brand").value.trim(),
      model: document.querySelector("#device-model").value.trim(),
      codename: document.querySelector("#device-codename").value.trim(),
      soc: document.querySelector("#device-soc").value.trim(),
      status: document.querySelector("#device-status").value,
    };
    try {
      await fetchJson(`${API}/admin/devices`, { method: "POST", body });
      deviceEditor.hidden = true;
      editingDevice = null;
      await loadDevices();
      showStatus(`Saved ${body.model}.`);
    } catch (err) {
      if (err.message !== "unauthorized") {
        showStatus(`Save failed: ${err.message}`, { warning: true });
      }
    }
  });

async function deleteDevice(device) {
  if (
    !window.confirm(
      `Delete ${device.model} (${device.codename})? Its release records are kept.`,
    )
  ) {
    return;
  }
  try {
    await fetchJson(
      `${API}/admin/devices?flavor=meowarchmobile&codename=${encodeURIComponent(device.codename)}`,
      { method: "DELETE" },
    );
    if (releaseDevice?.codename === device.codename) {
      releaseDevice = null;
      releaseManager.hidden = true;
    }
    await loadDevices();
    showStatus(`Deleted ${device.model}.`);
  } catch (err) {
    if (err.message !== "unauthorized") {
      showStatus(`Delete failed: ${err.message}`, { warning: true });
    }
  }
}

/* ---- release editor ---- */

function openReleaseEditor(device) {
  releaseDevice = device;
  releaseManager.hidden = false;
  document.querySelector("#release-title").textContent =
    `Release info — ${device.model}`;
  releaseEditorEl.innerHTML =
    '<div class="state-note">Loading release info…</div>';
  releaseManager.scrollIntoView({ behavior: "smooth", block: "start" });
  loadRelease(device);
}

async function loadRelease(device) {
  try {
    const release = await fetchJson(
      `${API}/releases/latest?flavor=meowarchmobile&codename=${encodeURIComponent(device.codename)}`,
    );
    renderReleaseForm(device, release);
  } catch (err) {
    if (err.message === "unauthorized") return;
    if (err.status === 404) {
      renderReleaseForm(device, null);
    } else {
      releaseEditorEl.innerHTML = `<div class="state-note is-warning">Couldn't load release info: ${escapeHtml(err.message)}</div>`;
    }
  }
}

function renderReleaseForm(device, release) {
  const iso = release?.artifacts?.iso || {};
  const torrent = release?.artifacts?.torrent || {};
  const bootImg = release?.artifacts?.bootImg || {};
  const notes = release?.notes || {};
  releaseEditorEl.innerHTML = `
    <form id="release-form" class="admin-form">
      <div class="field-grid">
        <div class="field">
          <label for="rel-version">Version *</label>
          <input id="rel-version" type="text" placeholder="v1.1.0" value="${escapeHtml(release?.version || "")}" required>
        </div>
        <div class="field">
          <label for="rel-date">Release date</label>
          <input id="rel-date" type="text" placeholder="September 2026" value="${escapeHtml(release?.releaseDate || "")}">
        </div>
        <div class="field">
          <label for="rel-channel">Channel</label>
          <input id="rel-channel" type="text" placeholder="stable" value="${escapeHtml(release?.channel || "stable")}">
        </div>
        <div class="field check">
          <label class="check-label" for="rel-latest">
            <input id="rel-latest" type="checkbox" ${release?.isLatest ? "checked" : ""}>
            Mark as latest
          </label>
        </div>
      </div>

      <h4 class="admin-subheading">ISO</h4>
      <div class="field-grid">
        <div class="field">
          <label for="iso-url">URL</label>
          <input id="iso-url" type="text" placeholder="https://…" value="${escapeHtml(iso.url || "")}">
        </div>
        <div class="field">
          <label for="iso-file">File name</label>
          <input id="iso-file" type="text" value="${escapeHtml(iso.fileName || "")}">
        </div>
        <div class="field">
          <label for="iso-size">Size</label>
          <input id="iso-size" type="text" placeholder="~850 MB" value="${escapeHtml(iso.fileSize || "")}">
        </div>
        <div class="field">
          <label for="iso-sha">SHA256</label>
          <input id="iso-sha" type="text" pattern="[0-9a-fA-F]{64}" placeholder="64 hex characters" value="${escapeHtml(iso.sha256 || "")}">
        </div>
      </div>

      <h4 class="admin-subheading">Torrent</h4>
      <div class="field-grid">
        <div class="field">
          <label for="torrent-url">URL</label>
          <input id="torrent-url" type="text" placeholder="https://…" value="${escapeHtml(torrent.url || "")}">
        </div>
        <div class="field">
          <label for="torrent-file">File name</label>
          <input id="torrent-file" type="text" value="${escapeHtml(torrent.fileName || "")}">
        </div>
      </div>

      <h4 class="admin-subheading">Boot image</h4>
      <div class="field-grid">
        <div class="field">
          <label for="boot-url">URL</label>
          <input id="boot-url" type="text" placeholder="https://…" value="${escapeHtml(bootImg.url || "")}">
        </div>
        <div class="field">
          <label for="boot-file">File name</label>
          <input id="boot-file" type="text" value="${escapeHtml(bootImg.fileName || "")}">
        </div>
        <div class="field">
          <label for="boot-sha">SHA256</label>
          <input id="boot-sha" type="text" pattern="[0-9a-fA-F]{64}" placeholder="64 hex characters" value="${escapeHtml(bootImg.sha256 || "")}">
        </div>
      </div>

      <h4 class="admin-subheading">Notes</h4>
      <div class="field-grid">
        <div class="field">
          <label for="note-android">Android base</label>
          <input id="note-android" type="text" placeholder="HyperOS 2" value="${escapeHtml(notes.androidBase || "")}">
        </div>
        <div class="field">
          <label for="note-kernel">Kernel</label>
          <input id="note-kernel" type="text" placeholder="Linux 6.6.x" value="${escapeHtml(notes.kernelVersion || "")}">
        </div>
      </div>

      <div class="admin-actions">
        <button class="button button-primary" type="submit">${release ? "Save release" : "Publish release"}</button>
      </div>
      <p class="admin-hint">${
        release
          ? `Currently showing ${escapeHtml(release.version)} — saving upserts by flavor + codename + version.`
          : "This device has no release yet — publish the first one."
      }</p>
    </form>`;
  document
    .querySelector("#release-form")
    .addEventListener("submit", submitRelease);
}

async function submitRelease(event) {
  event.preventDefault();
  const val = (id) => document.querySelector(id).value.trim();
  const body = {
    flavor: "meowarchmobile",
    version: val("#rel-version"),
    releaseDate: val("#rel-date") || null,
    channel: val("#rel-channel") || "stable",
    isLatest: document.querySelector("#rel-latest").checked,
    device: {
      brand: releaseDevice.brand,
      model: releaseDevice.model,
      codename: releaseDevice.codename,
      soc: releaseDevice.soc || "",
      arch: "aarch64",
      status: releaseDevice.status || "community",
    },
    artifacts: {
      iso: {
        url: val("#iso-url"),
        fileName: val("#iso-file"),
        fileSize: val("#iso-size"),
        sha256: val("#iso-sha"),
      },
      torrent: { url: val("#torrent-url"), fileName: val("#torrent-file") },
      bootImg: {
        url: val("#boot-url"),
        fileName: val("#boot-file"),
        sha256: val("#boot-sha"),
      },
    },
    notes: {
      androidBase: val("#note-android") || null,
      kernelVersion: val("#note-kernel") || null,
    },
  };
  // Drop empty artifact fields (backend also tolerates them, but keep it clean).
  for (const type of ["iso", "torrent", "bootImg"]) {
    const artifact = body.artifacts[type];
    for (const key of Object.keys(artifact)) {
      if (artifact[key] === "" || artifact[key] === null) delete artifact[key];
    }
    if (Object.keys(artifact).length === 0) delete body.artifacts[type];
  }
  for (const key of Object.keys(body.notes)) {
    if (body.notes[key] === null) delete body.notes[key];
  }
  try {
    await fetchJson(`${API}/admin/releases`, { method: "POST", body });
    releaseEditorEl.innerHTML = `<div class="state-note">Saved ${escapeHtml(body.version)} for ${escapeHtml(releaseDevice.model)}. ✓</div>`;
    showStatus(`Saved ${body.version} for ${releaseDevice.model}.`);
  } catch (err) {
    if (err.message !== "unauthorized") {
      releaseEditorEl.innerHTML = `<div class="state-note is-warning">Save failed: ${escapeHtml(err.message)}</div>`;
    }
  }
}

document.querySelector("#close-release-btn").addEventListener("click", () => {
  releaseManager.hidden = true;
  releaseDevice = null;
});

/* ---- sign out + init ---- */

document.querySelector("#signout-btn").addEventListener("click", () => {
  clearToken();
  showAuthPanel("Signed out.");
});

async function init() {
  if (getToken()) {
    try {
      await loadDevices();
      authPanel.hidden = true;
      manager.hidden = false;
    } catch (err) {
      if (err.message !== "unauthorized") {
        showAuthPanel(`Couldn't reach the API: ${err.message}`);
      }
    }
  }
}

init();
