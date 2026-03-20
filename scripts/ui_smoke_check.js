"use strict";

const fs = require("fs");
const path = require("path");

const uiPath = path.join(__dirname, "..", "ui", "hypersnatch-ui.html");
const html = fs.readFileSync(uiPath, "utf8");

const idMatches = Array.from(html.matchAll(/id="([^"]+)"/g));
const ids = new Set(idMatches.map((m) => m[1]));

const requiredIds = [
  "input",
  "file",
  "mode",
  "btnDecode",
  "btnClear",
  "btnExportCase",
  "btnExportNotes",
  "status",
  "cmd",
  "candidatesTbody",
  "timelineTbody",
  "auditSeal",
  "sealHash",
  "forensicCard",
  "forensicLog",
  "bridgeDot",
  "bridgeText",
  "uiVer",
  "nodeIdText",
  "batchDecodeInput",
  "btnQueueBatch",
  "btnQueueBatchToCase",
  "btnExportBatchReport",
  "intBatchState",
  "intExportReady",
];

const missing = requiredIds.filter((id) => !ids.has(id));
if (missing.length) {
  console.error(`[ui-smoke] Missing critical UI IDs: ${missing.join(", ")}`);
  process.exit(1);
}

const tabCount = (html.match(/class="tab-btn/g) || []).length;
if (tabCount < 6) {
  console.error(`[ui-smoke] Expected at least 6 tabs, found ${tabCount}`);
  process.exit(1);
}

const tabRoleCount = (html.match(/class="tab-btn[^"]*"[^>]*role="tab"/g) || []).length;
if (tabRoleCount < 6) {
  console.error(`[ui-smoke] Expected tab buttons with role=\"tab\", found ${tabRoleCount}`);
  process.exit(1);
}

if (!html.includes('role="tablist"')) {
  console.error("[ui-smoke] Missing tablist role on workspace tab bar.");
  process.exit(1);
}

const tabPanels = Array.from(html.matchAll(/<div id="([^"]+)" class="tab-content[^"]*"[^>]*role="tabpanel"/g)).map((m) => m[1]);
if (tabPanels.length < 6) {
  console.error(`[ui-smoke] Expected at least 6 tab panels with role=\"tabpanel\", found ${tabPanels.length}`);
  process.exit(1);
}

const tabToPanel = Array.from(html.matchAll(/class="tab-btn[^"]*"[^>]*data-tab="([^"]+)"/g)).map((m) => m[1]);
const brokenTabs = tabToPanel.filter((panelId) => !tabPanels.includes(panelId));
if (brokenTabs.length) {
  console.error(`[ui-smoke] Tab buttons reference missing panels: ${brokenTabs.join(", ")}`);
  process.exit(1);
}

if (!html.includes('class="input-dropzone"')) {
  console.error("[ui-smoke] Missing intake shell (.input-dropzone)");
  process.exit(1);
}

if (!html.includes('class="trust-panel"')) {
  console.error("[ui-smoke] Missing trust/proof panel (.trust-panel)");
  process.exit(1);
}

if (!html.includes('class="workstation-layout"')) {
  console.error("[ui-smoke] Missing workstation layout shell.");
  process.exit(1);
}

if (!/\.workstation-layout\s*\{[\s\S]*?height:\s*100vh;/.test(html)) {
  console.error("[ui-smoke] Missing viewport-fill hook on .workstation-layout.");
  process.exit(1);
}

if (!html.includes('role="status"') || !html.includes('aria-live="polite"')) {
  console.error("[ui-smoke] Missing live operator status semantics.");
  process.exit(1);
}

if (!/button:focus-visible[\s\S]*input:focus-visible[\s\S]*textarea:focus-visible[\s\S]*select:focus-visible/.test(html)) {
  console.error("[ui-smoke] Missing focus-visible styles for keyboard navigation.");
  process.exit(1);
}

if (!html.includes('const APP_VERSION_FALLBACK = "1.4.1";')) {
  console.error("[ui-smoke] Stable version fallback is not aligned to 1.4.1.");
  process.exit(1);
}

if (html.includes("Math.random().toString(16)")) {
  console.error("[ui-smoke] Audit seal hash must be deterministic and result-derived, not random.");
  process.exit(1);
}

if (!html.includes("function evaluateDecodeOutcome(")) {
  console.error("[ui-smoke] Missing decode outcome evaluator for truthful status messaging.");
  process.exit(1);
}

if (!html.includes("const outcome = evaluateDecodeOutcome(out);")) {
  console.error("[ui-smoke] Decode flow does not apply evaluated success/warn/error outcome.");
  process.exit(1);
}

if (!html.includes("function setAuditSealFromResult(")) {
  console.error("[ui-smoke] Missing deterministic audit seal update path.");
  process.exit(1);
}

if (html.includes("export_${this.activeCase.id}_")) {
  console.error("[ui-smoke] Case export filename is using activeCase.id instead of case_id.");
  process.exit(1);
}

if (!html.includes("export_${caseId}_")) {
  console.error("[ui-smoke] Case export filename is not anchored to case_id.");
  process.exit(1);
}

if (!html.includes("Notes export failed:")) {
  console.error("[ui-smoke] Notes export failure messaging is missing.");
  process.exit(1);
}

if (!html.includes("Export failed:")) {
  console.error("[ui-smoke] Case export failure messaging is missing.");
  process.exit(1);
}

if (!html.includes("automationQueueAdd(") || !html.includes("automationQueueAction(")) {
  console.error("[ui-smoke] Missing automation queue operator flow hooks.");
  process.exit(1);
}

if (!html.includes("queued/running/paused/warn/failed/canceled lifecycle labels")) {
  console.error("[ui-smoke] Missing explicit batch lifecycle guidance text.");
  process.exit(1);
}

if (!html.includes("function buildBatchReport(")) {
  console.error("[ui-smoke] Missing batch report workflow summary generator.");
  process.exit(1);
}

if (!html.includes("data-case-from-job")) {
  console.error("[ui-smoke] Missing case/workspace bridge action for batch history.");
  process.exit(1);
}

if (!html.includes("caseAddFinding(payload.data.caseId")) {
  console.error("[ui-smoke] Missing batch decode to case finding linkage path.");
  process.exit(1);
}

console.log("[ui-smoke] PASS: core operator UI shell and critical IDs are present.");
