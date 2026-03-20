"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

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

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assertRuntime(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function extractFunctionSource(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  if (start === -1) {
    fail(`[ui-smoke] Missing function source for runtime proof: ${name}`);
  }

  const braceStart = html.indexOf("{", start);
  if (braceStart === -1) {
    fail(`[ui-smoke] Malformed function source for runtime proof: ${name}`);
  }

  let depth = 0;
  for (let i = braceStart; i < html.length; i += 1) {
    const ch = html[i];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) {
      return html.slice(start, i + 1);
    }
  }

  fail(`[ui-smoke] Unterminated function source for runtime proof: ${name}`);
}

function compileRuntimeFunction(name, sandbox = {}) {
  const source = extractFunctionSource(name);
  const context = vm.createContext({ ...sandbox });
  try {
    const fn = vm.runInContext(`(${source})`, context, { timeout: 1000 });
    if (typeof fn !== "function") {
      fail(`[ui-smoke] Runtime proof compile did not return a function: ${name}`);
    }
    return fn;
  } catch (error) {
    fail(`[ui-smoke] Runtime proof compile failed for ${name}: ${error.message}`);
  }
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

const statusBadgeClass = compileRuntimeFunction("statusBadgeClass");
assertRuntime(statusBadgeClass("running") === "ok", "[ui-smoke] Runtime statusBadgeClass failed: running should map to ok.");
assertRuntime(statusBadgeClass("manual-review") === "warn", "[ui-smoke] Runtime statusBadgeClass failed: manual-review should map to warn.");
assertRuntime(statusBadgeClass("failed") === "bad", "[ui-smoke] Runtime statusBadgeClass failed: failed should map to bad.");
assertRuntime(statusBadgeClass("unknown") === "idle", "[ui-smoke] Runtime statusBadgeClass failed: unknown should map to idle.");

const isReopenableStatus = compileRuntimeFunction("isReopenableStatus");
assertRuntime(isReopenableStatus("completed") === true, "[ui-smoke] Runtime reopenability failed: completed should be reopenable.");
assertRuntime(isReopenableStatus("warning") === true, "[ui-smoke] Runtime reopenability failed: warning should be reopenable.");
assertRuntime(isReopenableStatus("failed") === true, "[ui-smoke] Runtime reopenability failed: failed should be reopenable.");
assertRuntime(isReopenableStatus("canceled") === true, "[ui-smoke] Runtime reopenability failed: canceled should be reopenable.");
assertRuntime(isReopenableStatus("queued") === false, "[ui-smoke] Runtime reopenability failed: queued should not be reopenable.");

const buildReasonChain = compileRuntimeFunction("buildReasonChain");
const reasonChain = buildReasonChain({
  failureReason: "decoder failed",
  actionLog: [
    { at: 3, action: "cancel", detail: "canceled by operator" },
    { at: 2, action: "manual-review", detail: "needs analyst" },
    { at: 2, action: "manual-review", detail: "needs analyst" }
  ]
}, 4);
assertRuntime(Array.isArray(reasonChain), "[ui-smoke] Runtime reason-chain failed: expected array.");
assertRuntime(reasonChain[0] === "decoder failed", "[ui-smoke] Runtime reason-chain failed: headline reason should be preserved.");
assertRuntime(reasonChain.includes("manual-review: needs analyst"), "[ui-smoke] Runtime reason-chain failed: manual-review reason should be present.");
assertRuntime(reasonChain.filter((item) => item === "manual-review: needs analyst").length === 1, "[ui-smoke] Runtime reason-chain failed: duplicate reason entries should be deduplicated.");

const buildJobTimelineEvents = compileRuntimeFunction("buildJobTimelineEvents", { buildReasonChain });
const sampleJob = {
  id: "job-A",
  host: "example.test",
  status: "failed",
  source: "batch",
  attempts: 2,
  addedAt: 100,
  startedAt: 200,
  finishedAt: 500,
  failureReason: "network timeout",
  actionLog: [
    { at: 300, action: "manual-review", detail: "needs analyst", by: "operator" },
    { at: 300, action: "manual-review", detail: "needs analyst", by: "operator" },
    { at: 450, action: "cancel", detail: "canceled by operator", by: "operator" }
  ]
};
const jobTimeline = buildJobTimelineEvents(sampleJob, 20);
assertRuntime(Array.isArray(jobTimeline), "[ui-smoke] Runtime timeline failed: expected job timeline array.");
assertRuntime(jobTimeline.length >= 4, "[ui-smoke] Runtime timeline failed: expected queued/started/action/finished events.");
assertRuntime(jobTimeline[0].event === "queued", "[ui-smoke] Runtime timeline failed: first event should be queued.");
assertRuntime(jobTimeline[jobTimeline.length - 1].event === "failed", "[ui-smoke] Runtime timeline failed: last event should reflect finished status.");
assertRuntime(jobTimeline.filter((ev) => ev.event === "manual-review").length === 1, "[ui-smoke] Runtime timeline failed: duplicate manual-review events should be deduplicated.");

const buildCaseTimelineEvents = compileRuntimeFunction("buildCaseTimelineEvents", { buildJobTimelineEvents });
const caseTimeline = buildCaseTimelineEvents([
  sampleJob,
  {
    id: "job-B",
    host: "example-two.test",
    status: "completed",
    source: "clipboard",
    attempts: 1,
    addedAt: 120,
    startedAt: 220,
    finishedAt: 620,
    actionLog: [{ at: 600, action: "resume", detail: "resumed by operator", by: "operator" }]
  }
], 24);
assertRuntime(Array.isArray(caseTimeline), "[ui-smoke] Runtime case timeline failed: expected array.");
assertRuntime(caseTimeline.length > 0, "[ui-smoke] Runtime case timeline failed: expected merged timeline events.");
assertRuntime(caseTimeline[0].at >= caseTimeline[Math.min(1, caseTimeline.length - 1)].at, "[ui-smoke] Runtime case timeline failed: timeline should be newest-first.");
assertRuntime(caseTimeline.every((ev) => ev.jobId && ev.host && ev.status), "[ui-smoke] Runtime case timeline failed: merged events must include jobId/host/status.");

const buildTrustSummaryFromJobs = compileRuntimeFunction("buildTrustSummaryFromJobs");
const failedSummary = buildTrustSummaryFromJobs([{ id: "x" }], { failed: 1, manualReview: 0, warning: 0, canceled: 0, running: 0, queued: 0, completed: 0 });
assertRuntime(failedSummary.className === "bad", "[ui-smoke] Runtime trust summary failed: failed rollup should be bad.");
const reviewSummary = buildTrustSummaryFromJobs([{ id: "x" }], { failed: 0, manualReview: 1, warning: 0, canceled: 0, running: 0, queued: 0, completed: 0 });
assertRuntime(reviewSummary.className === "warn", "[ui-smoke] Runtime trust summary failed: manual-review rollup should be warn.");
const completeSummary = buildTrustSummaryFromJobs([{ id: "x" }], { failed: 0, manualReview: 0, warning: 0, canceled: 0, running: 0, queued: 0, completed: 2 });
assertRuntime(completeSummary.className === "ok", "[ui-smoke] Runtime trust summary failed: completed rollup should be ok.");

const evaluateDecodeOutcome = compileRuntimeFunction("evaluateDecodeOutcome");
const batchOkOutcome = evaluateDecodeOutcome({ batch: true, jobs: [{ candidates: [{}] }, { candidates: [] }] });
assertRuntime(batchOkOutcome.kind === "ok", "[ui-smoke] Runtime decode outcome failed: batch with candidates should be ok.");
const batchWarnOutcome = evaluateDecodeOutcome({ batch: true, jobs: [{ candidates: [] }] });
assertRuntime(batchWarnOutcome.kind === "warn", "[ui-smoke] Runtime decode outcome failed: empty batch candidates should be warn.");
const refusalOutcome = evaluateDecodeOutcome({ candidates: [], refusals: [{ reason: "auth" }] });
assertRuntime(refusalOutcome.kind === "warn", "[ui-smoke] Runtime decode outcome failed: refusal-only result should be warn.");
const nullOutcome = evaluateDecodeOutcome(null);
assertRuntime(nullOutcome.kind === "bad", "[ui-smoke] Runtime decode outcome failed: null result should be bad.");

const createEmptyStatusRollup = compileRuntimeFunction("createEmptyStatusRollup");
const accumulateStatusRollup = compileRuntimeFunction("accumulateStatusRollup");
const buildStatusRollup = compileRuntimeFunction("buildStatusRollup", {
  createEmptyStatusRollup,
  accumulateStatusRollup
});
const buildCaseRollups = compileRuntimeFunction("buildCaseRollups", {
  createEmptyStatusRollup,
  accumulateStatusRollup
});
const statusLabel = compileRuntimeFunction("statusLabel");
const formatTimestamp = compileRuntimeFunction("formatTimestamp");
const buildBatchReport = compileRuntimeFunction("buildBatchReport", {
  buildStatusRollup,
  buildCaseRollups,
  buildTrustSummaryFromJobs,
  buildReasonChain,
  buildJobTimelineEvents,
  buildCaseTimelineEvents,
  statusLabel,
  formatTimestamp
});

const interactionSnapshot = {
  mode: "ON",
  metrics: { queueLength: 2 },
  queue: [
    {
      id: "queue-1",
      status: "running",
      host: "alpha.example",
      url: "https://alpha.example/video",
      source: "batch",
      caseId: "CASE-ALPHA",
      addedAt: 100,
      startedAt: 150,
      attempts: 1,
      actionLog: [{ at: 151, action: "resume", detail: "resumed by scheduler", by: "scheduler" }]
    },
    {
      id: "queue-2",
      status: "manual-review",
      host: "beta.example",
      url: "https://beta.example/video",
      source: "batch",
      caseId: "CASE-ALPHA",
      addedAt: 200,
      manualReviewReason: "captcha challenge",
      actionLog: [{ at: 220, action: "manual-review", detail: "captcha challenge", by: "operator" }]
    }
  ],
  history: [
    {
      id: "history-1",
      status: "failed",
      host: "gamma.example",
      url: "https://gamma.example/video",
      source: "clipboard",
      caseId: "CASE-BETA",
      addedAt: 50,
      startedAt: 60,
      finishedAt: 400,
      failureReason: "network timeout",
      actionLog: [{ at: 360, action: "cancel", detail: "canceled after timeout", by: "scheduler" }]
    },
    {
      id: "history-2",
      status: "warning",
      host: "delta.example",
      url: "https://delta.example/video",
      source: "clipboard",
      caseId: "CASE-BETA",
      addedAt: 40,
      startedAt: 45,
      finishedAt: 300,
      lastResultSummary: { message: "partial extraction result" },
      actionLog: [{ at: 280, action: "manual-review", detail: "partial extraction result", by: "operator" }]
    }
  ]
};
const interactionReport = buildBatchReport(interactionSnapshot);
assertRuntime(interactionReport.queueResultsSummary.running === 1, "[ui-smoke] Runtime batch report failed: running rollup should be 1.");
assertRuntime(interactionReport.queueResultsSummary.manualReview === 1, "[ui-smoke] Runtime batch report failed: manual-review rollup should be 1.");
assertRuntime(interactionReport.queueResultsSummary.failed === 1, "[ui-smoke] Runtime batch report failed: failed rollup should be 1.");
assertRuntime(interactionReport.queueResultsSummary.warning === 1, "[ui-smoke] Runtime batch report failed: warning rollup should be 1.");
assertRuntime(Array.isArray(interactionReport.caseSummary) && interactionReport.caseSummary.length === 2, "[ui-smoke] Runtime batch report failed: case summary should include both linked cases.");
assertRuntime(interactionReport.riskSummary.failed.length === 1, "[ui-smoke] Runtime batch report failed: failed risk summary length mismatch.");
assertRuntime(interactionReport.riskSummary.warning.length === 1, "[ui-smoke] Runtime batch report failed: warning risk summary length mismatch.");
assertRuntime(interactionReport.riskSummary.manualReview.length === 1, "[ui-smoke] Runtime batch report failed: manual-review risk summary length mismatch.");
assertRuntime(interactionReport.exportMetadata.deterministicHeadings === true, "[ui-smoke] Runtime batch report failed: deterministic headings flag should be true.");
assertRuntime(interactionReport.markdown.includes("## Warnings Failures and Manual Review"), "[ui-smoke] Runtime batch report failed: risk section heading missing.");
assertRuntime(interactionReport.markdown.includes("manual-review:"), "[ui-smoke] Runtime batch report failed: manual-review lines should render in report.");

const noRiskReport = buildBatchReport({
  mode: "ON",
  metrics: {},
  queue: [],
  history: [
    {
      id: "completed-1",
      status: "completed",
      host: "omega.example",
      url: "https://omega.example/video",
      source: "batch",
      caseId: "CASE-OMEGA",
      addedAt: 1,
      startedAt: 2,
      finishedAt: 3,
      actionLog: []
    }
  ]
});
assertRuntime(/## Warnings Failures and Manual Review[\s\S]*- none/.test(noRiskReport.markdown), "[ui-smoke] Runtime batch report failed: no-risk report should render '- none' in risk section.");

console.log("[ui-smoke] PASS: core operator UI shell and critical IDs are present.");
