"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const uiPath = path.join(__dirname, "..", "ui", "hypersnatch-ui.html");
const jsPath = path.join(__dirname, "..", "ui", "hypersnatch-ui.js");
const htmlRaw = fs.readFileSync(uiPath, "utf8");
const jsRaw = fs.readFileSync(jsPath, "utf8");
// Renderer JS now lives in an external packaged file (CSP hardening: no inline script).
// Combine for substring/function-source checks so existing proofs keep validating the logic.
const html = htmlRaw + "\n" + jsRaw;
const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

// ── CSP hardening contract ───────────────────────────────────────────────
if (!/<script\s+src="hypersnatch-ui\.js"><\/script>/.test(htmlRaw)) {
  console.error("[ui-smoke] Renderer must load the packaged external script ui/hypersnatch-ui.js.");
  process.exit(1);
}
if (/<script(?![^>]*\bsrc=)[^>]*>/.test(htmlRaw)) {
  console.error("[ui-smoke] Inline <script> blocks are not allowed; renderer JS must be external.");
  process.exit(1);
}
const inlineHandlerRe = /\son(?:click|change|input|submit|keydown|keyup|load|mouseover|mouseenter|mouseleave|focus|blur|dblclick)\s*=/i;
if (inlineHandlerRe.test(htmlRaw)) {
  console.error("[ui-smoke] Inline event handlers are not allowed in renderer HTML; use data-action delegation.");
  process.exit(1);
}
if (/\son(?:click|change|input|submit|keydown|keyup|mouseover|mouseenter|focus|blur|dblclick)\s*=/i.test(jsRaw)) {
  console.error("[ui-smoke] Generated markup must not emit inline event handlers; use data-action delegation.");
  process.exit(1);
}
const mainPath = path.join(__dirname, "..", "src", "main.js");
const mainSrc = fs.readFileSync(mainPath, "utf8");
const scriptSrcMatch = mainSrc.match(/script-src[^;]*;/);
if (!scriptSrcMatch) {
  console.error("[ui-smoke] Could not locate script-src directive in src/main.js CSP.");
  process.exit(1);
}
if (/unsafe-inline/.test(scriptSrcMatch[0])) {
  console.error("[ui-smoke] CSP script-src must not contain 'unsafe-inline'.");
  process.exit(1);
}

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

function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractFunctionSource(name) {
  const asyncMarker = `async function ${name}(`;
  const plainMarker = `function ${name}(`;
  let start = html.indexOf(asyncMarker);
  if (start === -1) {
    start = html.indexOf(plainMarker);
  }
  if (start === -1) {
    const escaped = escapeRegex(name);
    const methodPattern = new RegExp(`(?:^|\\n)\\s*(?:async\\s+)?${escaped}\\s*\\(`, "m");
    const methodMatch = methodPattern.exec(html);
    if (methodMatch) {
      const methodSource = methodMatch[0];
      const asyncOffset = methodSource.indexOf("async ");
      if (asyncOffset >= 0) {
        start = methodMatch.index + asyncOffset;
      } else {
        const nameOffset = methodSource.lastIndexOf(name);
        start = methodMatch.index + Math.max(0, nameOffset);
      }
    }
  }
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
  const escaped = escapeRegex(name);
  let normalizedSource = source;
  if (!source.startsWith(`async function ${name}(`) && !source.startsWith(`function ${name}(`)) {
    normalizedSource = source
      .replace(new RegExp(`^async\\s+${escaped}\\s*\\(`), `async function ${name}(`)
      .replace(new RegExp(`^${escaped}\\s*\\(`), `function ${name}(`);
  }
  const context = vm.createContext({ ...sandbox });
  try {
    const fn = vm.runInContext(`(${normalizedSource})`, context, { timeout: 1000 });
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
  "sampleSummaryCard",
  "sscArtifactCount",
  "sscHashCount",
  "sscReceiptCount",
  "btnViewReceipt",
  "btnExportBundle",
  "receiptModal",
  "btnReceiptClose",
  "btnCopyReceipt",
  "btnOpenReceiptFolder",
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
assertRuntime(statusBadgeClass("completed") === "ok", "[ui-smoke] Runtime statusBadgeClass failed: completed should map to ok.");
assertRuntime(statusBadgeClass("queued") === "warn", "[ui-smoke] Runtime statusBadgeClass failed: queued should map to warn.");
assertRuntime(statusBadgeClass("paused") === "warn", "[ui-smoke] Runtime statusBadgeClass failed: paused should map to warn.");
assertRuntime(statusBadgeClass("warning") === "warn", "[ui-smoke] Runtime statusBadgeClass failed: warning should map to warn.");
assertRuntime(statusBadgeClass("manual-review") === "warn", "[ui-smoke] Runtime statusBadgeClass failed: manual-review should map to warn.");
assertRuntime(statusBadgeClass("failed") === "bad", "[ui-smoke] Runtime statusBadgeClass failed: failed should map to bad.");
assertRuntime(statusBadgeClass("canceled") !== "ok", "[ui-smoke] Runtime statusBadgeClass failed: canceled must not be treated as success.");
assertRuntime(statusBadgeClass("unknown") === "idle", "[ui-smoke] Runtime statusBadgeClass failed: unknown should map to idle.");

const isReopenableStatus = compileRuntimeFunction("isReopenableStatus");
assertRuntime(isReopenableStatus("completed") === true, "[ui-smoke] Runtime reopenability failed: completed should be reopenable.");
assertRuntime(isReopenableStatus("warning") === true, "[ui-smoke] Runtime reopenability failed: warning should be reopenable.");
assertRuntime(isReopenableStatus("failed") === true, "[ui-smoke] Runtime reopenability failed: failed should be reopenable.");
assertRuntime(isReopenableStatus("canceled") === true, "[ui-smoke] Runtime reopenability failed: canceled should be reopenable.");
assertRuntime(isReopenableStatus("queued") === false, "[ui-smoke] Runtime reopenability failed: queued should not be reopenable.");
assertRuntime(isReopenableStatus("running") === false, "[ui-smoke] Runtime reopenability failed: running should not be reopenable.");
assertRuntime(isReopenableStatus("paused") === false, "[ui-smoke] Runtime reopenability failed: paused should not be reopenable.");
assertRuntime(isReopenableStatus("manual-review") === false, "[ui-smoke] Runtime reopenability failed: manual-review should not be reopenable.");

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
const transitionJob = {
  id: "job-transition",
  host: "transitions.example",
  status: "canceled",
  source: "batch",
  attempts: 3,
  addedAt: 1000,
  startedAt: 1100,
  finishedAt: 1600,
  actionLog: [
    { at: 1200, action: "pause", detail: "paused by operator", by: "operator" },
    { at: 1300, action: "resume", detail: "resumed by operator", by: "operator" },
    { at: 1400, action: "manual-review", detail: "state ambiguity", by: "operator" },
    { at: 1500, action: "requeue", detail: "retry requested", by: "operator" }
  ]
};
const transitionTimeline = buildJobTimelineEvents(transitionJob, 20);
assertRuntime(transitionTimeline.some((ev) => ev.event === "pause"), "[ui-smoke] Runtime timeline failed: pause transition event should be recorded.");
assertRuntime(transitionTimeline.some((ev) => ev.event === "resume"), "[ui-smoke] Runtime timeline failed: resume transition event should be recorded.");
assertRuntime(transitionTimeline.some((ev) => ev.event === "manual-review"), "[ui-smoke] Runtime timeline failed: manual-review transition event should be recorded.");
assertRuntime(transitionTimeline.some((ev) => ev.event === "requeue"), "[ui-smoke] Runtime timeline failed: requeue transition event should be recorded.");
assertRuntime(transitionTimeline[transitionTimeline.length - 1].event === "canceled", "[ui-smoke] Runtime timeline failed: terminal canceled state should be recorded.");
["completed", "warning", "failed", "canceled"].forEach((terminalStatus) => {
  const terminalTimeline = buildJobTimelineEvents({
    id: `job-${terminalStatus}`,
    host: "terminal.example",
    status: terminalStatus,
    source: "batch",
    addedAt: 1,
    startedAt: 2,
    finishedAt: 3,
    actionLog: []
  }, 10);
  assertRuntime(
    terminalTimeline[terminalTimeline.length - 1].event === terminalStatus,
    `[ui-smoke] Runtime timeline failed: terminal status ${terminalStatus} must be reflected in finished event.`
  );
});

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
const formatDuration = compileRuntimeFunction("formatDuration");
const buildCaseLineageSummary = compileRuntimeFunction("buildCaseLineageSummary", { formatTimestamp });
const updateTrustFromAutomation = compileRuntimeFunction("updateTrustFromAutomation", {
  statusLabel,
  statusBadgeClass,
  formatDuration
});
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

const transitionRollup = buildStatusRollup([
  { status: "queued" },
  { status: "running" },
  { status: "paused" },
  { status: "manual-review" },
  { status: "completed" },
  { status: "warning" },
  { status: "failed" },
  { status: "canceled" }
]);
assertRuntime(transitionRollup.queued === 1 && transitionRollup.running === 1 && transitionRollup.paused === 1,
  "[ui-smoke] Runtime rollup failed: queued/running/paused counts should each be 1.");
assertRuntime(transitionRollup.manualReview === 1 && transitionRollup.completed === 1 && transitionRollup.warning === 1,
  "[ui-smoke] Runtime rollup failed: manual-review/completed/warning counts should each be 1.");
assertRuntime(transitionRollup.failed === 1 && transitionRollup.canceled === 1,
  "[ui-smoke] Runtime rollup failed: failed/canceled counts should each be 1.");

const transitionCaseRollups = buildCaseRollups([
  { caseId: "CASE-A", status: "queued" },
  { caseId: "CASE-A", status: "running" },
  { caseId: "CASE-A", status: "warning" },
  { caseId: "CASE-B", status: "manual-review" },
  { caseId: "CASE-B", status: "failed" }
]);
assertRuntime(transitionCaseRollups["CASE-A"].queued === 1 && transitionCaseRollups["CASE-A"].running === 1 && transitionCaseRollups["CASE-A"].warning === 1,
  "[ui-smoke] Runtime case rollup failed: CASE-A queue/running/warning counts should be preserved.");
assertRuntime(transitionCaseRollups["CASE-B"].manualReview === 1 && transitionCaseRollups["CASE-B"].failed === 1,
  "[ui-smoke] Runtime case rollup failed: CASE-B manual-review/failed counts should be preserved.");

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
assertRuntime(!/## Warnings Failures and Manual Review[\s\S]*- none/.test(interactionReport.markdown),
  "[ui-smoke] Runtime batch report failed: risk section must not render '- none' when risk jobs exist.");

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

const reviewFirstReport = buildBatchReport({
  mode: "ON",
  metrics: {},
  queue: [
    {
      id: "review-1",
      status: "manual-review",
      host: "review.example",
      url: "https://review.example/media",
      source: "batch",
      caseId: "CASE-REVIEW",
      addedAt: 100,
      manualReviewReason: "captcha challenge",
      actionLog: [{ at: 120, action: "manual-review", detail: "captcha challenge", by: "operator" }]
    }
  ],
  history: []
});
assertRuntime(reviewFirstReport.trustSummary.label === "Manual review required",
  "[ui-smoke] Runtime batch report failed: manual-review rollup should not present as stable completion.");
assertRuntime(reviewFirstReport.trustSummary.className === "warn",
  "[ui-smoke] Runtime batch report failed: manual-review trust status should be warn.");
assertRuntime(reviewFirstReport.riskSummary.manualReview.length === 1,
  "[ui-smoke] Runtime batch report failed: manual-review risk entries should be captured.");

const inProgressReport = buildBatchReport({
  mode: "ON",
  metrics: {},
  queue: [
    {
      id: "in-progress-1",
      status: "queued",
      host: "progress.example",
      url: "https://progress.example/media",
      source: "batch",
      caseId: "CASE-SHIFT",
      addedAt: 100,
      actionLog: []
    }
  ],
  history: []
});
assertRuntime(inProgressReport.trustSummary.label === "In progress",
  "[ui-smoke] Runtime batch report failed: queued case should remain in-progress.");
assertRuntime(inProgressReport.caseSummary[0].queued === 1,
  "[ui-smoke] Runtime batch report failed: queued case summary count should be 1 before risk transition.");

const escalatedReport = buildBatchReport({
  mode: "ON",
  metrics: {},
  queue: [],
  history: [
    {
      id: "escalated-1",
      status: "failed",
      host: "progress.example",
      url: "https://progress.example/media",
      source: "batch",
      caseId: "CASE-SHIFT",
      addedAt: 100,
      startedAt: 120,
      finishedAt: 240,
      failureReason: "decode timeout",
      actionLog: [{ at: 220, action: "cancel", detail: "canceled after timeout", by: "scheduler" }]
    }
  ]
});
assertRuntime(escalatedReport.trustSummary.label === "Critical failures detected",
  "[ui-smoke] Runtime batch report failed: failed transition should escalate trust status.");
assertRuntime(escalatedReport.caseSummary[0].failed === 1,
  "[ui-smoke] Runtime batch report failed: case summary should reflect failed transition.");

const lineageSummary = buildCaseLineageSummary("CASE-LINEAGE", interactionSnapshot.queue, caseTimeline);
assertRuntime(lineageSummary.includes("case=CASE-LINEAGE"), "[ui-smoke] Runtime lineage summary failed: case id should be preserved.");
assertRuntime(lineageSummary.includes("sources=batch"), "[ui-smoke] Runtime lineage summary failed: source lineage should be explicit.");

function runTrustPanelProof(snapshot, activeCase) {
  const nodes = {
    intBatchState: { textContent: "", className: "" },
    intSw: { textContent: "", className: "" },
    intBest: { textContent: "", className: "" },
    intExportReady: { textContent: "", className: "" },
    intHash: { textContent: "", className: "" }
  };
  const sandboxWindow = { caseMgr: { activeCase: activeCase || null } };
  const fn = compileRuntimeFunction("updateTrustFromAutomation", {
    statusLabel,
    statusBadgeClass,
    formatDuration,
    window: sandboxWindow,
    el: (id) => nodes[id] || null
  });
  fn(snapshot);
  return nodes;
}

const runningTrustNodes = runTrustPanelProof({
  mode: "ON",
  metrics: { queued: 2 },
  activeJob: { id: "active-1" },
  history: []
}, { case_id: "CASE-RUNNING" });
assertRuntime(runningTrustNodes.intBatchState.textContent === "RUNNING",
  "[ui-smoke] Runtime trust panel failed: active job should force RUNNING lifecycle.");
assertRuntime(runningTrustNodes.intBatchState.className.includes("ok"),
  "[ui-smoke] Runtime trust panel failed: RUNNING lifecycle should map to ok badge.");

const readyTrustNodes = runTrustPanelProof({
  mode: "ON",
  metrics: {},
  history: [{ id: "ready-job-1", status: "warning", durationMs: 900, retryCount: 1, manualReviewReason: "needs review" }]
}, { case_id: "CASE-READY" });
assertRuntime(readyTrustNodes.intExportReady.textContent === "Ready: Active Case",
  "[ui-smoke] Runtime trust panel failed: warning/completed with active case should be export-ready.");
assertRuntime(readyTrustNodes.intExportReady.className.includes("ok"),
  "[ui-smoke] Runtime trust panel failed: export-ready state should map to ok badge.");
assertRuntime(readyTrustNodes.intHash.textContent.includes(":warning:"),
  "[ui-smoke] Runtime trust panel failed: lifecycle hash line should include warning status context.");

const waitingTrustNodes = runTrustPanelProof({
  mode: "ON",
  metrics: {},
  history: [{ id: "wait-job-1", status: "failed", durationMs: 3000, retryCount: 2, failureReason: "network timeout" }]
}, { case_id: "CASE-WAITING" });
assertRuntime(waitingTrustNodes.intExportReady.textContent === "Waiting For Results",
  "[ui-smoke] Runtime trust panel failed: failed/incomplete result should remain waiting, not ready.");
assertRuntime(waitingTrustNodes.intExportReady.className.includes("warn"),
  "[ui-smoke] Runtime trust panel failed: waiting export state should map to warn badge.");
assertRuntime(waitingTrustNodes.intHash.textContent.includes("reason=network timeout"),
  "[ui-smoke] Runtime trust panel failed: hash line should preserve failure reason visibility.");

const blockedTrustNodes = runTrustPanelProof({
  mode: "ON",
  metrics: {},
  history: [{ id: "blocked-job-1", status: "completed", durationMs: 250, retryCount: 0 }]
}, null);
assertRuntime(blockedTrustNodes.intExportReady.textContent === "Blocked: No Active Case",
  "[ui-smoke] Runtime trust panel failed: missing active case must block export.");
assertRuntime(blockedTrustNodes.intExportReady.className.includes("bad"),
  "[ui-smoke] Runtime trust panel failed: blocked export state should map to bad badge.");

async function runRuntimeInteractionProofs() {
  const actionCalls = [];
  const actionStatuses = [];
  let actionSyncCalls = 0;
  const promptQueue = ["Needs analyst escalation", ""];
  const handleQueueAction = compileRuntimeFunction("handleQueueAction", {
    window: {
      electronAPI: {
        automationQueueAction: async (id, action, reason) => {
          actionCalls.push({ id, action, reason });
          return { success: true };
        }
      }
    },
    prompt: () => (promptQueue.length ? promptQueue.shift() : ""),
    setStatus: (message, kind) => actionStatuses.push({ message, kind }),
    syncAutomationState: async () => { actionSyncCalls += 1; }
  });

  await handleQueueAction("job-manual", "manual-review");
  await handleQueueAction("job-manual-default", "manual-review");
  await handleQueueAction("job-pause", "pause");
  await handleQueueAction("job-resume", "resume");
  await handleQueueAction("job-cancel", "cancel");
  await handleQueueAction("job-requeue", "requeue");

  const manualActions = actionCalls.filter((c) => c.action === "manual-review");
  const manualAction = manualActions.find((c) => c.id === "job-manual");
  const manualFallbackAction = manualActions.find((c) => c.id === "job-manual-default");
  const pauseAction = actionCalls.find((c) => c.action === "pause");
  const resumeAction = actionCalls.find((c) => c.action === "resume");
  const cancelAction = actionCalls.find((c) => c.action === "cancel");
  const requeueAction = actionCalls.find((c) => c.action === "requeue");
  assertRuntime(manualAction && manualAction.reason === "Needs analyst escalation",
    "[ui-smoke] Runtime queue action failed: manual-review reason should come from prompt input.");
  assertRuntime(manualFallbackAction && manualFallbackAction.reason === "Requires analyst review for ambiguous decode output.",
    "[ui-smoke] Runtime queue action failed: blank manual-review input should fall back to deterministic default reason.");
  assertRuntime(pauseAction && pauseAction.reason === null,
    "[ui-smoke] Runtime queue action failed: pause should not invent a reason payload.");
  assertRuntime(resumeAction && resumeAction.reason === null,
    "[ui-smoke] Runtime queue action failed: resume should not invent a reason payload.");
  assertRuntime(cancelAction && cancelAction.reason === "Cancelled by operator from queue panel.",
    "[ui-smoke] Runtime queue action failed: cancel should apply deterministic default reason.");
  assertRuntime(requeueAction && requeueAction.reason === "Requeued by operator for retry.",
    "[ui-smoke] Runtime queue action failed: requeue should apply deterministic default reason.");
  assertRuntime(actionSyncCalls === 6, "[ui-smoke] Runtime queue action failed: successful actions should sync automation state.");
  assertRuntime(actionStatuses.filter((s) => s.kind === "ok" && s.message.includes("Queue action applied")).length === 6,
    "[ui-smoke] Runtime queue action failed: successful actions should emit applied status messages.");
  ["manual-review", "pause", "resume", "cancel", "requeue"].forEach((actionName) => {
    assertRuntime(actionStatuses.some((s) => s.kind === "ok" && s.message.includes(`Queue action applied: ${actionName}.`)),
      `[ui-smoke] Runtime queue action failed: missing applied status for ${actionName}.`);
  });

  const failedStatuses = [];
  let failedSyncCalls = 0;
  const handleQueueActionFail = compileRuntimeFunction("handleQueueAction", {
    window: {
      electronAPI: {
        automationQueueAction: async () => ({ success: false })
      }
    },
    prompt: () => "Ignored reason",
    setStatus: (message, kind) => failedStatuses.push({ message, kind }),
    syncAutomationState: async () => { failedSyncCalls += 1; }
  });

  await handleQueueActionFail("job-fail", "cancel");
  assertRuntime(failedStatuses.some((s) => s.kind === "bad" && s.message.includes("Queue action failed: cancel.")),
    "[ui-smoke] Runtime queue action failed: failed actions should emit explicit failure status.");
  assertRuntime(failedSyncCalls === 0, "[ui-smoke] Runtime queue action failed: failed actions must not sync automation state.");

  const reopenCalls = [];
  const reopenStatuses = [];
  let reopenSyncCalls = 0;
  const reopenCaseJob = compileRuntimeFunction("reopenCaseJob", {
    window: {
      electronAPI: {
        automationQueueAction: async (id, action, reason) => {
          reopenCalls.push({ id, action, reason });
          return { success: true };
        }
      }
    },
    setStatus: (message, kind) => reopenStatuses.push({ message, kind }),
    syncAutomationState: async () => { reopenSyncCalls += 1; }
  });

  await reopenCaseJob.call({ activeCase: { case_id: "CASE-REOPEN" } }, "job-reopen-001122334455");
  assertRuntime(reopenCalls.length === 1, "[ui-smoke] Runtime reopen flow failed: expected one reopen queue action call.");
  assertRuntime(reopenCalls[0].action === "requeue", "[ui-smoke] Runtime reopen flow failed: reopen must use requeue action.");
  assertRuntime(reopenCalls[0].reason === "Reopened from case workspace CASE-REOPEN.",
    "[ui-smoke] Runtime reopen flow failed: reopen reason must include active case context.");
  assertRuntime(reopenSyncCalls === 1, "[ui-smoke] Runtime reopen flow failed: successful reopen must sync automation state.");
  assertRuntime(reopenStatuses.some((s) => s.kind === "ok" && s.message.includes("Reopened case-linked job")),
    "[ui-smoke] Runtime reopen flow failed: successful reopen must emit operator success status.");

  const reopenUnavailableStatuses = [];
  let reopenUnavailableSyncCalls = 0;
  const reopenCaseJobUnavailable = compileRuntimeFunction("reopenCaseJob", {
    window: {},
    setStatus: (message, kind) => reopenUnavailableStatuses.push({ message, kind }),
    syncAutomationState: async () => { reopenUnavailableSyncCalls += 1; }
  });
  await reopenCaseJobUnavailable.call({ activeCase: { case_id: "CASE-REOPEN" } }, "job-reopen-unavailable");
  assertRuntime(reopenUnavailableStatuses.some((s) => s.kind === "bad" && s.message.includes("Reopen failed: automation queue bridge unavailable.")),
    "[ui-smoke] Runtime reopen flow failed: bridge-unavailable path must emit explicit failure status.");
  assertRuntime(reopenUnavailableSyncCalls === 0,
    "[ui-smoke] Runtime reopen flow failed: bridge-unavailable path must not sync automation state.");

  const reopenFailedStatuses = [];
  let reopenFailedSyncCalls = 0;
  const reopenCaseJobFail = compileRuntimeFunction("reopenCaseJob", {
    window: {
      electronAPI: {
        automationQueueAction: async () => ({ success: false })
      }
    },
    setStatus: (message, kind) => reopenFailedStatuses.push({ message, kind }),
    syncAutomationState: async () => { reopenFailedSyncCalls += 1; }
  });
  await reopenCaseJobFail.call({ activeCase: { case_id: "CASE-REOPEN" } }, "job-reopen-fail-001122");
  assertRuntime(reopenFailedStatuses.some((s) => s.kind === "bad" && s.message.includes("Reopen failed for job")),
    "[ui-smoke] Runtime reopen flow failed: failed reopen action must emit explicit failure status.");
  assertRuntime(reopenFailedSyncCalls === 0,
    "[ui-smoke] Runtime reopen flow failed: failed reopen action must not sync automation state.");

  const openStatuses = [];
  let openTabCalls = 0;
  const openState = { lastAutomation: { queue: [] }, lastCaseWorkspaceReport: null };
  const openEls = {
    reportTextarea: { value: "" },
    tabBtnAutomation: { id: "tabBtnAutomation" }
  };
  const openCaseReportFromContext = compileRuntimeFunction("openCaseReportFromContext", {
    state: openState,
    el: (id) => openEls[id] || null,
    activateTab: (tab) => { if (tab === openEls.tabBtnAutomation) openTabCalls += 1; },
    setStatus: (message, kind) => openStatuses.push({ message, kind })
  });

  const caseReportPayload = { markdown: "## Case Report Runtime", queueResultsSummary: {} };
  await openCaseReportFromContext.call({
    activeCase: { case_id: "CASE-REPORT-OPEN" },
    buildCaseWorkspaceReport: () => caseReportPayload
  });
  assertRuntime(openState.lastCaseWorkspaceReport === caseReportPayload,
    "[ui-smoke] Runtime case-report open failed: report payload must be cached on state.");
  assertRuntime(openEls.reportTextarea.value === "## Case Report Runtime",
    "[ui-smoke] Runtime case-report open failed: report textarea must receive markdown payload.");
  assertRuntime(openTabCalls === 1,
    "[ui-smoke] Runtime case-report open failed: automation tab should activate after report load.");
  assertRuntime(openStatuses.some((s) => s.kind === "ok" && s.message.includes("Case report loaded for CASE-REPORT-OPEN.")),
    "[ui-smoke] Runtime case-report open failed: success status should include active case id.");

  const openBlockedStatuses = [];
  const openCaseReportBlocked = compileRuntimeFunction("openCaseReportFromContext", {
    state: { lastAutomation: {}, lastCaseWorkspaceReport: null },
    el: () => null,
    activateTab: () => null,
    setStatus: (message, kind) => openBlockedStatuses.push({ message, kind })
  });
  await openCaseReportBlocked.call({
    activeCase: null,
    buildCaseWorkspaceReport: () => ({ markdown: "should-not-run" })
  });
  assertRuntime(openBlockedStatuses.some((s) => s.kind === "warn" && s.message.includes("Case report launch blocked: no active case.")),
    "[ui-smoke] Runtime case-report open failed: blocked path must emit no-active-case warning.");

  const exportDownloads = [];
  const exportStatuses = [];
  const exportState = { lastAutomation: { queue: [] }, lastCaseWorkspaceReport: null };
  const exportCaseReportFromContext = compileRuntimeFunction("exportCaseReportFromContext", {
    state: exportState,
    downloadFile: (content, name, type) => exportDownloads.push({ content, name, type }),
    setStatus: (message, kind) => exportStatuses.push({ message, kind })
  });

  const exportPayload = { markdown: "## Export Runtime Report", queueResultsSummary: { completed: 1 } };
  await exportCaseReportFromContext.call({
    activeCase: { case_id: "CASE-REPORT-EXPORT" },
    buildCaseWorkspaceReport: () => exportPayload
  });
  assertRuntime(exportDownloads.length === 2,
    "[ui-smoke] Runtime case-report export failed: expected deterministic MD + JSON downloads.");
  const mdDownload = exportDownloads.find((d) => d.type === "text/markdown");
  const jsonDownload = exportDownloads.find((d) => d.type === "application/json");
  assertRuntime(Boolean(mdDownload), "[ui-smoke] Runtime case-report export failed: missing markdown download.");
  assertRuntime(Boolean(jsonDownload), "[ui-smoke] Runtime case-report export failed: missing JSON download.");
  assertRuntime(/^CASE-REPORT-EXPORT_workspace_report_/.test(mdDownload.name) && mdDownload.name.endsWith(".md"),
    "[ui-smoke] Runtime case-report export failed: markdown filename must include case id and report suffix.");
  assertRuntime(/^CASE-REPORT-EXPORT_workspace_report_/.test(jsonDownload.name) && jsonDownload.name.endsWith(".json"),
    "[ui-smoke] Runtime case-report export failed: JSON filename must include case id and report suffix.");
  const parsedJson = JSON.parse(jsonDownload.content);
  assertRuntime(parsedJson.markdown === "## Export Runtime Report",
    "[ui-smoke] Runtime case-report export failed: JSON payload should preserve report markdown content.");
  assertRuntime(exportState.lastCaseWorkspaceReport === exportPayload,
    "[ui-smoke] Runtime case-report export failed: exported report payload must be cached on state.");
  assertRuntime(exportStatuses.some((s) => s.kind === "ok" && s.message.includes("Case report exported for CASE-REPORT-EXPORT (MD + JSON).")),
    "[ui-smoke] Runtime case-report export failed: success status should include active case id.");

  const exportBlockedDownloads = [];
  const exportBlockedStatuses = [];
  const exportCaseReportBlocked = compileRuntimeFunction("exportCaseReportFromContext", {
    state: { lastAutomation: {}, lastCaseWorkspaceReport: null },
    downloadFile: (content, name, type) => exportBlockedDownloads.push({ content, name, type }),
    setStatus: (message, kind) => exportBlockedStatuses.push({ message, kind })
  });
  await exportCaseReportBlocked.call({
    activeCase: null,
    buildCaseWorkspaceReport: () => ({ markdown: "should-not-export" })
  });
  assertRuntime(exportBlockedDownloads.length === 0,
    "[ui-smoke] Runtime case-report export failed: blocked no-active-case path must not emit downloads.");
  assertRuntime(exportBlockedStatuses.some((s) => s.kind === "warn" && s.message.includes("Case report export blocked: no active case.")),
    "[ui-smoke] Runtime case-report export failed: blocked path must emit explicit no-active-case warning.");
}

runRuntimeInteractionProofs()
  .then(() => {
    console.log("[ui-smoke] PASS: core operator UI shell and critical IDs are present.");
  })
  .catch((error) => {
    fail(`[ui-smoke] Runtime interaction proof failed: ${error.message}`);
  });
