"use strict";

const fs = require("fs");
const path = require("path");

const uiPath = path.join(__dirname, "..", "ui", "hypersnatch-ui.html");
const html = fs.readFileSync(uiPath, "utf8");
const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

function assertPattern(pattern, message) {
  if (!pattern.test(html)) {
    console.error(message);
    process.exit(1);
  }
}

function countMatches(pattern) {
  return (html.match(pattern) || []).length;
}

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

assertPattern(/function statusBadgeClass\(status\)[\s\S]*status === "running"[\s\S]*status === "completed"[\s\S]*status === "warning"[\s\S]*status === "manual-review"[\s\S]*status === "failed"/,
  "[ui-smoke] Queue status badge mapping is missing required running/warning/manual-review/failed semantics.");

if (!html.includes('status === "queued"') || !html.includes('status === "paused"')) {
  console.error("[ui-smoke] Queue status badge mapping is missing queued/paused warning treatment.");
  process.exit(1);
}

assertPattern(/const canPause = j\.status === "queued" \|\| j\.status === "manual-review";[\s\S]*const canResume = j\.status === "paused" \|\| j\.status === "manual-review";[\s\S]*const canCancel = j\.status !== "running";[\s\S]*const canManualReview = j\.status === "queued" \|\| j\.status === "paused";/,
  "[ui-smoke] Queue action availability semantics are missing (pause/resume/cancel/manual-review).");

assertPattern(/qBody\.innerHTML = snapshot\.queue\.map\(\(j\) => \{[\s\S]*data-queue-action="pause"[\s\S]*data-queue-action="resume"[\s\S]*data-queue-action="manual-review"[\s\S]*data-queue-action="cancel"/,
  "[ui-smoke] Queue transition controls are not wired for runtime pause/resume/manual-review/cancel semantics.");

if (!html.includes('j.status === "failed" || j.status === "warning" || j.status === "canceled"')) {
  console.error("[ui-smoke] Requeue availability semantics are missing for failed/warning/canceled states.");
  process.exit(1);
}

if (!/function isReopenableStatus\(status\)[\s\S]*status === "completed"[\s\S]*status === "warning"[\s\S]*status === "failed"[\s\S]*status === "canceled"/.test(html)) {
  console.error("[ui-smoke] Reopenability contract for completed/warning/failed/canceled statuses is missing.");
  process.exit(1);
}

if (!html.includes("const canReopen = isReopenableStatus(job.status);")) {
  console.error("[ui-smoke] Case workspace reopenability gating is missing.");
  process.exit(1);
}

if (!html.includes('automationQueueAction(jobId, "requeue", reason)')) {
  console.error("[ui-smoke] Reopen flow is not pinned to queue requeue action.");
  process.exit(1);
}

if (!html.includes('const reason = `Reopened from case workspace ${this.activeCase?.case_id || "unknown-case"}.`;')) {
  console.error("[ui-smoke] Reopen flow is missing deterministic case-context reason text.");
  process.exit(1);
}

if (!html.includes('reason = prompt("Manual-review reason:"') ||
  !html.includes('reason = "Cancelled by operator from queue panel."') ||
  !html.includes('reason = "Requeued by operator for retry."')) {
  console.error("[ui-smoke] Queue action reason-chain defaults are incomplete for manual-review/cancel/requeue.");
  process.exit(1);
}

assertPattern(/async function handleQueueAction\(id, action\)[\s\S]*if \(action === "manual-review"\)[\s\S]*prompt\("Manual-review reason:"[\s\S]*else if \(action === "cancel"\)[\s\S]*Cancelled by operator from queue panel\.[\s\S]*else if \(action === "requeue"\)[\s\S]*Requeued by operator for retry\.[\s\S]*automationQueueAction\(id, action, reason\)[\s\S]*Queue action failed: \$\{action\}\.[\s\S]*Queue action applied: \$\{action\}\.[\s\S]*await syncAutomationState\(\);/,
  "[ui-smoke] Queue action handler is missing runtime transition truth for reason/default/failure/success semantics.");

if (!html.includes("Queue action failed:") || !html.includes("Queue action applied:")) {
  console.error("[ui-smoke] Queue action success/failure truth messaging is incomplete.");
  process.exit(1);
}

assertPattern(/if \(!this\.activeCase \|\| !this\.activeCase\.case_id\)[\s\S]*Load a case to initialize workspace state\./,
  "[ui-smoke] Case workspace missing no-active-case state handling.");

assertPattern(/if \(automationError\)[\s\S]*Automation state unavailable:/,
  "[ui-smoke] Case workspace missing automation-error state handling.");

assertPattern(/if \(!snapshot\)[\s\S]*Loading linked queue activity for active case\.\.\./,
  "[ui-smoke] Case workspace missing loading state handling.");

assertPattern(/if \(!linkedJobs\.length\)[\s\S]*No linked queue activity for this case\./,
  "[ui-smoke] Case workspace missing empty-linked-jobs state handling.");

assertPattern(/function buildTrustSummaryFromJobs\(jobs, rollup\)[\s\S]*Critical failures detected[\s\S]*Manual review required[\s\S]*Stable and completed[\s\S]*In progress/,
  "[ui-smoke] Trust summary state classification is incomplete.");

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

if (!html.includes(".sort((a, b) => (b.at || 0) - (a.at || 0))")) {
  console.error("[ui-smoke] Case timeline ordering is not explicitly newest-first.");
  process.exit(1);
}

assertPattern(/function buildJobTimelineEvents\(job, limit = 12\)[\s\S]*if \(job\.addedAt\)[\s\S]*event: "queued"[\s\S]*if \(job\.startedAt\)[\s\S]*event: "started"[\s\S]*if \(job\.finishedAt\)[\s\S]*event: String\(job\.status \|\| "completed"\)[\s\S]*const actionLog = Array\.isArray\(job\.actionLog\) \? job\.actionLog : \[];[\s\S]*\.sort\(\(a, b\) => \(a\.at \|\| 0\) - \(b\.at \|\| 0\)\)[\s\S]*return dedup\.slice\(-limit\);/,
  "[ui-smoke] Job timeline runtime lineage does not enforce queued/started/finished/action-log ordering and dedupe semantics.");

assertPattern(/function buildCaseTimelineEvents\(jobs, limit = 24\)[\s\S]*buildJobTimelineEvents\(job, 14\)[\s\S]*\.sort\(\(a, b\) => \(b\.at \|\| 0\) - \(a\.at \|\| 0\)\)[\s\S]*\.slice\(0, limit\);/,
  "[ui-smoke] Case timeline lineage is missing merged newest-first runtime ordering semantics.");

if (!html.includes("## Queue Results Summary") || !html.includes("## Trust Summary") || !html.includes("## Warnings Failures and Manual Review") || !html.includes("## Evidence Timeline and Lineage")) {
  console.error("[ui-smoke] Missing required structured reporting sections.");
  process.exit(1);
}

if (!html.includes("## Case Timeline") || !html.includes("## Export Metadata")) {
  console.error("[ui-smoke] Missing required case-report timeline/export sections.");
  process.exit(1);
}

if (countMatches(/if \(!failedJobs\.length && !warningJobs\.length && !manualReviewJobs\.length\)/g) < 2) {
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

assertPattern(/const hasActiveCase = Boolean\(window\.caseMgr && window\.caseMgr\.activeCase && window\.caseMgr\.activeCase\.case_id\);[\s\S]*const canExport = hasActiveCase && latest && \(latest\.status === "completed" \|\| latest\.status === "warning"\);[\s\S]*if \(canExport\)[\s\S]*Ready: Active Case[\s\S]*else if \(hasActiveCase\)[\s\S]*Waiting For Results[\s\S]*else \{[\s\S]*Blocked: No Active Case/,
  "[ui-smoke] Export readiness gate must enforce active-case and completed/warning runtime truth.");

assertPattern(/async openCaseReportFromContext\(\)[\s\S]*if \(!this\.activeCase \|\| !this\.activeCase\.case_id\)[\s\S]*Case report launch blocked: no active case\.[\s\S]*const report = this\.buildCaseWorkspaceReport\(state\.lastAutomation\);[\s\S]*state\.lastCaseWorkspaceReport = report;[\s\S]*if \(reportEl\) reportEl\.value = report\.markdown;[\s\S]*activateTab\(el\("tabBtnAutomation"\)\);[\s\S]*Case report loaded for \$\{this\.activeCase\.case_id\}\./,
  "[ui-smoke] Case report launch flow is missing blocked-state gating and context-loaded runtime semantics.");

assertPattern(/async exportCaseReportFromContext\(\)[\s\S]*if \(!this\.activeCase \|\| !this\.activeCase\.case_id\)[\s\S]*Case report export blocked: no active case\.[\s\S]*const report = this\.buildCaseWorkspaceReport\(state\.lastAutomation\);[\s\S]*state\.lastCaseWorkspaceReport = report;[\s\S]*downloadFile\(report\.markdown \|\| "", `\$\{base\}\.md`, "text\/markdown"\);[\s\S]*downloadFile\(JSON\.stringify\(report, null, 2\), `\$\{base\}\.json`, "application\/json"\);[\s\S]*Case report exported for \$\{this\.activeCase\.case_id\} \(MD \+ JSON\)\./,
  "[ui-smoke] Case report export flow is missing blocked-state gating or deterministic MD/JSON export semantics.");

if (!html.includes("Ready: Active Case") || !html.includes("Waiting For Results") || !html.includes("Blocked: No Active Case")) {
  console.error("[ui-smoke] Missing export-readiness tri-state truth labels.");
  process.exit(1);
}

console.log("[ui-smoke] PASS: core operator UI shell and critical IDs are present.");
