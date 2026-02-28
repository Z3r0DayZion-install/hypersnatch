"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function stat(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function isFile(p) {
  const s = stat(p);
  return Boolean(s && s.isFile());
}

function binName() {
  return process.platform === "win32" ? "hs-core.exe" : "hs-core";
}

function cargoAvailable() {
  const r = spawnSync("cargo", ["--version"], { stdio: "ignore", shell: false });
  return r.status === 0;
}

function newestMtime(paths) {
  let newest = 0;
  for (const p of paths) {
    const s = stat(p);
    if (s && s.mtimeMs > newest) newest = s.mtimeMs;
  }
  return newest;
}

function main() {
  const strict = process.env.HS_CORE_STRICT === "1" || process.env.HS_CORE_REQUIRED === "1";
  const force = process.env.HS_CORE_REBUILD === "1";

  const manifestPath = path.join(root, "rust", "hs-core", "Cargo.toml");
  const srcMain = path.join(root, "rust", "hs-core", "src", "main.rs");
  const cargoLock = path.join(root, "rust", "hs-core", "Cargo.lock");

  const builtBin = path.join(root, "rust", "hs-core", "target", "release", binName());
  const buildDir = path.join(root, "build");
  const shippedBin = path.join(buildDir, binName());

  if (!isFile(manifestPath) || !isFile(srcMain)) {
    const msg = "hs-core sources not found (rust/hs-core missing)";
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    console.warn(`⚠️ ${msg}; skipping Rust core.`);
    return;
  }

  if (!cargoAvailable()) {
    const msg = "cargo not found; cannot build hs-core";
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    console.warn(`⚠️ ${msg}; skipping Rust core.`);
    return;
  }

  const srcNewest = newestMtime([manifestPath, srcMain, cargoLock].filter(exists));
  const builtStat = stat(builtBin);
  const builtIsFresh = Boolean(builtStat && builtStat.mtimeMs >= srcNewest);

  if (!force && builtIsFresh) {
    // no-op
  } else {
    console.log("🔧 Building hs-core (Rust)…");
    const r = spawnSync(
      "cargo",
      ["build", "--manifest-path", path.relative(process.cwd(), manifestPath), "--release"],
      { stdio: "inherit", shell: false, cwd: root }
    );
    if (r.status !== 0) {
      const msg = `hs-core build failed (exit ${r.status})`;
      if (strict) process.exit(r.status || 1);
      console.warn(`⚠️ ${msg}; continuing without Rust core.`);
      return;
    }
  }

  if (!isFile(builtBin)) {
    const msg = `hs-core binary not found after build: ${builtBin}`;
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    console.warn(`⚠️ ${msg}; continuing without Rust core.`);
    return;
  }

  fs.mkdirSync(buildDir, { recursive: true });
  fs.copyFileSync(builtBin, shippedBin);
  console.log(`✅ Prepared ${path.relative(root, shippedBin)}`);
}

main();
