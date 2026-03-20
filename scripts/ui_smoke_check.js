"use strict";

const fs = require("fs");
const path = require("path");

const uiPath = path.join(__dirname, "..", "ui", "hypersnatch-ui.html");
const html = fs.readFileSync(uiPath, "utf8");
const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

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
  "caseWorkspacePanel",
  "caseWorkspaceState",
  "caseLinkedJobsList",
  "caseLineageSummary",
  "caseTimelineList",
  "btnCaseWorkspaceQueue",
  "btnCaseWorkspaceReport",
  "btnCaseWorkspaceReportExport",
  "btnCaseWorkspaceExport",
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

const fallbackVersionMatch = html.match(/const APP_VERSION_FALLBACK = "([^"]+)";/);
const fallbackVersion = fallbackVersionMatch ? fallbackVersionMatch[1] : null;
if (!fallbackVersion || fallbackVersion !== pkg.version) {
  console.error(`[ui-smoke] UI fallback version (${fallbackVersion || "missing"}) is not aligned to package.json version (${pkg.version}).`);
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

const requiredQueueActions = ["pause", "resume", "manual-review", "cancel", "requeue"];
const missingQueueActions = requiredQueueActions.filter((action) => !html.includes(`data-queue-action="${action}"`));
if (missingQueueActions.length) {
  console.error(`[ui-smoke] Missing queue action controls: ${missingQueueActions.join(", ")}`);
  process.exit(1);
}

if (!/function statusBadgeClass\(status\)[\s\S]*status === "running"[\s\S]*status === "completed"[\s\S]*status === "warning"[\s\S]*status === "manual-review"[\s\S]*status === "failed"/.test(html)) {
  console.error("[ui-smoke] Queue status badge mapping is missing required running/warning/manual-review/failed semantics.");
  process.exit(1);
}

if (!/function isReopenableStatus\(status\)[\s\S]*status === "completed"[\s\S]*status === "warning"[\s\S]*status === "failed"[\s\S]*status === "canceled"/.test(html)) {
  console.error("[ui-smoke] Reopenability contract for completed/warning/failed/canceled statuses is missing.");
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

if (!html.includes("manualReviewReason") || !html.includes("failureReason") || !html.includes("durationMs")) {
  console.error("[ui-smoke] Missing queue observability reason/timing hooks.");
  process.exit(1);
}

if (!html.includes("data-queue-action=\"manual-review\"")) {
  console.error("[ui-smoke] Missing manual-review queue action control.");
  process.exit(1);
}

if (!html.includes("function buildJobObservability(") || !html.includes("last action:")) {
  console.error("[ui-smoke] Missing job observability formatter hooks.");
  process.exit(1);
}

if (!html.includes("renderWorkspaceDepth(") || !html.includes("getLinkedCaseJobs(")) {
  console.error("[ui-smoke] Missing case workspace depth rendering hooks.");
  process.exit(1);
}

if (!html.includes("data-case-job-open") || !html.includes("data-case-job-reopen")) {
  console.error("[ui-smoke] Missing case-linked job open/reopen controls.");
  process.exit(1);
}

if (!html.includes("openCaseReportFromContext(") || !html.includes("buildCaseWorkspaceReport(")) {
  console.error("[ui-smoke] Missing case-context report generation/navigation path.");
  process.exit(1);
}

if (!html.includes("function buildJobTimelineEvents(") || !html.includes("function buildCaseTimelineEvents(")) {
  console.error("[ui-smoke] Missing evidence timeline generation hooks.");
  process.exit(1);
}

if (!html.includes("function buildReasonChain(") || !html.includes("reason chain:")) {
  console.error("[ui-smoke] Missing deterministic reason-chain rendering hooks.");
  process.exit(1);
}

if (!html.includes("lineage=") || !html.includes("sources=")) {
  console.error("[ui-smoke] Missing deterministic lineage summary fields (lineage/sources).");
  process.exit(1);
}

if (!html.includes('if (ev.includes("fail") || ev.includes("canceled")) cls = "bad";') ||
  !html.includes('else if (ev.includes("manual") || ev.includes("warn")) cls = "warn";') ||
  !html.includes('else if (ev.includes("complete")) cls = "ok";')) {
  console.error("[ui-smoke] Timeline severity rendering is missing distinct bad/warn/ok treatment.");
  process.exit(1);
}

if (!html.includes("## Queue Results Summary") || !html.includes("## Trust Summary") || !html.includes("## Warnings Failures and Manual Review") || !html.includes("## Evidence Timeline and Lineage")) {
  console.error("[ui-smoke] Missing required structured reporting sections.");
  process.exit(1);
}

if (!html.includes("## Case Timeline") || !html.includes("## Export Metadata")) {
  console.error("[ui-smoke] Missing required case-report timeline/export sections.");
  process.exit(1);
}

if (!html.includes("if (!failedJobs.length && !warningJobs.length && !manualReviewJobs.length)")) {
  console.error("[ui-smoke] Missing risk-section conditional rendering guard for warnings/failures/manual-review.");
  process.exit(1);
}

if (!html.includes("Batch report exported (MD + JSON).") || !html.includes("Case report exported for")) {
  console.error("[ui-smoke] Missing operator-usable report export variants (MD + JSON).");
  process.exit(1);
}

if (!html.includes("Batch report export failed: no automation snapshot available.")) {
  console.error("[ui-smoke] Missing explicit batch report export failure messaging.");
  process.exit(1);
}

if (!html.includes("Case report launch blocked: no active case.") || !html.includes("Case report export blocked: no active case.")) {
  console.error("[ui-smoke] Missing explicit case report launch/export blocked-state truth messaging.");
  process.exit(1);
}

if (!html.includes("Ready: Active Case") || !html.includes("Waiting For Results") || !html.includes("Blocked: No Active Case")) {
  console.error("[ui-smoke] Missing export-readiness tri-state truth labels.");
  process.exit(1);
}

console.log("[ui-smoke] PASS: core operator UI shell and critical IDs are present.");
