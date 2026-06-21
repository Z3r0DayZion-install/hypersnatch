"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const currentVersion = String(pkg.version || "unknown");

const keepExact = new Set([
  `HyperSnatch-Setup-${currentVersion}.exe`,
  `HyperSnatch-Setup-${currentVersion}.exe.blockmap`,
  `HyperSnatch_Vanguard_v${currentVersion}.zip`,
  "latest.yml",
  "builder-debug.yml",
  "builder-effective-config.yaml",
  "SHA256SUMS.txt",
  "MANIFEST.json"
]);

const stalePatterns = [
  /^HyperSnatch-Setup-(.+)\.exe$/i,
  /^HyperSnatch-Setup-(.+)\.exe\.blockmap$/i,
  /^HyperSnatch-Setup-(.+)\.exe\.sig$/i,
  /^HyperSnatch_Vanguard_v(.+)\.zip$/i,
  /^HyperSnatch_v(.+)_Platform_Bundle\.zip$/i,
  /^HyperSnatch (.+)\.exe$/i
];

function isStaleVersionedArtifact(name) {
  for (const pattern of stalePatterns) {
    const match = name.match(pattern);
    if (match && match[1] !== currentVersion) {
      return true;
    }
  }
  return false;
}

function main() {
  if (!fs.existsSync(distDir)) {
    console.log(`[clean-dist] dist folder not found: ${distDir}`);
    return;
  }

  const removed = [];
  for (const name of fs.readdirSync(distDir)) {
    const fullPath = path.join(distDir, name);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;
    if (keepExact.has(name)) continue;

    if (isStaleVersionedArtifact(name)) {
      fs.rmSync(fullPath, { force: true });
      removed.push(name);
      continue;
    }

    if (name === "manifest.json" || name === "hashes.txt") {
      fs.rmSync(fullPath, { force: true });
      removed.push(name);
    }
  }

  if (removed.length === 0) {
    console.log(`[clean-dist] No stale dist artifacts found for v${currentVersion}.`);
    return;
  }

  console.log(`[clean-dist] Removed ${removed.length} stale artifacts for v${currentVersion}:`);
  removed.forEach((name) => console.log(` - ${name}`));
}

main();
