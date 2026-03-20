"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const RELEASE_DIR_NAME = `HyperSnatch_v${PKG.version}`;
const LEGACY_RELEASE_DIR = path.join(ROOT, "release", RELEASE_DIR_NAME);
const EXPECTED_INSTALLER_NAME = `HyperSnatch-Setup-${PKG.version}.exe`;
const EXPECTED_RELEASE_BUNDLE_NAME = `HyperSnatch_Vanguard_v${PKG.version}.zip`;
const STRICT_HASH_FLAG = process.env.HYPERSNATCH_AUDIT_REQUIRE_HASH === "1";
const STRICT_CLI_FLAG = process.env.HYPERSNATCH_AUDIT_REQUIRE_CLI === "1";
const AUDIT_PROFILE = String(process.env.HYPERSNATCH_AUDIT_PROFILE || "warn").trim().toLowerCase();
const AUDIT_RELEASE_TYPE = String(process.env.HYPERSNATCH_AUDIT_RELEASE_TYPE || "internal").trim().toLowerCase();
const VALID_AUDIT_PROFILES = new Set(["warn", "strict"]);
const VALID_RELEASE_TYPES = new Set(["internal", "prerelease", "stable"]);
const STRICT_HASH = STRICT_HASH_FLAG || AUDIT_PROFILE === "strict";
const STRICT_CLI = STRICT_CLI_FLAG || AUDIT_PROFILE === "strict";

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
  if (!VALID_AUDIT_PROFILES.has(AUDIT_PROFILE)) {
    failWithHint(
      `Unsupported HYPERSNATCH_AUDIT_PROFILE value: ${AUDIT_PROFILE}.`,
      `Use one of: ${Array.from(VALID_AUDIT_PROFILES).join(", ")}.`
    );
  }

  if (!VALID_RELEASE_TYPES.has(AUDIT_RELEASE_TYPE)) {
    failWithHint(
      `Unsupported HYPERSNATCH_AUDIT_RELEASE_TYPE value: ${AUDIT_RELEASE_TYPE}.`,
      `Use one of: ${Array.from(VALID_RELEASE_TYPES).join(", ")}.`
    );
  }

  if (AUDIT_RELEASE_TYPE === "stable" && (!STRICT_HASH || !STRICT_CLI)) {
    failWithHint(
      "Stable release audit requires strict CLI/hash checks.",
      "Set HYPERSNATCH_AUDIT_PROFILE=strict before running npm run audit:final."
    );
  }

  console.log("=== HyperSnatch Final Sovereign Audit ===\n");
  console.log(`Audit contract: profile=${AUDIT_PROFILE} releaseType=${AUDIT_RELEASE_TYPE}`);
  console.log(`Audit profile flags: requireHash=${STRICT_HASH ? "yes" : "no"} requireCli=${STRICT_CLI ? "yes" : "no"}\n`);
  if (AUDIT_PROFILE === "strict") {
    console.log("Audit policy: STRICT profile requires CLI artifact and SHA256SUMS validation.\n");
  } else {
    console.log("Audit policy: WARN profile allows optional CLI/hash checks unless strict flags are enabled.\n");
  }
  console.log(`Expected installer for package version ${PKG.version}: ${EXPECTED_INSTALLER_NAME}\n`);

  const artifactRoot = findArtifactsRoot();
  if (!artifactRoot) {
    failWithHint(
      `No artifact root found. Expected dist/ or release/${RELEASE_DIR_NAME}.`,
      `Run \"npm run build:wrapper\" first, then rerun \"npm run audit:final\".`
    );
  }
  console.log(`Artifacts root: ${artifactRoot}`);

  const setupInstallers = fs.readdirSync(artifactRoot, { withFileTypes: true })
    .filter((d) => d.isFile() && /^HyperSnatch-Setup-.*\.exe$/i.test(d.name))
    .map((d) => d.name);
  if (setupInstallers.length === 0) {
    failWithHint(
      "Installer .exe not found in artifact root.",
      `Expected HyperSnatch-Setup-<version>.exe after \"npm run build:wrapper\".`
    );
  }

  if (!setupInstallers.includes(EXPECTED_INSTALLER_NAME)) {
    failWithHint(
      `Expected installer ${EXPECTED_INSTALLER_NAME} not found.`,
      `Detected installers: ${setupInstallers.join(", ")}. Rebuild artifacts for package version ${PKG.version}.`
    );
  }

  const staleInstallers = setupInstallers.filter((name) => name !== EXPECTED_INSTALLER_NAME);
  if (staleInstallers.length > 0) {
    failWithHint(
      `Stale installer versions detected alongside ${EXPECTED_INSTALLER_NAME}.`,
      `Remove stale installers (${staleInstallers.join(", ")}) or use a clean worktree before audit proof.`
    );
  }

  const installer = path.join(artifactRoot, EXPECTED_INSTALLER_NAME);
  printCheck("Installer", "PASS", path.basename(installer));

  const topLevelFiles = fs.readdirSync(artifactRoot, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name);
  const vanguardBundles = topLevelFiles.filter((name) => /^HyperSnatch_Vanguard.*\.zip$/i.test(name));
  const versionedVanguardBundles = vanguardBundles.filter((name) => /^HyperSnatch_Vanguard_v[^\\/]+\.zip$/i.test(name));
  const ambiguousVanguardBundles = vanguardBundles.filter((name) => !/^HyperSnatch_Vanguard_v[^\\/]+\.zip$/i.test(name));

  if (vanguardBundles.length === 0) {
    failWithHint(
      `Expected ${EXPECTED_RELEASE_BUNDLE_NAME} but found no HyperSnatch_Vanguard*.zip artifacts. Result: FAIL.`,
      `Run \"npm run build:wrapper\" after aligning version identity to ${PKG.version}.`
    );
  }

  if (!versionedVanguardBundles.includes(EXPECTED_RELEASE_BUNDLE_NAME)) {
    failWithHint(
      `Expected ${EXPECTED_RELEASE_BUNDLE_NAME}; found ${vanguardBundles.join(", ")}. Result: FAIL.`,
      `Run \"npm run build:wrapper\" after aligning version identity to ${PKG.version}.`
    );
  }

  if (ambiguousVanguardBundles.length > 0) {
    failWithHint(
      `Ambiguous non-versioned release bundles found: ${ambiguousVanguardBundles.join(", ")}. Result: FAIL.`,
      "Remove ambiguous bundles and keep only versioned HyperSnatch_Vanguard_v<version>.zip artifacts."
    );
  }

  const staleVanguardBundles = versionedVanguardBundles.filter((name) => name !== EXPECTED_RELEASE_BUNDLE_NAME);
  if (staleVanguardBundles.length > 0) {
    failWithHint(
      `Expected ${EXPECTED_RELEASE_BUNDLE_NAME}; found stale versioned bundles ${staleVanguardBundles.join(", ")}. Result: FAIL.`,
      "Use a clean worktree or remove stale versioned bundles before audit proof."
    );
  }

  const releaseBundle = path.join(artifactRoot, EXPECTED_RELEASE_BUNDLE_NAME);
  printCheck("Release bundle", "PASS", path.basename(releaseBundle));

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
    console.log(`Policy result: profile=${AUDIT_PROFILE}, releaseType=${AUDIT_RELEASE_TYPE}.`);
    console.log('Action: review WARN lines and decide strictness policy for this release gate.');
    console.log("WARN scope:");
    if (!cli && !STRICT_CLI) console.log("- CLI artifact is optional in current profile.");
    if (!fs.existsSync(manifestPath) && !STRICT_HASH) console.log("- SHA256SUMS.txt verification is optional in current profile.");
    console.log('Policy hint: use HYPERSNATCH_AUDIT_PROFILE=strict for stable-signoff strictness.');
    console.log('Strict rerun example (PowerShell): $env:HYPERSNATCH_AUDIT_PROFILE=\"strict\"; $env:HYPERSNATCH_AUDIT_RELEASE_TYPE=\"stable\"; npm run audit:final');
    return;
  }
  console.log("\nFINAL SOVEREIGN AUDIT: PASS");
}

try {
  main();
} catch (err) {
  console.error("\n[CRITICAL FAILURE]:", err.message);
  console.error(`Expected artifact contract: ${EXPECTED_INSTALLER_NAME} and ${EXPECTED_RELEASE_BUNDLE_NAME} in dist/ (no stale/mixed versions).`);
  console.error('Remediation order: npm install -> npm run build:wrapper -> npm run verify -> npm run audit:final');
  process.exit(1);
}
