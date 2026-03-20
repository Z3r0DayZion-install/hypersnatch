"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const RELEASE_DIR_NAME = `HyperSnatch_v${PKG.version}`;
const LEGACY_RELEASE_DIR = path.join(ROOT, "release", RELEASE_DIR_NAME);
const STRICT_HASH = process.env.HYPERSNATCH_AUDIT_REQUIRE_HASH === "1";
const STRICT_CLI = process.env.HYPERSNATCH_AUDIT_REQUIRE_CLI === "1";

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

function printCheck(name, status, detail) {
  console.log(`${name}: ${status}${detail ? ` (${detail})` : ""}`);
}

function failWithHint(message, hint) {
  const suffix = hint ? ` Hint: ${hint}` : "";
  throw new Error(`${message}${suffix}`);
}

function main() {
  console.log("=== HyperSnatch Final Sovereign Audit ===\n");
  console.log(`Audit profile: requireHash=${STRICT_HASH ? "yes" : "no"} requireCli=${STRICT_CLI ? "yes" : "no"}\n`);

  const artifactRoot = findArtifactsRoot();
  if (!artifactRoot) {
    failWithHint(
      `No artifact root found. Expected dist/ or release/${RELEASE_DIR_NAME}.`,
      `Run \"npm run build:wrapper\" first, then rerun \"npm run audit:final\".`
    );
  }
  console.log(`Artifacts root: ${artifactRoot}`);

  const installer = findFirst(artifactRoot, [/^HyperSnatch-Setup-.*\.exe$/i]);
  if (!installer) {
    failWithHint(
      "Installer .exe not found in artifact root.",
      `Expected HyperSnatch-Setup-<version>.exe after \"npm run build:wrapper\".`
    );
  }
  printCheck("Installer", "PASS", path.basename(installer));

  const cli = findFirst(artifactRoot, [/^hypersnatch-cli\.exe$/i]);
  if (cli) {
    printCheck("CLI", "PASS", path.basename(cli));
  } else if (STRICT_CLI) {
    failWithHint(
      "CLI artifact required but not found.",
      `Disable strict CLI mode or include hypersnatch-cli.exe in the build profile.`
    );
  } else {
    printCheck("CLI", "WARN", "not present in current build profile; set HYPERSNATCH_AUDIT_REQUIRE_CLI=1 to enforce");
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
    printCheck("Hash verification", "PASS", "SHA256SUMS.txt");
  } else if (STRICT_HASH) {
    failWithHint(
      "SHA256SUMS.txt required but missing.",
      `Generate checksum manifest in artifact root or unset HYPERSNATCH_AUDIT_REQUIRE_HASH.`
    );
  } else {
    printCheck("Hash verification", "WARN", "SHA256SUMS.txt missing; set HYPERSNATCH_AUDIT_REQUIRE_HASH=1 to enforce");
  }

  assertExists("README.md");
  assertExists("VERSION.json");
  assertExists(path.join("docs", "PROJECT_STATUS.md"));
  printCheck("Documentation presence", "PASS", "README.md, VERSION.json, docs/PROJECT_STATUS.md");

  const warns = Number(!cli && !STRICT_CLI) + Number(!fs.existsSync(manifestPath) && !STRICT_HASH);
  if (warns > 0) {
    console.log(`\nFINAL SOVEREIGN AUDIT: PASS (WITH WARNINGS: ${warns})`);
    console.log('Action: review WARN lines and decide whether to enforce strict mode for this release gate.');
    return;
  }
  console.log("\nFINAL SOVEREIGN AUDIT: PASS");
}

try {
  main();
} catch (err) {
  console.error("\n[CRITICAL FAILURE]:", err.message);
  console.error('Remediation order: npm install -> npm run build:wrapper -> npm run verify -> npm run audit:final');
  process.exit(1);
}
