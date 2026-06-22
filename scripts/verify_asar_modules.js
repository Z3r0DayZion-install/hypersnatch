"use strict";

/**
 * verify_asar_modules.js
 *
 * Post-build gate: verifies that every local require() target in src/main.js
 * exists inside the packed app.asar. Fails if any module is missing.
 *
 * Also launches the installed (or unpacked) binary and checks that a visible
 * window opens (MainWindowHandle != 0) within a timeout.
 *
 * Prevents the v1.6.6-v1.6.11 class of bug: electron-builder files list
 * omitted src/ subdirectories, app crashed before app.whenReady(), but all
 * E2E tests passed because dev mode reads from the filesystem directly.
 *
 * Usage: npm run verify:asar
 */

const fs   = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");

const ROOT      = path.resolve(__dirname, "..");
const MAIN_JS   = path.join(ROOT, "src", "main.js");
const ASAR_PATH = path.join(ROOT, "dist", "win-unpacked", "resources", "app.asar");
const EXE_PATH  = path.join(ROOT, "dist", "win-unpacked", "HyperSnatch.exe");

let allPassed = true;

function pass(msg, detail) {
  console.log(`\u2705 VERIFICATION SUCCESS: ${msg}`);
  if (detail) console.log("  " + JSON.stringify(detail));
}

function fail(msg, detail) {
  console.error(`\u274c VERIFICATION ERROR: ${msg}`);
  if (detail) console.error("  " + JSON.stringify(detail));
  allPassed = false;
}

// ── 1. Check asar exists ──────────────────────────────────────────────────────
console.log("\n\uD83D\uDCE6 Checking app.asar exists...");
if (!fs.existsSync(ASAR_PATH)) {
  fail("app.asar not found — run npm run dist first", { path: ASAR_PATH });
  process.exit(1);
}
const asarStat = fs.statSync(ASAR_PATH);
pass("app.asar found", { path: ASAR_PATH, size: asarStat.size });

// ── 2. List asar contents ─────────────────────────────────────────────────────
console.log("\n\uD83D\uDCCB Listing asar contents...");
let asarFiles;
try {
  const raw = execSync(`npx asar list "${ASAR_PATH}"`, { cwd: ROOT }).toString();
  asarFiles = new Set(
    raw.split("\n")
      .map(l => l.trim().replace(/\\/g, "/").replace(/^\//, ""))
      .filter(Boolean)
  );
  pass(`asar contains ${asarFiles.size} entries`);
} catch (err) {
  fail("Failed to list asar contents", { error: err.message });
  process.exit(1);
}

// ── 3. Extract local require() targets from main.js ───────────────────────────
console.log("\n\uD83D\uDD0D Scanning src/main.js for local require() calls...");
if (!fs.existsSync(MAIN_JS)) {
  fail("src/main.js not found", { path: MAIN_JS });
  process.exit(1);
}
const mainSrc = fs.readFileSync(MAIN_JS, "utf8");

// Match require('./...') and require('../...') — captures the path string
const requireRe = /require\(['"](\.[^'"]+)['"]\)/g;
const localRequires = [];
let m;
while ((m = requireRe.exec(mainSrc)) !== null) {
  localRequires.push(m[1]);
}
pass(`Found ${localRequires.length} local require() calls in src/main.js`);

// ── 4. Verify each required module exists in asar ─────────────────────────────
console.log("\n\uD83D\uDEE1\uFE0F  Verifying required modules are present in asar...");
const missing = [];

for (const req of localRequires) {
  // Resolve relative to src/
  const resolved = path.resolve(path.join(ROOT, "src"), req);
  const relToRoot = path.relative(ROOT, resolved).replace(/\\/g, "/");

  // A module can resolve as a .js file or as a directory index
  const candidates = [
    relToRoot + ".js",
    relToRoot + "/index.js",
    relToRoot,
  ];

  const found = candidates.some(c => asarFiles.has(c));
  if (!found) {
    missing.push({ require: req, resolved: relToRoot });
  }
}

if (missing.length > 0) {
  fail(`${missing.length} required module(s) missing from app.asar`, { missing });
} else {
  pass(`All ${localRequires.length} required modules present in app.asar`);
}

// ── 5. Launch unpacked binary and verify visible window ───────────────────────
console.log("\n\uD83E\uDEDF  Launching unpacked binary to verify visible window...");

if (!fs.existsSync(EXE_PATH)) {
  fail("win-unpacked HyperSnatch.exe not found", { path: EXE_PATH });
} else {
  // Kill any existing instance
  try { execSync("taskkill /IM HyperSnatch.exe /F", { stdio: "pipe" }); } catch (_) {}

  // Launch
  const proc = require("child_process").spawn(EXE_PATH, [], { detached: true, stdio: "ignore" });
  proc.unref();

  // Poll for visible window for up to 15 seconds
  const POLL_MS    = 1000;
  const TIMEOUT_MS = 15000;
  const start      = Date.now();
  let windowFound  = false;
  let windowTitle  = "";

  while (Date.now() - start < TIMEOUT_MS) {
    try {
      const ps = execSync(
        `powershell -NoProfile -Command "Get-Process HyperSnatch -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1 -ExpandProperty MainWindowTitle"`,
        { stdio: "pipe" }
      ).toString().trim();
      if (ps) {
        windowFound = true;
        windowTitle = ps;
        break;
      }
    } catch (_) {}
    // sleep POLL_MS
    const t = Date.now() + POLL_MS;
    while (Date.now() < t) { /* spin */ }
  }

  // Kill after check
  try { execSync("taskkill /IM HyperSnatch.exe /F", { stdio: "pipe" }); } catch (_) {}

  if (windowFound) {
    pass("Visible window confirmed", { MainWindowTitle: windowTitle });
  } else {
    fail("No visible window within 15s — packaged launch failed", {
      exe: EXE_PATH,
      hint: "Check runtime.log for UNCAUGHT_EXCEPTION. Likely a missing module in app.asar."
    });
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
if (allPassed) {
  console.log("\u2705 ASAR VERIFICATION PASS — packaged modules complete, window visible");
} else {
  console.error("\u274c ASAR VERIFICATION FAIL — fix issues before tagging");
  process.exit(1);
}
