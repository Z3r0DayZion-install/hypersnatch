"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(filePath);
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function toRel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

async function main() {
  const versionPkg = (() => {
    try {
      return require(path.join(root, "VERSION.json"));
    } catch {
      return null;
    }
  })();

  const version = String(pkg.version || versionPkg?.version || "unknown");

  const candidates = [];

  // Current Electron artifacts only
  candidates.push(path.join(distDir, `HyperSnatch-Setup-${version}.exe`));
  candidates.push(path.join(distDir, `HyperSnatch-Setup-${version}.exe.blockmap`));
  candidates.push(path.join(distDir, `HyperSnatch_Vanguard_v${version}.zip`));
  candidates.push(path.join(distDir, "latest.yml"));
  candidates.push(path.join(distDir, "win-unpacked", "HyperSnatch.exe"));
  candidates.push(path.join(distDir, "win-unpacked", "resources", "app.asar"));
  candidates.push(path.join(distDir, "win-unpacked", "resources", "hs-core.exe"));
  candidates.push(path.join(distDir, "win-unpacked", "resources", "hs-core"));

  // CLI / release pack artifacts (optional)
  candidates.push(path.join(distDir, "hypersnatch-cli.exe"));
  candidates.push(path.join(distDir, "hypersnatch.exe"));
  candidates.push(path.join(root, "release", "bridge", "ui-bridge.exe"));
  candidates.push(path.join(distDir, "HyperSnatch_release.zip"));

  const files = Array.from(new Set(candidates)).filter((p) => safeStat(p)?.isFile());

  const sde = process.env.SOURCE_DATE_EPOCH;
  const buildDate = sde && /^\d+$/.test(String(sde)) ? new Date(Number(sde) * 1000).toISOString() : new Date().toISOString();

  const manifest = {
    version,
    buildDate,
    files: {}
  };

  let sumsText = "";

  for (const filePath of files) {
    // eslint-disable-next-line no-await-in-loop
    const hash = await sha256File(filePath);
    const rel = toRel(filePath);
    const st2 = fs.statSync(filePath);
    manifest.files[rel] = { sha256: hash, size: st2.size };
    sumsText += `${hash}  ${rel}\n`;
  }

  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, "SHA256SUMS.txt"), sumsText, "utf8");
  fs.writeFileSync(path.join(distDir, "MANIFEST.json"), JSON.stringify(manifest, null, 2), "utf8");

  if (files.length === 0) {
    console.warn("⚠️ No dist artifacts found to hash (MANIFEST.json will be empty). Run `npm run dist` first.");
  } else {
    console.log("✅ Manifest and checksums generated.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
