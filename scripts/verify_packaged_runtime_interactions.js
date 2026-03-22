"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractFunctionSource(sourceText, name) {
  const asyncMarker = `async function ${name}(`;
  const plainMarker = `function ${name}(`;
  let start = sourceText.indexOf(asyncMarker);
  if (start === -1) {
    start = sourceText.indexOf(plainMarker);
  }
  if (start === -1) {
    const escaped = escapeRegex(name);
    const methodPattern = new RegExp(`(?:^|\\n)\\s*(?:async\\s+)?${escaped}\\s*\\(`, "m");
    const methodMatch = methodPattern.exec(sourceText);
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
    throw new Error(`Missing packaged function source: ${name}`);
  }

  const braceStart = sourceText.indexOf("{", start);
  if (braceStart === -1) {
    throw new Error(`Malformed packaged function source: ${name}`);
  }

  let depth = 0;
  for (let i = braceStart; i < sourceText.length; i += 1) {
    const ch = sourceText[i];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) {
      return sourceText.slice(start, i + 1);
    }
  }

  throw new Error(`Unterminated packaged function source: ${name}`);
}

function compileRuntimeFunction(sourceText, name, sandbox = {}) {
  const source = extractFunctionSource(sourceText, name);
  const escaped = escapeRegex(name);
  let normalizedSource = source;
  if (!source.startsWith(`async function ${name}(`) && !source.startsWith(`function ${name}(`)) {
    normalizedSource = source
      .replace(new RegExp(`^async\\s+${escaped}\\s*\\(`), `async function ${name}(`)
      .replace(new RegExp(`^${escaped}\\s*\\(`), `function ${name}(`);
  }

  const context = vm.createContext({ ...sandbox });
  const fn = vm.runInContext(`(${normalizedSource})`, context, { timeout: 1500 });
  if (typeof fn !== "function") {
    throw new Error(`Packaged runtime compile did not return function: ${name}`);
  }
  return fn;
}

function assertRuntime(condition, message, tracker) {
  if (!condition) {
    throw new Error(message);
  }
  tracker.assertions += 1;
}

async function verifyPackagedRuntimeInteractions(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const expectedVersion = options.expectedVersion;
  const asarPath = options.asarPath || path.join(projectRoot, "dist", "win-unpacked", "resources", "app.asar");
  if (!expectedVersion) {
    throw new Error("Missing expected package version for packaged runtime interaction proof.");
  }
  if (!fs.existsSync(asarPath)) {
    throw new Error(`Missing packaged artifact for runtime interaction proof: ${asarPath}`);
  }

  const sourceText = fs.readFileSync(asarPath).toString("utf8");
  const versionMarker = `APP_VERSION_FALLBACK = "${expectedVersion}"`;
  if (!sourceText.includes(versionMarker)) {
    throw new Error(`Packaged runtime version marker not found: ${versionMarker}`);
  }

  const tracker = { assertions: 0 };

  // Queue action semantics from packaged runtime source.
  const actionCalls = [];
  const actionStatuses = [];
  let actionSyncCalls = 0;
  const promptQueue = ["Needs analyst escalation", ""];
  const handleQueueAction = compileRuntimeFunction(sourceText, "handleQueueAction", {
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
    syncAutomationState: async () => {
      actionSyncCalls += 1;
    }
  });

  await handleQueueAction("job-manual", "manual-review");
  await handleQueueAction("job-manual-default", "manual-review");
  await handleQueueAction("job-pause", "pause");
  await handleQueueAction("job-resume", "resume");
  await handleQueueAction("job-cancel", "cancel");
  await handleQueueAction("job-requeue", "requeue");

  const manualAction = actionCalls.find((c) => c.id === "job-manual");
  const manualDefaultAction = actionCalls.find((c) => c.id === "job-manual-default");
  const cancelAction = actionCalls.find((c) => c.action === "cancel");
  const requeueAction = actionCalls.find((c) => c.action === "requeue");
  assertRuntime(
    manualAction && manualAction.reason === "Needs analyst escalation",
    "Packaged queue action proof failed: manual-review prompt reason not preserved.",
    tracker
  );
  assertRuntime(
    manualDefaultAction && manualDefaultAction.reason === "Requires analyst review for ambiguous decode output.",
    "Packaged queue action proof failed: manual-review fallback reason missing.",
    tracker
  );
  assertRuntime(
    cancelAction && cancelAction.reason === "Cancelled by operator from queue panel.",
    "Packaged queue action proof failed: cancel reason contract missing.",
    tracker
  );
  assertRuntime(
    requeueAction && requeueAction.reason === "Requeued by operator for retry.",
    "Packaged queue action proof failed: requeue reason contract missing.",
    tracker
  );
  assertRuntime(
    actionSyncCalls === 6,
    "Packaged queue action proof failed: success path must sync automation state.",
    tracker
  );
  assertRuntime(
    actionStatuses.filter((s) => s.kind === "ok" && s.message.includes("Queue action applied")).length === 6,
    "Packaged queue action proof failed: success status tokens are incomplete.",
    tracker
  );

  const failedStatuses = [];
  let failedSyncCalls = 0;
  const handleQueueActionFail = compileRuntimeFunction(sourceText, "handleQueueAction", {
    window: {
      electronAPI: {
        automationQueueAction: async () => ({ success: false })
      }
    },
    prompt: () => "ignored",
    setStatus: (message, kind) => failedStatuses.push({ message, kind }),
    syncAutomationState: async () => {
      failedSyncCalls += 1;
    }
  });
  await handleQueueActionFail("job-fail", "cancel");
  assertRuntime(
    failedStatuses.some((s) => s.kind === "bad" && s.message.includes("Queue action failed: cancel.")),
    "Packaged queue action proof failed: explicit failure status missing.",
    tracker
  );
  assertRuntime(
    failedSyncCalls === 0,
    "Packaged queue action proof failed: failed actions must not sync state.",
    tracker
  );

  // Reopen semantics from packaged runtime source.
  const reopenCalls = [];
  const reopenStatuses = [];
  let reopenSyncCalls = 0;
  const reopenCaseJob = compileRuntimeFunction(sourceText, "reopenCaseJob", {
    window: {
      electronAPI: {
        automationQueueAction: async (id, action, reason) => {
          reopenCalls.push({ id, action, reason });
          return { success: true };
        }
      }
    },
    setStatus: (message, kind) => reopenStatuses.push({ message, kind }),
    syncAutomationState: async () => {
      reopenSyncCalls += 1;
    }
  });
  await reopenCaseJob.call({ activeCase: { case_id: "CASE-REOPEN" } }, "job-reopen-1234567890");
  assertRuntime(
    reopenCalls.length === 1 && reopenCalls[0].action === "requeue",
    "Packaged reopen proof failed: reopen must emit queue requeue action.",
    tracker
  );
  assertRuntime(
    reopenCalls[0].reason === "Reopened from case workspace CASE-REOPEN.",
    "Packaged reopen proof failed: reopen reason chain not preserved.",
    tracker
  );
  assertRuntime(
    reopenSyncCalls === 1 && reopenStatuses.some((s) => s.kind === "ok"),
    "Packaged reopen proof failed: success status/sync contract missing.",
    tracker
  );

  // Case report open/export semantics from packaged runtime source.
  const openStatuses = [];
  let openTabCalls = 0;
  const openState = { lastAutomation: { queue: [] }, lastCaseWorkspaceReport: null };
  const openEls = {
    reportTextarea: { value: "" },
    tabBtnAutomation: { id: "tabBtnAutomation" }
  };
  const openCaseReportFromContext = compileRuntimeFunction(sourceText, "openCaseReportFromContext", {
    state: openState,
    el: (id) => openEls[id] || null,
    activateTab: (tab) => {
      if (tab === openEls.tabBtnAutomation) {
        openTabCalls += 1;
      }
    },
    setStatus: (message, kind) => openStatuses.push({ message, kind })
  });
  const reportPayload = { markdown: "## Packaged Runtime Report" };
  await openCaseReportFromContext.call({
    activeCase: { case_id: "CASE-OPEN" },
    buildCaseWorkspaceReport: () => reportPayload
  });
  assertRuntime(
    openState.lastCaseWorkspaceReport === reportPayload && openEls.reportTextarea.value === reportPayload.markdown,
    "Packaged case-report open proof failed: report payload not projected to runtime state/UI output.",
    tracker
  );
  assertRuntime(
    openTabCalls === 1 && openStatuses.some((s) => s.kind === "ok" && s.message.includes("CASE-OPEN")),
    "Packaged case-report open proof failed: activation/status semantics missing.",
    tracker
  );

  const openBlockedStatuses = [];
  const openCaseReportBlocked = compileRuntimeFunction(sourceText, "openCaseReportFromContext", {
    state: { lastAutomation: {}, lastCaseWorkspaceReport: null },
    el: () => null,
    activateTab: () => null,
    setStatus: (message, kind) => openBlockedStatuses.push({ message, kind })
  });
  await openCaseReportBlocked.call({
    activeCase: null,
    buildCaseWorkspaceReport: () => ({ markdown: "should-not-open" })
  });
  assertRuntime(
    openBlockedStatuses.some((s) => s.kind === "warn" && s.message.includes("Case report launch blocked: no active case.")),
    "Packaged case-report open proof failed: blocked-state warning missing.",
    tracker
  );

  const exportDownloads = [];
  const exportStatuses = [];
  const exportState = { lastAutomation: { queue: [] }, lastCaseWorkspaceReport: null };
  const exportCaseReportFromContext = compileRuntimeFunction(sourceText, "exportCaseReportFromContext", {
    state: exportState,
    downloadFile: (content, name, type) => exportDownloads.push({ content, name, type }),
    setStatus: (message, kind) => exportStatuses.push({ message, kind })
  });
  const exportPayload = { markdown: "## Packaged Export Runtime", queueResultsSummary: { completed: 1 } };
  await exportCaseReportFromContext.call({
    activeCase: { case_id: "CASE-EXPORT" },
    buildCaseWorkspaceReport: () => exportPayload
  });
  const markdownExport = exportDownloads.find((d) => d.type === "text/markdown");
  const jsonExport = exportDownloads.find((d) => d.type === "application/json");
  assertRuntime(
    exportDownloads.length === 2 && markdownExport && jsonExport,
    "Packaged case-report export proof failed: deterministic MD+JSON export set missing.",
    tracker
  );
  assertRuntime(
    /^CASE-EXPORT_workspace_report_/.test(markdownExport.name) && markdownExport.name.endsWith(".md"),
    "Packaged case-report export proof failed: markdown filename contract missing case-context prefix.",
    tracker
  );
  assertRuntime(
    /^CASE-EXPORT_workspace_report_/.test(jsonExport.name) && jsonExport.name.endsWith(".json"),
    "Packaged case-report export proof failed: JSON filename contract missing case-context prefix.",
    tracker
  );
  assertRuntime(
    exportStatuses.some((s) => s.kind === "ok" && s.message.includes("Case report exported for CASE-EXPORT")),
    "Packaged case-report export proof failed: success status token missing.",
    tracker
  );

  const exportBlockedDownloads = [];
  const exportBlockedStatuses = [];
  const exportCaseReportBlocked = compileRuntimeFunction(sourceText, "exportCaseReportFromContext", {
    state: { lastAutomation: {}, lastCaseWorkspaceReport: null },
    downloadFile: (...args) => exportBlockedDownloads.push(args),
    setStatus: (message, kind) => exportBlockedStatuses.push({ message, kind })
  });
  await exportCaseReportBlocked.call({
    activeCase: null,
    buildCaseWorkspaceReport: () => ({ markdown: "should-not-export" })
  });
  assertRuntime(
    exportBlockedDownloads.length === 0,
    "Packaged case-report export proof failed: blocked path must not produce downloads.",
    tracker
  );
  assertRuntime(
    exportBlockedStatuses.some((s) => s.kind === "warn" && s.message.includes("Case report export blocked: no active case.")),
    "Packaged case-report export proof failed: blocked-state warning missing.",
    tracker
  );

  return {
    asarPath,
    expectedVersion,
    assertions: tracker.assertions,
    validatedFunctions: [
      "handleQueueAction",
      "reopenCaseJob",
      "openCaseReportFromContext",
      "exportCaseReportFromContext"
    ]
  };
}

if (require.main === module) {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
  verifyPackagedRuntimeInteractions({ expectedVersion: pkg.version })
    .then((result) => {
      console.log("[packaged-runtime-proof] PASS");
      console.log(JSON.stringify({
        asarPath: result.asarPath,
        expectedVersion: result.expectedVersion,
        assertions: result.assertions,
        validatedFunctions: result.validatedFunctions
      }, null, 2));
    })
    .catch((error) => {
      console.error(`[packaged-runtime-proof] FAIL: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  verifyPackagedRuntimeInteractions
};
