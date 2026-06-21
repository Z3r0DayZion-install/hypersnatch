"use strict";

/**
 * preflight_check.js
 *
 * Narrow environment preflight checker for HyperSnatch release-readiness proof.
 * Verifies required environment assumptions documented in:
 *   docs/release/V1_5_10_ENVIRONMENT_ASSUMPTIONS.md
 *
 * Checks (no runtime behavior changed — read-only assertions only):
 *   1. OS is Windows (warn if not; packaging path is Windows-oriented)
 *   2. Node version >= 20.17.0
 *   3. npm is available
 *   4. package-lock.json is present
 *   5. dist/ contains a current-version installer (no stale version artifacts)
 *   6. SHA256SUMS.txt is present in dist/
 *   7. Working tree is clean (warn only — not a hard failure)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const VERSION = PKG.version;
const MIN_NODE = "20.17.0";

const results = [];
let failures = 0;

function pass(label, detail) {
  results.push({ status: "PASS", label, detail });
}

function fail(label, detail) {
  results.push({ status: "FAIL", label, detail });
  failures++;
}

function warn(label, detail) {
  results.push({ status: "WARN", label, detail });
}

function compareVersion(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

// 1. OS check
if (process.platform === "win32") {
  pass("OS", "Windows detected — release packaging path supported");
} else {
  warn("OS", `Platform is '${process.platform}'; release packaging is Windows-oriented. Cross-platform parity not guaranteed.`);
}

// 2. Node version
const nodeVer = process.version.replace(/^v/, "");
if (compareVersion(nodeVer, MIN_NODE) >= 0) {
  pass("Node version", `${process.version} >= v${MIN_NODE}`);
} else {
  fail("Node version", `${process.version} is below minimum v${MIN_NODE} required by package.json engines`);
}

// 3. npm available
try {
  const npmVer = execSync("npm --version", { encoding: "utf8" }).trim();
  pass("npm", `npm ${npmVer} available`);
} catch {
  fail("npm", "npm not found on PATH");
}

// 4. package-lock.json present
const lockPath = path.join(ROOT, "package-lock.json");
if (fs.existsSync(lockPath)) {
  pass("package-lock.json", "present — deterministic install baseline available");
} else {
  fail("package-lock.json", "missing — deterministic dependency install not guaranteed");
}

// 5. dist/ current-version installer present
const distDir = path.join(ROOT, "dist");
const expectedInstaller = `HyperSnatch-Setup-${VERSION}.exe`;
const installerPath = path.join(distDir, expectedInstaller);
if (!fs.existsSync(distDir)) {
  warn("dist/", "dist/ directory not found — run npm run build:wrapper first");
} else if (fs.existsSync(installerPath)) {
  pass("dist/ installer", `${expectedInstaller} present`);
  // Check for stale versioned artifacts
  const stale = fs.readdirSync(distDir).filter(f => {
    const m = f.match(/HyperSnatch-Setup-(\d+\.\d+\.\d+)\.exe/);
    return m && m[1] !== VERSION;
  });
  if (stale.length > 0) {
    fail("dist/ stale artifacts", `Stale installer(s) found: ${stale.join(", ")} — run npm run clean:dist:stale`);
  } else {
    pass("dist/ stale check", "No stale versioned installers found");
  }
} else {
  warn("dist/ installer", `${expectedInstaller} not found — run npm run build:wrapper or this is a pre-build environment`);
}

// 6. SHA256SUMS.txt present in dist/
const sha256Path = path.join(distDir, "SHA256SUMS.txt");
if (fs.existsSync(sha256Path)) {
  pass("SHA256SUMS.txt", "present in dist/");
} else {
  warn("SHA256SUMS.txt", "not found in dist/ — strict signoff requires hash manifest");
}

// 7. Working tree clean (warn only)
try {
  const status = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" }).trim();
  if (status === "") {
    pass("Working tree", "clean — no uncommitted changes");
  } else {
    const lines = status.split("\n").length;
    warn("Working tree", `${lines} uncommitted change(s) detected — clean worktree is part of proof validity`);
  }
} catch {
  warn("Working tree", "could not check git status");
}

// ── Output ────────────────────────────────────────────────────────────────────

const width = 22;
console.log("\nHyperSnatch Preflight Check");
console.log("=".repeat(60));
for (const r of results) {
  const pad = r.label.padEnd(width);
  console.log(`  [${r.status.padEnd(4)}] ${pad} ${r.detail}`);
}
console.log("=".repeat(60));

if (failures === 0) {
  console.log(`  PREFLIGHT: PASS — environment meets all required assumptions`);
  console.log(`  Version: ${VERSION} | Node: ${process.version} | Platform: ${process.platform}`);
  process.exit(0);
} else {
  console.log(`  PREFLIGHT: FAIL — ${failures} required assumption(s) not met (see FAIL lines above)`);
  process.exit(1);
}
