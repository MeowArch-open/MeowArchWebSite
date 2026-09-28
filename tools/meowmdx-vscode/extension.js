"use strict";
const vscode = require("vscode");

/* Schema mirrored from scripts/gen-docs.mjs (SECTIONS, ICONS) and
   docs/mdx.js (CALLOUTS + COMPONENTS). Keep in sync if those registries change. */
const REQUIRED = ["title", "description", "section", "order"];
const SECTIONS = ["guide", "quickstart", "develop", "downloads"];
const ICONS = ["code", "download", "help", "device"];
const BOOLEANS = ["landing", "sidebar", "pageActions"];
const OPTIONAL = ["slug", "icon", "apiPanel", "prevHref", "prevTitle", "nextHref", "nextTitle"];
const KNOWN_KEYS = new Set([...REQUIRED, ...BOOLEANS, ...OPTIONAL]);
const DIRECTIVES = new Set(["tip", "note", "warning", "danger", "info", "tabs", "card", "cards", "steps", "details", "api-latest"]);

function lineRange(doc, line, from, to) {
  return new vscode.Range(line, from, line, to);
}

function validate(doc) {
  const diags = [];
  const lines = doc.getText().split(/\r?\n/);

  // ---- frontmatter ----
  const fm = {};
  let fmEnd = -1;
  if (/^---\s*$/.test(lines[0] || "")) {
    for (let i = 1; i < lines.length; i += 1) {
      if (/^---\s*$/.test(lines[i])) { fmEnd = i; break; }
      const idx = lines[i].indexOf(":");
      if (idx <= 0) continue;
      const key = lines[i].slice(0, idx).trim();
      const col = lines[i].indexOf(key);
      fm[key] = { line: i, val: lines[i].slice(idx + 1).trim(), col, end: col + key.length };
    }
  }

  if (fmEnd === -1) {
    diags.push(new vscode.Diagnostic(lineRange(doc, 0, 0, (lines[0] || "").length),
      "缺少 frontmatter（文件应以 --- 键值块起始）。", vscode.DiagnosticSeverity.Warning));
  }
  // required keys
  const anchor = fmEnd >= 0 ? fmEnd : 0;
  for (const key of REQUIRED) {
    if (!(key in fm)) {
      diags.push(new vscode.Diagnostic(lineRange(doc, anchor, 0, 3),
        `frontmatter 缺少必填字段 "${key}"。`, vscode.DiagnosticSeverity.Error));
    }
  }
  // section value
  if (fm.section && !SECTIONS.includes(fm.section.val)) {
    diags.push(new vscode.Diagnostic(lineRange(doc, fm.section.line, 0, lines[fm.section.line].length),
      `未知 section "${fm.section.val}"。已注册：${SECTIONS.join(", ")}（新增分区要改 gen-docs.mjs 的 SECTIONS）。`,
      vscode.DiagnosticSeverity.Error));
  }
  // icon value
  if (fm.icon && !ICONS.includes(fm.icon.val)) {
    diags.push(new vscode.Diagnostic(lineRange(doc, fm.icon.line, 0, lines[fm.icon.line].length),
      `未知 icon "${fm.icon.val}"。已注册：${ICONS.join(", ")}（新增图标要改 gen-docs.mjs 的 ICONS）。`,
      vscode.DiagnosticSeverity.Warning));
  }
  // order must be an integer
  if (fm.order && !/^-?\d+$/.test(fm.order.val)) {
    diags.push(new vscode.Diagnostic(lineRange(doc, fm.order.line, 0, lines[fm.order.line].length),
      `order 应为整数，收到 "${fm.order.val}"。`, vscode.DiagnosticSeverity.Warning));
  }
  // booleans
  for (const key of BOOLEANS) {
    if (fm[key] && !/^(true|false)$/.test(fm[key].val)) {
      diags.push(new vscode.Diagnostic(lineRange(doc, fm[key].line, 0, lines[fm[key].line].length),
        `${key} 应为 true 或 false，收到 "${fm[key].val}"。`, vscode.DiagnosticSeverity.Warning));
    }
  }
  // apiPanel: true (顶部烘焙面板) | inline (脚本就绪，正文用 :::api-latest 放置) | false
  if (fm.apiPanel && !/^(true|false|inline)$/.test(fm.apiPanel.val)) {
    diags.push(new vscode.Diagnostic(lineRange(doc, fm.apiPanel.line, 0, lines[fm.apiPanel.line].length),
      `apiPanel 应为 true、false 或 inline，收到 "${fm.apiPanel.val}"。`, vscode.DiagnosticSeverity.Warning));
  }
  // unknown keys (generator silently ignores them)
  for (const key of Object.keys(fm)) {
    if (!KNOWN_KEYS.has(key)) {
      diags.push(new vscode.Diagnostic(lineRange(doc, fm[key].line, fm[key].col, fm[key].end),
        `未知 frontmatter 字段 "${key}"（生成器会忽略它）。`, vscode.DiagnosticSeverity.Information));
    }
  }
  // ---- directives ----
  for (let i = fmEnd + 1; i < lines.length; i += 1) {
    const m = /^:::([A-Za-z][A-Za-z0-9-]*)/.exec(lines[i]);
    if (m && !DIRECTIVES.has(m[1].toLowerCase())) {
      diags.push(new vscode.Diagnostic(lineRange(doc, i, 3, 3 + m[1].length),
        `未知指令 ":::${m[1]}"，渲染器会回退成 note 提示框。已知：${[...DIRECTIVES].join(", ")}。`,
        vscode.DiagnosticSeverity.Warning));
    }
  }
  return diags;
}

let collection;

function refresh(doc) {
  if (!doc || doc.languageId !== "meowmdx") return;
  if (!vscode.workspace.getConfiguration("meowmdx").get("validate.enable", true)) {
    collection.delete(doc.uri);
    return;
  }
  collection.set(doc.uri, validate(doc));
}

function activate(context) {
  collection = vscode.languages.createDiagnosticCollection("meowmdx");
  context.subscriptions.push(
    collection,
    vscode.workspace.onDidOpenTextDocument(refresh),
    vscode.workspace.onDidChangeTextDocument((e) => refresh(e.document)),
    vscode.workspace.onDidCloseTextDocument((d) => collection.delete(d.uri)),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("meowmdx.validate.enable")) {
        vscode.workspace.textDocuments.forEach(refresh);
      }
    }),
  );
  vscode.workspace.textDocuments.forEach(refresh);
}

function deactivate() {}

module.exports = { activate, deactivate };
