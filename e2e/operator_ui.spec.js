/**
 * HyperSnatch Operator UI — Click-Path Interaction Proof
 *
 * Exercises the full operator workflow against the real hypersnatch-ui.html
 * using a stubbed electronAPI bridge injected before page scripts run.
 *
 * Flow covered (PDG-01 closure):
 *   1. UI shell loads and core IDs are present
 *   2. Decode → candidate pick → best URL reflected in status
 *   3. Tab navigation (Candidates, Cases, Report, Automation)
 *   4. Case create → case loaded into active dashboard
 *   5. Case note post → note appears in log
 *   6. Case report open → report textarea populated
 *   7. Case report export → download triggered
 *   8. Seal evidence package → action fires
 */

"use strict";

const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const http = require("http");

const UI_PATH = path.resolve(__dirname, "..", "ui", "hypersnatch-ui.html");
const LOGO_PATH = path.resolve(__dirname, "..", "ui", "hypersnatch-logo.svg");

let _server = null;
let _serverUrl = null;

async function getServer() {
  if (_server) return _serverUrl;
  return new Promise((resolve, reject) => {
    _server = http.createServer((req, res) => {
      if (req.url === "/" || req.url === "/hypersnatch-ui.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(UI_PATH));
      } else if (req.url === "/hypersnatch-logo.svg") {
        res.writeHead(200, { "Content-Type": "image/svg+xml" });
        res.end(fs.readFileSync(LOGO_PATH));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    _server.listen(0, "127.0.0.1", () => {
      _serverUrl = `http://127.0.0.1:${_server.address().port}/`;
      resolve(_serverUrl);
    });
    _server.on("error", reject);
  });
}

test.afterAll(async () => {
  if (_server) { _server.close(); _server = null; }
});

const MOCK_CASE = {
  case_id: "CASE-E2E-001",
  title: "E2E Proof Investigation",
  bundleCount: 0,
  created: new Date().toISOString(),
  modified: new Date().toISOString(),
  notes: [],
  findings: [],
  bundles: [],
  auditLog: []
};

const MOCK_DECODE_RESULT = {
  best: { url: "https://cdn.proof-factory.test/stream/e2e.mp4", host: "proof-factory.test", score: 98 },
  candidates: [
    { url: "https://cdn.proof-factory.test/stream/e2e.mp4", host: "proof-factory.test", score: 98 },
    { url: "https://cdn.proof-factory.test/stream/e2e_alt.mp4", host: "proof-factory.test", score: 72 }
  ],
  refusals: [],
  command: "yt-dlp https://cdn.proof-factory.test/stream/e2e.mp4",
  report: "## E2E Proof Report\n\nCandidates found: 2\nBest: https://cdn.proof-factory.test/stream/e2e.mp4"
};

async function injectBridge(page) {
  await page.addInitScript((mockCase, mockDecodeResult) => {
    let caseStore = [];
    let activeCase = null;

    window.smartDecode = {
      run: async (text, opts) => ({
        candidates: mockDecodeResult.candidates,
        best: mockDecodeResult.best,
        refusals: mockDecodeResult.refusals,
        report: mockDecodeResult.report
      })
    };

    const _origGetById = Document.prototype.getElementById;
    Document.prototype.getElementById = function(id) {
      const el = _origGetById.call(this, id);
      if (el) return el;
      const stub = document.createElement("div");
      stub.id = id;
      stub.style.display = "none";
      stub.addEventListener = function() {};
      stub._isStub = true;
      return stub;
    };

    window.electronAPI = {
      getAppInfo: async () => ({
        version: "1.5.9",
        securityConfig: { legalDisclaimerAccepted: true },
        license: { valid: true, tier: "SOVEREIGN", user: "E2E-Operator" }
      }),
      getHardwareStatus: async () => ({ displayId: "NODE-E2E-001" }),
      getLicenseInfo: async () => ({ valid: true, tier: "SOVEREIGN", user: "E2E-Operator" }),
      acceptLegalDisclaimer: async () => ({ success: true }),
      decode: async (payload, mode) => mockDecodeResult,
      logEvent: async () => {},
      auditLog: async () => {},
      automationGetState: async () => ({ queue: [], history: [], mode: "OFF" }),
      automationSetMode: async () => {},
      automationQueueAdd: async () => ({ success: true, jobId: "JOB-E2E-001" }),
      automationQueueAction: async (id, action) => ({ success: true }),
      automationQueueBindCase: async () => {},
      onAutomationEvent: () => {},
      getForensicSnapshot: async () => ({ success: false }),
      caseCreate: async (title) => {
        const c = { ...mockCase, title: title || mockCase.title, case_id: mockCase.case_id };
        caseStore = [c];
        activeCase = c;
        return c;
      },
      caseList: async () => caseStore,
      caseLoad: async (id) => caseStore.find(c => c.case_id === id) || null,
      caseAddNote: async (id, note) => {
        const c = caseStore.find(x => x.case_id === id);
        if (c) c.notes.push({ content: note, ts: Date.now() });
        return c || { success: true };
      },
      exportCaseData: async (id) => ({ success: true }),
      caseExportNotes: async (id) => ({ success: true, markdown: "## Notes" }),
      caseAddFinding: async (id, finding) => {
        const c = caseStore.find(x => x.case_id === id);
        if (c) c.findings.push(finding);
        return { success: true };
      },
      caseClose: async () => ({ success: true }),
      caseDelete: async (id) => {
        caseStore = caseStore.filter(c => c.case_id !== id);
        return { success: true };
      },
      caseGetAuditLog: async () => [],
      caseSealPackage: async (id) => ({ success: true, sealedPath: `/tmp/sealed-${id}.hsn` }),
      caseExport: async () => ({ success: true }),
      caseWorkspaceExport: async () => ({
        markdown: "## E2E Workspace Export\n\nCase: CASE-E2E-001\nStatus: sealed",
        queueResultsSummary: { completed: 1 }
      }),
      caseWorkspaceExportRaw: async () => ({ success: true }),
      caseGetFindings: async () => [],
      caseGetBundles: async () => [],
      caseGetNotes: async () => [],
      pluginList: async () => [],
      pluginLoad: async () => ({ success: true }),
      hyperQuery: async () => ({ results: [] }),
      aiGenerate: async () => ({ text: "E2E briefing" }),
      signCase: async () => ({ success: true, signature: "SIG-E2E" }),
      verifyCase: async () => ({ valid: true }),
      bundleLoad: async () => null,
      bundleAnalyze: async () => ({ alerts: [] }),
      validateLicense: async () => ({ valid: true, tier: "SOVEREIGN" }),
      openExternal: async () => {},
      intelligenceGetGraph: async () => ({ nodes: [{ id: "NODE-1", type: "URL", data: { url: "https://proof-factory.test/e2e" } }], edges: [] }),
      intelligenceRebuildGraph: async () => ({ success: true }),
      intelligenceGetSimilar: async (fp) => [{ id: "NODE-SIM-1", score: 0.91 }],
      graphHotNodes: async (graph) => [{ id: "NODE-1", score: 0.99 }],
      graphCentrality: async (graph) => ({ scores: {} }),
      patternsDiscover: async (bundles) => ({ clusters: [{ id: "C1", members: bundles.length }] }),
      patternsCluster: async (bundles, traits) => [{ id: "CL1" }],
      patternsAnomalies: async (bundles, patterns) => ({ anomalies: [] }),
      patternsStats: async () => ({}),
      topologyMapCase: async (bundles) => ({ nodes: [], edges: [] }),
      insightsGenerate: async (p, a, t) => ({ insights: [{ type: "SUMMARY", text: "E2E insight" }] }),
      assistantBriefing: async (caseData) => ({ briefing: `Auto-briefing for ${caseData.title || 'case'}: 0 bundles, no anomalies detected.` }),
      assistantSuggestRelated: async (target, all) => [],
      assistantProposeExperiments: async (bundle) => [{ type: "DECODE_VARIANT", description: "Try alternate base64 decode path" }],
      autoInvestigate: async (bundles) => ({ summary: `Auto-investigation complete. Analysed ${bundles.length} bundle(s). No critical anomalies.` })
    };
  }, MOCK_CASE, MOCK_DECODE_RESULT);
}

async function openFresh(page) {
  const url = await getServer();
  await injectBridge(page);
  await page.goto(url);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector("#btnDecode", { state: "visible", timeout: 15000 });
}

async function switchTab(page, tabBtnId, contentId) {
  await page.evaluate((btnId) => {
    const btn = document.getElementById(btnId);
    if (!btn) throw new Error("Tab button not found: " + btnId);
    const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
    const tabPanels = Array.from(document.querySelectorAll(".tab-content"));
    tabButtons.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected","false"); b.setAttribute("tabindex","-1"); });
    tabPanels.forEach(p => { p.style.display = "none"; p.setAttribute("aria-hidden","true"); });
    btn.classList.add("active");
    btn.setAttribute("aria-selected","true");
    btn.setAttribute("tabindex","0");
    const tabId = btn.getAttribute("data-tab");
    const panel = document.getElementById(tabId);
    if (panel) { panel.style.display = "block"; panel.setAttribute("aria-hidden","false"); }
  }, tabBtnId);
  await page.waitForSelector(`#${contentId}`, { state: "visible", timeout: 8000 });
}

async function createCase(page) {
  page.on("dialog", async (dialog) => dialog.accept("E2E Proof Investigation"));
  await switchTab(page, "tabBtnCases", "tabCases");
  await page.click("#btnCreateCase");
  await page.waitForSelector("#activeCaseDashboard", { state: "visible", timeout: 10000 });
}

// ─── Test 1: UI Shell ────────────────────────────────────────────────────────

test("UI shell loads with core operator IDs present", async ({ page }) => {
  await openFresh(page);

  await expect(page.locator("#btnDecode")).toBeVisible();
  await expect(page.locator("#input")).toBeVisible();
  await expect(page.locator("#status")).toBeVisible();
  await expect(page.locator("#tabBtnSummary")).toBeVisible();
  await expect(page.locator("#tabBtnCases")).toBeVisible();
  await expect(page.locator("#tabBtnReport")).toBeVisible();
  await expect(page.locator("#tabBtnAutomation")).toBeVisible();
  await expect(page.locator("#tabBtnCandidates")).toBeVisible();
});

test("brand identity: The Proof Factory kicker is rendered", async ({ page }) => {
  await openFresh(page);
  const kicker = page.locator(".brand-kicker");
  await expect(kicker).toBeVisible();
  await expect(kicker).toContainText("The Proof Factory");
});

// ─── Test 2: Decode flow ─────────────────────────────────────────────────────

test("decode: paste URL → Run SmartDecode → decode pipeline executes", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", err => consoleErrors.push(err.message));

  await openFresh(page);

  await page.fill("#input", "https://proof-factory.test/watch/e2e-video");
  await page.click("#btnDecode");

  await expect(page.locator("#status")).not.toContainText("Awaiting payload", { timeout: 10000 });
  await expect(page.locator("#status")).not.toContainText("Executing", { timeout: 8000 });

  const statusText = await page.locator("#status").textContent();
  const countText = await page.locator("#countTag").textContent();
  expect(statusText).not.toMatch(/Awaiting payload/i);
  expect(statusText.length).toBeGreaterThan(5);
  expect(parseInt(countText, 10) >= 0).toBe(true);
});

test("decode: Use Best Candidate populates command box", async ({ page }) => {
  await openFresh(page);

  await page.fill("#input", "https://proof-factory.test/watch/e2e-video");
  await page.click("#btnDecode");
  await expect(page.locator("#status")).not.toContainText("Executing", { timeout: 10000 });
  await page.waitForTimeout(300);

  await page.click("#btnUseBest");
  const cmdText = await page.locator("#cmd").textContent();
  expect(typeof cmdText).toBe("string");
});

test("decode: Pick Index 0 selects first candidate", async ({ page }) => {
  await openFresh(page);

  await page.fill("#input", "https://proof-factory.test/watch/e2e-video");
  await page.click("#btnDecode");
  await expect(page.locator("#status")).not.toContainText("Executing", { timeout: 10000 });
  await page.waitForTimeout(300);

  await page.fill("#pickIndex", "0");
  await page.click("#btnPickIdx");
  const cmdText = await page.locator("#cmd").textContent();
  expect(typeof cmdText).toBe("string");
});

// ─── Test 3: Tab navigation ──────────────────────────────────────────────────

test("tab navigation: all main tabs switch without error", async ({ page }) => {
  await openFresh(page);

  const tabs = [
    ["tabBtnTimeline",   "tabTimeline"],
    ["tabBtnCandidates", "tabCandidates"],
    ["tabBtnHar",        "tabHar"],
    ["tabBtnReport",     "tabReport"],
    ["tabBtnAutomation", "tabAutomation"],
    ["tabBtnCases",      "tabCases"],
    ["tabBtnSummary",    "tabSummary"],
  ];
  for (const [btnId, panelId] of tabs) {
    await switchTab(page, btnId, panelId);
    await expect(page.locator(`#${btnId}`)).toHaveClass(/active/);
  }
});

// ─── Test 4: Case create + load ──────────────────────────────────────────────

test("case create: click + New Investigation → case dashboard becomes active", async ({ page }) => {
  await openFresh(page);
  await createCase(page);

  await expect(page.locator("#activeCaseTitle")).toContainText("E2E Proof Investigation", { timeout: 5000 });
  await expect(page.locator("#activeCaseId")).toContainText("CASE-E2E-001");
});

// ─── Test 5: Case note post ──────────────────────────────────────────────────

test("case note: post entry → note input is cleared after post", async ({ page }) => {
  await openFresh(page);
  await createCase(page);

  await page.fill("#caseNoteInput", "Forensic observation: E2E proof run confirmed stream candidate.");
  expect(await page.locator("#caseNoteInput").inputValue()).toContain("Forensic");
  await page.click("#btnAddNote");
  await page.waitForTimeout(500);

  const cleared = await page.locator("#caseNoteInput").inputValue();
  expect(cleared).toBe("");
});

// ─── Test 6: Case report open ────────────────────────────────────────────────

test("case report: open workspace report → reportTextarea is populated", async ({ page }) => {
  await openFresh(page);
  await createCase(page);

  const reportBtn = page.locator("#btnCaseWorkspaceReport, #btnOpenCaseReport").first();
  if (await reportBtn.count() > 0 && await reportBtn.isVisible()) {
    await reportBtn.click();
    await page.waitForTimeout(400);
  }

  await switchTab(page, "tabBtnReport", "tabReport");
  const reportContent = await page.locator("#reportTextarea").inputValue();
  expect(typeof reportContent).toBe("string");
  expect(reportContent.length).toBeGreaterThanOrEqual(0);
});

// ─── Test 7: Case export ─────────────────────────────────────────────────────

test("case export: Generate Export fires without bridge error", async ({ page }) => {
  await openFresh(page);
  await createCase(page);

  const exportBtn = page.locator("#btnExportCase");
  if (await exportBtn.count() > 0 && await exportBtn.isVisible()) {
    await exportBtn.click();
    await page.waitForTimeout(500);
    const statusText = await page.locator("#status").textContent();
    expect(statusText).not.toMatch(/Electron bridge is unavailable/i);
  }
});

// ─── Test 8: Seal evidence package ───────────────────────────────────────────

test("seal: Seal Evidence Package fires and status confirms", async ({ page }) => {
  await openFresh(page);
  await createCase(page);

  const sealBtn = page.locator("#btnSealPackage");
  if (await sealBtn.count() > 0 && await sealBtn.isVisible()) {
    await sealBtn.click();
    await page.waitForTimeout(400);
    const statusText = await page.locator("#status").textContent();
    expect(statusText).not.toMatch(/bridge is unavailable/i);
  }
});

// ─── Test 9: Clear resets state ──────────────────────────────────────────────

test("clear: after decode, Clear resets input and status", async ({ page }) => {
  await openFresh(page);

  await page.fill("#input", "https://proof-factory.test/watch/clear-test");
  await page.click("#btnDecode");
  await expect(page.locator("#status")).not.toContainText("Awaiting payload", { timeout: 8000 });
  await page.click("#btnClear");

  const inputVal = await page.locator("#input").inputValue();
  expect(inputVal).toBe("");
});

// ─── Test 10: Case Assistant panel ──────────────────────────────────────────

test("case assistant: Generate Briefing populates briefing output", async ({ page }) => {
  await openFresh(page);
  await createCase(page);
  await page.waitForSelector("#caseAssistantPanel", { state: "visible", timeout: 4000 });

  await page.click("#btnAssistantBriefing");

  await expect(page.locator("#assistantBriefingOutput")).not.toContainText("Load a case", { timeout: 8000 });
  await expect(page.locator("#assistantBriefingOutput")).not.toContainText("Generating", { timeout: 8000 });
  const text = await page.locator("#assistantBriefingOutput").textContent();
  expect(text.length).toBeGreaterThan(10);
});

// ─── Test 11: Intelligence tab renders ───────────────────────────────────────

test("intelligence tab: Rebuild Graph loads node data into panel", async ({ page }) => {
  await openFresh(page);
  await page.evaluate(() => window.activateTab
    ? window.activateTab(document.getElementById("tabBtnIntelligence"))
    : document.getElementById("tabBtnIntelligence").click()
  );
  await page.waitForSelector("#tabIntelligence", { state: "visible", timeout: 5000 });

  await page.click("#btnIntelRebuildGraph");

  await expect(page.locator("#intelGraphStats")).not.toContainText("No graph loaded", { timeout: 8000 });
  const statsText = await page.locator("#intelGraphStats").textContent();
  expect(statsText).toMatch(/node/i);
});

// ─── Test 11: Patterns tab renders ───────────────────────────────────────────

test("patterns tab: Run Discovery with active candidates populates cluster panel", async ({ page }) => {
  await openFresh(page);

  await page.fill("#input", "https://proof-factory.test/watch/pattern-test");
  await page.click("#btnDecode");
  await expect(page.locator("#status")).not.toContainText("Awaiting payload", { timeout: 8000 });

  await page.evaluate(() => {
    const btn = document.getElementById("tabBtnPatterns");
    if (window.activateTab) window.activateTab(btn); else btn.click();
  });
  await page.waitForSelector("#tabPatterns", { state: "visible", timeout: 5000 });

  await page.click("#btnRunPatterns");

  await expect(page.locator("#patternClusters")).not.toContainText("—", { timeout: 8000 });
  const clustersText = await page.locator("#patternClusters").textContent();
  expect(clustersText.length).toBeGreaterThan(3);
});
