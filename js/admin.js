/* Admin page — Bearer-token gate, device CRUD and release publishing
   against the MeowArch Release API. The token lives in sessionStorage only. */
(() => {
  "use strict";

  const t = (key, params) => window.MEOWARCH_I18N.t(key, params);
  const { escapeHtml, stateNote } = window.MEOWARCH_RENDER;

  const TOKEN_KEY = "meowarch_admin_token";

  const authPanel = document.querySelector("#auth-panel");
  const authError = document.querySelector("#auth-error");
  const manager = document.querySelector("#manager");
  const listEl = document.querySelector("#device-list");
  const deviceEditor = document.querySelector("#device-editor");
  const deviceEditorTitle = document.querySelector("#device-editor-title");
  const deviceForm = document.querySelector("#device-form");
  const releaseManager = document.querySelector("#release-manager");
  const releaseTitle = document.querySelector("#release-title");
  const releaseEditorEl = document.querySelector("#release-editor");
  const statusLine = document.querySelector("#status-line");

  let devices = [];
  let editingDevice = null;
  let releaseDevice = null;
  let lastRelease; // undefined = not loaded, null = 404, object = loaded
  let releaseFormVisible = false;
  let statusTimer = null;

  const getToken = () => sessionStorage.getItem(TOKEN_KEY) || "";
  const setToken = (value) => sessionStorage.setItem(TOKEN_KEY, value);
  const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

  async function api(path, options = {}) {
    try {
      return await window.MEOWARCH_API.request(path, { ...options, token: getToken() });
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        signOut(t("ad.token_invalid"));
      }
      throw err;
    }
  }

  /* ---- status toast ---- */
  function showStatus(message, { variant = "" } = {}) {
    statusLine.textContent = message;
    statusLine.className = `status-line is-visible${variant ? ` is-${variant}` : ""}`;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => statusLine.classList.remove("is-visible"), 3800);
  }

  /* ---- auth ---- */
  /* The token can only be verified against an /admin route (auth middleware
     runs before validation): invalid → 401, valid → 400 for the empty body. */
  async function verifyToken() {
    try {
      await api("/admin/releases", { method: "POST", body: {} });
      return true;
    } catch (err) {
      if (err.status === 401) return false; // api() already signed out
      if (err.status === 0) throw err; // network/API unreachable
      return true; // 400/500 = authenticated, empty body rejected later
    }
  }

  function signOut(message) {
    clearToken();
    releaseManager.hidden = true;
    deviceEditor.hidden = true;
    releaseDevice = null;
    lastRelease = undefined;
    releaseFormVisible = false;
    manager.hidden = true;
    authPanel.hidden = false;
    authError.hidden = !message;
    authError.textContent = message || "";
  }

  document.querySelector("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#token-input");
    setToken(input.value.trim());
    input.value = "";
    try {
      if (!(await verifyToken())) return;
      await loadDevices();
      authPanel.hidden = true;
      authError.hidden = true;
      manager.hidden = false;
    } catch (err) {
      if (err.status !== 401) {
        signOut(t("ad.api_unreachable", { msg: err.message }));
      }
    }
  });

  document.querySelector("#signout-btn").addEventListener("click", () => signOut(t("ad.signed_out")));

  /* ---- devices ---- */
  async function loadDevices() {
    listEl.innerHTML = "";
    listEl.appendChild(stateNote(t("ad.loading_devices")));
    devices = await api("/devices?flavor=meowarchmobile");
    if (!Array.isArray(devices)) devices = [];
    renderDeviceList();
  }

  function renderDeviceList() {
    listEl.innerHTML = "";
    if (!devices.length) {
      listEl.appendChild(stateNote(t("ad.empty_devices")));
      return;
    }
    devices.forEach((device) => listEl.appendChild(deviceRow(device)));
  }

  function deviceRow(device) {
    const status = device.status || "community";
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="r-main">
        <span class="r-title">
          ${escapeHtml(device.model)}
          <span class="badge is-${escapeHtml(status)}">${escapeHtml(t(`status.${status}`))}</span>
        </span>
        <span class="r-sub">${escapeHtml(device.brand)} · ${escapeHtml(device.codename)}${device.soc ? ` · ${escapeHtml(device.soc)}` : ""}</span>
      </div>
      <div class="r-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-act="release">${escapeHtml(t("ad.release_btn"))}</button>
        <button type="button" class="btn btn-ghost btn-sm" data-act="edit">${escapeHtml(t("ad.edit_btn"))}</button>
        <button type="button" class="btn btn-danger btn-sm" data-act="delete">${escapeHtml(t("ad.delete_btn"))}</button>
      </div>
    `;
    row.querySelector('[data-act="release"]').addEventListener("click", () => openReleaseEditor(device));
    row.querySelector('[data-act="edit"]').addEventListener("click", () => openDeviceEditor(device));
    row.querySelector('[data-act="delete"]').addEventListener("click", () => deleteDevice(device));
    return row;
  }

  function openDeviceEditor(device = null) {
    editingDevice = device;
    deviceEditor.hidden = false;
    deviceEditorTitle.textContent = device
      ? t("ad.device_editor_edit", { model: device.model })
      : t("ad.device_editor_add");
    document.querySelector("#device-flavor").value = device?.flavor || "meowarchmobile";
    document.querySelector("#device-status").value = device?.status || "community";
    document.querySelector("#device-brand").value = device?.brand || "";
    document.querySelector("#device-model").value = device?.model || "";
    const codenameInput = document.querySelector("#device-codename");
    codenameInput.value = device?.codename || "";
    codenameInput.disabled = Boolean(device);
    document.querySelector("#device-soc").value = device?.soc || "";
    deviceEditor.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.querySelector("#add-device-btn").addEventListener("click", () => openDeviceEditor());
  document.querySelector("#device-cancel-btn").addEventListener("click", () => {
    deviceEditor.hidden = true;
    editingDevice = null;
  });

  deviceForm.addEventListener("submit", async (event) => {
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
      await api("/admin/devices", { method: "POST", body });
      deviceEditor.hidden = true;
      editingDevice = null;
      await loadDevices();
      showStatus(t("ad.saved_device", { model: body.model }));
    } catch (err) {
      if (err.status !== 401) showStatus(t("ad.save_failed", { msg: err.message }), { variant: "warning" });
    }
  });

  async function deleteDevice(device) {
    if (!window.confirm(t("ad.delete_confirm", { model: device.model, codename: device.codename }))) return;
    try {
      await api(`/admin/devices?flavor=meowarchmobile&codename=${encodeURIComponent(device.codename)}`, {
        method: "DELETE",
      });
      if (releaseDevice?.codename === device.codename) {
        releaseManager.hidden = true;
        releaseDevice = null;
        lastRelease = undefined;
        releaseFormVisible = false;
      }
      await loadDevices();
      showStatus(t("ad.deleted", { model: device.model }));
    } catch (err) {
      if (err.status !== 401) showStatus(t("ad.delete_failed", { msg: err.message }), { variant: "warning" });
    }
  }

  /* ---- release editor ---- */
  function openReleaseEditor(device) {
    releaseDevice = device;
    lastRelease = undefined;
    releaseFormVisible = false;
    releaseManager.hidden = false;
    releaseTitle.textContent = t("ad.release_title", { model: device.model });
    releaseEditorEl.innerHTML = "";
    releaseEditorEl.appendChild(stateNote(t("ad.loading_release")));
    releaseManager.scrollIntoView({ behavior: "smooth", block: "start" });
    loadRelease(device);
  }

  async function loadRelease(device) {
    try {
      lastRelease = await api(`/releases/latest?flavor=meowarchmobile&codename=${encodeURIComponent(device.codename)}`);
    } catch (err) {
      if (err.status === 401) return;
      lastRelease = err.status === 404 ? null : undefined;
      if (lastRelease === undefined) {
        releaseEditorEl.innerHTML = "";
        releaseEditorEl.appendChild(stateNote(t("dev.load_failed"), { variant: "error" }));
        return;
      }
    }
    renderReleaseForm(device, lastRelease);
  }

  function field(id, labelKey, { value = "", placeholderKey = "", type = "text", required = false, span2 = false } = {}) {
    const ph = placeholderKey ? `placeholder="${escapeHtml(t(placeholderKey))}"` : "";
    return `
      <div class="field${span2 ? " span-2" : ""}">
        <label for="${id}">${escapeHtml(t(labelKey))}</label>
        <input id="${id}" type="${type}" value="${escapeHtml(value)}" ${ph} ${required ? "required" : ""} >
      </div>`;
  }

  function renderReleaseForm(device, release) {
    const iso = release?.artifacts?.iso || {};
    const torrent = release?.artifacts?.torrent || {};
    const bootImg = release?.artifacts?.bootImg || {};
    const notes = release?.notes || {};

    const section = (key) => `<h4 class="admin-subhead">${escapeHtml(t(key))}</h4>`;

    releaseEditorEl.innerHTML = `
      <form id="release-form">
        <div class="field-grid">
          ${field("rel-version", "ad.version", { value: release?.version || "", placeholderKey: "ad.ph.version", required: true })}
          ${field("rel-date", "ad.release_date", { value: release?.releaseDate || "", placeholderKey: "ad.ph.date" })}
          ${field("rel-channel", "ad.channel", { value: release?.channel || "stable", placeholderKey: "ad.ph.channel" })}
          <div class="field" style="justify-content: flex-end">
            <label class="check-label" for="rel-latest">
              <input id="rel-latest" type="checkbox" ${release?.isLatest === false ? "" : "checked"} >
              ${escapeHtml(t("ad.mark_latest"))}
            </label>
          </div>
        </div>

        ${section("ad.iso_section")}
        <div class="field-grid">
          ${field("iso-url", "ad.url", { value: iso.url || "", placeholderKey: "ad.ph.url", span2: true })}
          ${field("iso-file", "ad.file_name", { value: iso.fileName || "", placeholderKey: "ad.ph.file" })}
          ${field("iso-size", "ad.size", { value: iso.fileSize || "", placeholderKey: "ad.ph.size" })}
          ${field("iso-sha", "ad.sha256", { value: iso.sha256 || "", placeholderKey: "ad.ph.sha", span2: true })}
        </div>

        ${section("ad.torrent_section")}
        <div class="field-grid">
          ${field("torrent-url", "ad.url", { value: torrent.url || "", placeholderKey: "ad.ph.url", span2: true })}
          ${field("torrent-file", "ad.file_name", { value: torrent.fileName || "", placeholderKey: "ad.ph.file", span2: true })}
        </div>

        ${section("ad.boot_section")}
        <div class="field-grid">
          ${field("boot-url", "ad.url", { value: bootImg.url || "", placeholderKey: "ad.ph.url", span2: true })}
          ${field("boot-file", "ad.file_name", { value: bootImg.fileName || "", placeholderKey: "ad.ph.file", span2: true })}
          ${field("boot-sha", "ad.sha256", { value: bootImg.sha256 || "", placeholderKey: "ad.ph.sha", span2: true })}
        </div>

        ${section("ad.notes_section")}
        <div class="field-grid">
          ${field("note-android", "ad.android_base", { value: notes.androidBase || "", placeholderKey: "ad.ph.android" })}
          ${field("note-kernel", "ad.kernel", { value: notes.kernelVersion || "", placeholderKey: "ad.ph.kernel" })}
        </div>

        <div class="admin-actions">
          <button class="btn btn-primary" type="submit">${escapeHtml(release ? t("ad.save_release") : t("ad.publish"))}</button>
        </div>
        <p class="admin-hint">${
          release
            ? escapeHtml(t("ad.showing_version", { version: release.version || "" }))
            : escapeHtml(t("ad.no_release_yet"))
        }</p>
      </form>
    `;
    releaseFormVisible = true;
    document.querySelector("#release-form").addEventListener("submit", submitRelease);
  }

  async function submitRelease(event) {
    event.preventDefault();
    const val = (id) => document.querySelector(`#${id}`).value.trim();

    const body = {
      flavor: "meowarchmobile",
      version: val("rel-version"),
      releaseDate: val("rel-date") || null,
      channel: val("rel-channel") || "stable",
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
          url: val("iso-url"),
          fileName: val("iso-file"),
          fileSize: val("iso-size"),
          sha256: val("iso-sha"),
        },
        torrent: { url: val("torrent-url"), fileName: val("torrent-file") },
        bootImg: { url: val("boot-url"), fileName: val("boot-file"), sha256: val("boot-sha") },
      },
      notes: {
        androidBase: val("note-android") || null,
        kernelVersion: val("note-kernel") || null,
      },
    };

    /* Drop empty artifact fields; the backend tolerates them but keep it clean. */
    for (const key of Object.keys(body.artifacts)) {
      const artifact = body.artifacts[key];
      for (const fieldKey of Object.keys(artifact)) {
        if (artifact[fieldKey] === "") delete artifact[fieldKey];
      }
      if (!Object.keys(artifact).length) delete body.artifacts[key];
    }
    for (const key of Object.keys(body.notes)) {
      if (body.notes[key] === null) delete body.notes[key];
    }

    try {
      await api("/admin/releases", { method: "POST", body });
      lastRelease = undefined;
      releaseFormVisible = false;
      releaseEditorEl.innerHTML = "";
      releaseEditorEl.appendChild(
        stateNote(t("ad.saved_release", { version: body.version, model: releaseDevice.model }), {
          variant: "ok",
        }),
      );
      showStatus(t("ad.saved_release", { version: body.version, model: releaseDevice.model }));
    } catch (err) {
      if (err.status === 401) return;
      releaseEditorEl.innerHTML = "";
      releaseEditorEl.appendChild(stateNote(t("ad.save_failed", { msg: err.message }), { variant: "error" }));
    }
  }

  document.querySelector("#close-release-btn").addEventListener("click", () => {
    releaseManager.hidden = true;
    releaseDevice = null;
    lastRelease = undefined;
    releaseFormVisible = false;
  });

  /* ---- re-render on language switch (no refetch) ---- */
  window.addEventListener("meowarch:langchange", () => {
    if (manager.hidden) return;
    renderDeviceList();
    if (editingDevice) {
      deviceEditorTitle.textContent = t("ad.device_editor_edit", { model: editingDevice.model });
    } else {
      deviceEditorTitle.textContent = t("ad.device_editor_add");
    }
    if (!releaseManager.hidden && releaseDevice) {
      releaseTitle.textContent = t("ad.release_title", { model: releaseDevice.model });
      if (releaseFormVisible) renderReleaseForm(releaseDevice, lastRelease);
    }
  });

  /* ---- init ---- */
  (async () => {
    if (!getToken()) return;
    try {
      if (!(await verifyToken())) return;
      await loadDevices();
      authPanel.hidden = true;
      manager.hidden = false;
    } catch (err) {
      if (err.status !== 401) {
        signOut(t("ad.api_unreachable", { msg: err.message }));
      }
    }
  })();
})();
