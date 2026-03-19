"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const LEGACY_RELEASE_DIR = path.join(ROOT, "release", "HyperSnatch_v1.3.1");

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function findArtifactsRoot() {
  if (fs.existsSync(DIST_DIR)) return DIST_DIR;
  if (fs.existsSync(LEGACY_RELEASE_DIR)) return LEGACY_RELEASE_DIR;
  return null;
}

function findFirst(root, patterns) {
  const files = fs.readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);

  for (const p of patterns) {
    const hit = files.find((f) => p.test(f));
    if (hit) return path.join(root, hit);
  }

  return null;
}

function parseHashManifest(manifestPath) {
  const out = new Map();
  const lines = fs.readFileSync(manifestPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/);
    if (!m) continue;
    out.set(m[2].trim(), m[1].toLowerCase());
  }
  return out;
}

function assertExists(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relPath}`);
  }
}

function main() {
  console.log("=== HyperSnatch Final Sovereign Audit ===\n");

  const artifactRoot = findArtifactsRoot();
  if (!artifactRoot) {
    throw new Error("No artifact root found. Expected dist/ or release/HyperSnatch_v1.3.1.");
  }
  console.log(`Artifacts root: ${artifactRoot}`);

  const installer = findFirst(artifactRoot, [/^HyperSnatch-Setup-.*\.exe$/i]);
  if (!installer) throw new Error("Installer .exe not found.");
  console.log(`Installer: ${path.basename(installer)}`);

  const cli = findFirst(artifactRoot, [/^hypersnatch-cli\.exe$/i]);
  if (cli) {
    console.log(`CLI: ${path.basename(cli)}`);
  } else {
    console.log("CLI: SKIPPED (artifact not present in current build profile)");
  }

  const manifestPath = path.join(artifactRoot, "SHA256SUMS.txt");
  if (fs.existsSync(manifestPath)) {
    const manifest = parseHashManifest(manifestPath);
    const installerName = path.basename(installer);
    const installerExpected = manifest.get(installerName);
    if (!installerExpected) {
      throw new Error("SHA256SUMS.txt exists but installer entry is missing.");
    }

    const installerActual = sha256(installer);
    if (installerActual !== installerExpected) {
      throw new Error("Installer hash mismatch against SHA256SUMS.txt.");
    }

    if (cli) {
      const cliName = path.basename(cli);
      const cliExpected = manifest.get(cliName);
      if (!cliExpected) throw new Error("SHA256SUMS.txt exists but CLI entry is missing.");
      const cliActual = sha256(cli);
      if (cliActual !== cliExpected) {
        throw new Error("CLI hash mismatch against SHA256SUMS.txt.");
      }
    }
    console.log("Hash verification: PASS (SHA256SUMS.txt)");
  } else {
    console.log("Hash verification: SKIPPED (SHA256SUMS.txt missing)");
  }

  assertExists("README.md");
  assertExists("VERSION.json");
  assertExists(path.join("docs", "PROJECT_STATUS.md"));
  console.log("Documentation presence: PASS");

  console.log("\nFINAL SOVEREIGN AUDIT: PASS");
}

try {
  main();
} catch (err) {
  console.error("\n[CRITICAL FAILURE]:", err.message);
  process.exit(1);
}
