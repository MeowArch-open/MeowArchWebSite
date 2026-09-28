/* Shared renderers for release/build data (home, download, devices pages). */
window.MEOWARCH_RENDER = (() => {
  "use strict";

  const t = (key, params) => window.MEOWARCH_I18N.t(key, params);

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const ICONS = {
    download:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 20h14"></path></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"></path></svg>',
    chip: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"></rect><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"></path></svg>',
  };

  const ARTIFACT_DEFS = [
    { key: "iso", labelKey: "art.iso.name", icon: "download" },
    { key: "torrent", labelKey: "art.torrent.name", icon: "link" },
    { key: "bootImg", labelKey: "art.boot.name", icon: "chip" },
  ];

  function artifactList(release) {
    const artifacts = release?.artifacts || {};
    return ARTIFACT_DEFS.map(({ key, labelKey, icon }) => {
      const artifact = artifacts[key];
      if (!artifact?.url) return "";
      const size = artifact.fileSize ? ` · ${escapeHtml(artifact.fileSize)}` : "";
      return `
        <a class="artifact" href="${escapeHtml(artifact.url)}" target="_blank" rel="noreferrer">
          <span class="a-icon">${ICONS[icon]}</span>
          <span>
            <span class="a-name">${escapeHtml(t(labelKey))}</span><br >
            <span class="a-sub">${escapeHtml(artifact.fileName || key)}${size}</span>
          </span>
          <span class="a-go" aria-hidden="true">→</span>
        </a>`;
    }).join("");
  }

  function checksumBox(release) {
    const iso = release?.artifacts?.iso || {};
    const boot = release?.artifacts?.bootImg || {};
    const file = iso.fileName || boot.fileName;
    const hash = iso.sha256 || boot.sha256;
    if (!file || !hash) return "";
    return `
      <div class="checksum" role="group" aria-label="${escapeHtml(t("art.checksum"))}">
        <div class="c-cmd">$ sha256sum ${escapeHtml(file)}</div>
        <div class="c-hash">${escapeHtml(hash)}  ${escapeHtml(file)}</div>
      </div>`;
  }

  function metaChips(release, { withDevice = true } = {}) {
    const device = release?.device || {};
    const chips = [];
    const push = (labelKey, value) => {
      if (value) chips.push(`<span class="meta-chip">${escapeHtml(t(labelKey))} <b>${escapeHtml(value)}</b></span>`);
    };
    if (withDevice) push("release.flavor", release?.flavor === "meowarch" ? "MeowArch" : "MeowArchMobile");
    push("release.channel", release?.channel);
    push("release.codename", device.codename);
    push("release.arch", device.arch);
    push("release.soc", device.soc);
    return chips.join("");
  }

  function notesChips(release) {
    const notes = release?.notes || {};
    const chips = [];
    if (notes.androidBase) {
      chips.push(`<span class="meta-chip">${escapeHtml(t("release.base"))} <b>${escapeHtml(notes.androidBase)}</b></span>`);
    }
    if (notes.kernelVersion) {
      chips.push(`<span class="meta-chip">${escapeHtml(t("release.kernel"))} <b>${escapeHtml(notes.kernelVersion)}</b></span>`);
    }
    return chips.join("");
  }

  function releaseSummary(release) {
    return `
      <div class="release-grid">
        <div>
          <div class="detail-head">
            <h2><em>${escapeHtml(release.device?.model || release.flavor)}</em></h2>
            <span class="version-pill">✦ <strong>${escapeHtml(release.version || "")}</strong> · ${escapeHtml(release.releaseDate || "")}</span>
          </div>
          <div class="release-meta">${metaChips(release)}</div>
          <div class="release-meta notes-row">${notesChips(release)}</div>
        </div>
        <div>
          <div class="artifact-list">${artifactList(release)}</div>
          ${checksumBox(release)}
        </div>
      </div>`;
  }

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

  return { escapeHtml, artifactList, checksumBox, metaChips, notesChips, releaseSummary, stateNote, ARTIFACT_DEFS };
})();
