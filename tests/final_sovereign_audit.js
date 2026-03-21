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
const EXPECTED_CLI_NAME = "hypersnatch-cli.exe";
const EXPECTED_HASH_MANIFEST_NAME = "SHA256SUMS.txt";
const STRICT_HASH_FLAG = process.env.HYPERSNATCH_AUDIT_REQUIRE_HASH === "1";
const STRICT_CLI_FLAG = process.env.HYPERSNATCH_AUDIT_REQUIRE_CLI === "1";
const AUDIT_PROFILE = String(process.env.HYPERSNATCH_AUDIT_PROFILE || "warn").trim().toLowerCase();
const AUDIT_RELEASE_TYPE = String(process.env.HYPERSNATCH_AUDIT_RELEASE_TYPE || "internal").trim().toLowerCase();
const VALID_AUDIT_PROFILES = new Set(["warn", "strict"]);
const VALID_RELEASE_TYPES = new Set(["internal", "prerelease", "stable"]);
const STRICT_HASH = STRICT_HASH_FLAG || AUDIT_PROFILE === "strict";
const STRICT_CLI = STRICT_CLI_FLAG;
const IS_STRICT_STABLE_SIGNOFF = AUDIT_PROFILE === "strict" && AUDIT_RELEASE_TYPE === "stable";

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

function manifestLookup(manifest, artifactRoot, filePath) {
  const base = path.basename(filePath);
  const relFromRoot = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const relFromArtifactRoot = path.relative(artifactRoot, filePath).replace(/\\/g, "/");
  return (
    manifest.get(base) ||
    manifest.get(relFromRoot) ||
    manifest.get(relFromArtifactRoot) ||
    null
  );
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

function failWithHint(message, hint, context = {}) {
  const suffix = hint ? ` Hint: ${hint}` : "";
  const error = new Error(`${message}${suffix}`);
  Object.assign(error, context);
  throw error;
}

function expectedArtifactsForRoot(artifactRoot) {
  const base = artifactRoot || DIST_DIR;
  return {
    installer: path.join(base, EXPECTED_INSTALLER_NAME),
    releaseBundle: path.join(base, EXPECTED_RELEASE_BUNDLE_NAME),
    cli: path.join(base, EXPECTED_CLI_NAME),
    hashManifest: path.join(base, EXPECTED_HASH_MANIFEST_NAME)
  };
}

function printArtifactExpectations(artifactRoot) {
  const expected = expectedArtifactsForRoot(artifactRoot);
  console.log("Artifact expectations:");
  console.log(`- installer: ${expected.installer}`);
  console.log(`- release bundle: ${expected.releaseBundle}`);
  console.log(`- strict hash manifest (required in strict mode): ${expected.hashManifest}`);
  console.log(`- strict CLI (optional extra strictness via HYPERSNATCH_AUDIT_REQUIRE_CLI=1): ${expected.cli}`);
  console.log("");
}

function printStrictRerunGuidance(artifactRoot) {
  const expected = expectedArtifactsForRoot(artifactRoot);
  console.log("Strict stable signoff rerun guidance:");
  console.log(`1. Ensure artifact root contains required strict files: ${EXPECTED_INSTALLER_NAME}, ${EXPECTED_RELEASE_BUNDLE_NAME}, ${EXPECTED_HASH_MANIFEST_NAME}.`);
  console.log(`2. Expected strict hash path: ${expected.hashManifest}`);
  console.log(`3. Optional strict CLI path (only when HYPERSNATCH_AUDIT_REQUIRE_CLI=1): ${expected.cli}`);
  console.log("4. Rebuild/re-prepare artifacts, then rerun: npm run audit:stable");
}

function printStrictStableGuidance() {
  console.log("Strict stable signoff is REQUIRED before stable tag/release actions.");
  console.log("Strict stable signoff contract:");
  console.log("- required profile: HYPERSNATCH_AUDIT_PROFILE=strict");
  console.log("- required release type: HYPERSNATCH_AUDIT_RELEASE_TYPE=stable");
  console.log("- required checks: installer + versioned release bundle + SHA256SUMS hash verification");
  console.log("- optional extra strictness: set HYPERSNATCH_AUDIT_REQUIRE_CLI=1 to require hypersnatch-cli.exe");
  console.log("- recommended command: npm run audit:stable");
  console.log('Strict rerun example (PowerShell): $env:HYPERSNATCH_AUDIT_PROFILE="strict"; $env:HYPERSNATCH_AUDIT_RELEASE_TYPE="stable"; $env:HYPERSNATCH_AUDIT_REQUIRE_HASH="1"; npm run audit:final');
  console.log("Strict wrapper command (preferred): npm run audit:stable");
}

function printSignoffStatusBlocked(reason) {
  console.log("SIGNOFF STATUS: BLOCKED");
  console.log(`SIGNOFF REASON: ${reason}`);
  console.log("SIGNOFF ACTION: run `npm run audit:stable` before any stable tag/release action.");
}

function printSignoffStatusNonSignoff(reason) {
  console.log("SIGNOFF STATUS: NON-SIGNOFF");
  console.log(`SIGNOFF REASON: ${reason}`);
  console.log("SIGNOFF ACTION: run `npm run audit:stable` for strict stable signoff evidence.");
}

function printSignoffStatusApproved() {
  console.log("SIGNOFF STATUS: APPROVED");
  console.log("SIGNOFF SCOPE: strict stable signoff evidence for stable tag/release actions.");
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

  if (AUDIT_RELEASE_TYPE === "stable" && (AUDIT_PROFILE !== "strict" || !STRICT_HASH)) {
    failWithHint(
      "Stable release signoff requires strict profile and strict hash verification.",
      "Run npm run audit:stable (or set HYPERSNATCH_AUDIT_PROFILE=strict, HYPERSNATCH_AUDIT_RELEASE_TYPE=stable, HYPERSNATCH_AUDIT_REQUIRE_HASH=1). Set HYPERSNATCH_AUDIT_REQUIRE_CLI=1 only if your release contract requires CLI artifact proof.",
      { signoffReason: "stable release type requested without strict profile/hash contract" }
    );
  }

  console.log("=== HyperSnatch Final Sovereign Audit ===\n");
  console.log(`Audit contract: profile=${AUDIT_PROFILE} releaseType=${AUDIT_RELEASE_TYPE}`);
  console.log(`Audit profile flags: requireHash=${STRICT_HASH ? "yes" : "no"} requireCli=${STRICT_CLI ? "yes" : "no"}\n`);
  if (IS_STRICT_STABLE_SIGNOFF) {
    console.log("Audit interpretation: STRICT STABLE SIGNOFF mode.\n");
  } else {
    console.log("Audit interpretation: NON-SIGNOFF mode for stable tag decisions.\n");
    console.log("SIGNOFF NOTE: this run cannot approve stable tagging or stable release signoff.");
    console.log("Policy reminder: `npm run audit:final` is maintenance evidence only; use `npm run audit:stable` for strict signoff.\n");
    printSignoffStatusNonSignoff("profile/release-type contract is not strict stable signoff");
    console.log("");
  }
  if (AUDIT_PROFILE === "strict") {
    console.log("Audit policy: STRICT profile requires installer/release-bundle presence and SHA256SUMS validation.");
    if (STRICT_CLI) {
      console.log("Audit policy extension: HYPERSNATCH_AUDIT_REQUIRE_CLI=1 requires CLI artifact + hash entry validation.");
    } else {
      console.log("Audit policy extension: CLI artifact is optional unless HYPERSNATCH_AUDIT_REQUIRE_CLI=1 is explicitly set.");
    }
    console.log("");
  } else {
    console.log("Audit policy: WARN profile is maintenance evidence only and CANNOT approve strict stable signoff.\n");
  }
  console.log(`Expected installer for package version ${PKG.version}: ${EXPECTED_INSTALLER_NAME}\n`);

  const artifactRoot = findArtifactsRoot();
  if (!artifactRoot) {
    failWithHint(
      `No artifact root found. Expected dist/ or release/${RELEASE_DIR_NAME}.`,
      `Run \"npm run build:wrapper\" first, then rerun \"npm run audit:final\".`,
      { signoffReason: "artifact root missing", artifactRoot: DIST_DIR }
    );
  }
  console.log(`Artifacts root: ${artifactRoot}`);
  printArtifactExpectations(artifactRoot);

  const setupInstallers = fs.readdirSync(artifactRoot, { withFileTypes: true })
    .filter((d) => d.isFile() && /^HyperSnatch-Setup-.*\.exe$/i.test(d.name))
    .map((d) => d.name);
  if (setupInstallers.length === 0) {
    failWithHint(
      "Installer .exe not found in artifact root.",
      `Expected ${EXPECTED_INSTALLER_NAME} in ${artifactRoot} after \"npm run build:wrapper\".`,
      { signoffReason: "required installer artifact missing", artifactRoot }
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
      `Run \"npm run build:wrapper\" after aligning version identity to ${PKG.version}.`,
      { signoffReason: "required release bundle missing", artifactRoot }
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
      `Strict signoff required CLI artifact missing: ${path.join(artifactRoot, EXPECTED_CLI_NAME)}.`,
      `Provide ${EXPECTED_CLI_NAME} in the artifact root and rerun \"npm run audit:stable\".`,
      { signoffReason: "strict CLI artifact missing", artifactRoot }
    );
  } else {
    printCheck("CLI", "INFO", "optional in current contract; set HYPERSNATCH_AUDIT_REQUIRE_CLI=1 to enforce");
  }

  const manifestPath = path.join(artifactRoot, EXPECTED_HASH_MANIFEST_NAME);
  if (fs.existsSync(manifestPath)) {
    const manifest = parseHashManifest(manifestPath);
    const installerExpected = manifestLookup(manifest, artifactRoot, installer);
    if (!installerExpected) {
      throw new Error(`SHA256SUMS.txt exists but installer entry is missing (${EXPECTED_INSTALLER_NAME}).`);
    }

    const installerActual = sha256(installer);
    if (installerActual !== installerExpected) {
      throw new Error("Installer hash mismatch against SHA256SUMS.txt.");
    }

    const releaseBundleExpected = manifestLookup(manifest, artifactRoot, releaseBundle);
    if (!releaseBundleExpected) {
      throw new Error(`SHA256SUMS.txt exists but release bundle entry is missing (${EXPECTED_RELEASE_BUNDLE_NAME}).`);
    }

    const releaseBundleActual = sha256(releaseBundle);
    if (releaseBundleActual !== releaseBundleExpected) {
      throw new Error("Release bundle hash mismatch against SHA256SUMS.txt.");
    }

    if (cli) {
      const cliExpected = manifestLookup(manifest, artifactRoot, cli);
      if (!cliExpected) throw new Error("SHA256SUMS.txt exists but CLI entry is missing.");
      const cliActual = sha256(cli);
      if (cliActual !== cliExpected) {
        throw new Error("CLI hash mismatch against SHA256SUMS.txt.");
      }
    }
    printCheck("Hash verification", "PASS", `SHA256SUMS.txt (${cli ? "installer + release bundle + CLI" : "installer + release bundle"})`);
  } else if (STRICT_HASH) {
    failWithHint(
      `Strict signoff required hash manifest missing: ${manifestPath}.`,
      `Generate ${EXPECTED_HASH_MANIFEST_NAME} in artifact root and rerun \"npm run audit:stable\".`,
      { signoffReason: "strict hash manifest missing", artifactRoot }
    );
  } else {
    printCheck("Hash verification", "WARN", `${EXPECTED_HASH_MANIFEST_NAME} missing; set HYPERSNATCH_AUDIT_REQUIRE_HASH=1 to enforce`);
  }

  assertExists("README.md");
  assertExists("VERSION.json");
  assertExists(path.join("docs", "PROJECT_STATUS.md"));
  printCheck("Documentation presence", "PASS", "README.md, VERSION.json, docs/PROJECT_STATUS.md");

  const warns = Number(!fs.existsSync(manifestPath) && !STRICT_HASH);
  if (warns > 0) {
    console.log(`\nFINAL SOVEREIGN AUDIT: PASS (WITH WARNINGS: ${warns})`);
    console.log(`Policy result: profile=${AUDIT_PROFILE}, releaseType=${AUDIT_RELEASE_TYPE}.`);
    console.log("SIGNOFF NOTE: NOT VALID for strict stable release signoff.");
    console.log("Action: review WARN lines and rerun strict stable signoff (`npm run audit:stable`) before any stable tag/release action.");
    console.log("WARN scope:");
    if (!fs.existsSync(manifestPath) && !STRICT_HASH) console.log("- SHA256SUMS.txt verification is optional in current profile.");
    printStrictStableGuidance();
    printSignoffStatusNonSignoff("WARN profile and/or optional checks present");
    return;
  }
  if (IS_STRICT_STABLE_SIGNOFF) {
    console.log("\nFINAL SOVEREIGN AUDIT: PASS (STRICT STABLE SIGNOFF)");
    printSignoffStatusApproved();
    return;
  }
  console.log("\nFINAL SOVEREIGN AUDIT: PASS (NON-SIGNOFF PROFILE)");
  console.log("SIGNOFF NOTE: suitable for maintenance evidence only, not strict stable tag/release signoff.");
  console.log("Action: run `npm run audit:stable` for strict stable-signoff evidence.");
  printStrictStableGuidance();
  printSignoffStatusNonSignoff("non-signoff profile");
}

try {
  main();
} catch (err) {
  console.error("\n[CRITICAL FAILURE]:", err.message);
  const artifactRoot = err.artifactRoot || findArtifactsRoot() || DIST_DIR;
  if (IS_STRICT_STABLE_SIGNOFF) {
    printSignoffStatusBlocked(err.signoffReason || "strict stable signoff contract failed");
    printArtifactExpectations(artifactRoot);
    printStrictRerunGuidance(artifactRoot);
  }
  console.error(`Expected base artifact contract: ${EXPECTED_INSTALLER_NAME} and ${EXPECTED_RELEASE_BUNDLE_NAME} in ${artifactRoot} (no stale/mixed versions).`);
  console.error("Remediation order: npm install -> npm run build:wrapper -> npm run verify -> npm run audit:final -> npm run audit:stable");
  process.exit(1);
}
