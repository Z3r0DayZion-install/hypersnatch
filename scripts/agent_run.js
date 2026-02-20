#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = process.cwd();
const PROOF_PACK = path.join(ROOT, "PROOF_PACK");
const DIST_TEST = path.join(ROOT, "dist_test");

// Clean and create directories
if (fs.existsSync(PROOF_PACK)) {
  fs.rmSync(PROOF_PACK, { recursive: true, force: true });
}
if (fs.existsSync(DIST_TEST)) {
  fs.rmSync(DIST_TEST, { recursive: true, force: true });
}
fs.mkdirSync(PROOF_PACK, { recursive: true });
fs.mkdirSync(DIST_TEST, { recursive: true });

function log(msg) {
  console.log(msg);
  fs.appendFileSync(path.join(PROOF_PACK, "run.log"), msg + "\n");
}

function need(file) {
  if (!fs.existsSync(file)) {
    log(`MISSING: ${file}`);
    process.exit(2);
  }
}

function tee(filename, content) {
  fs.writeFileSync(filename, content);
  console.log(content);
}

// Check required files
need("scripts/brand_purge.js");
need("scripts/tear-compile.js");
need("scripts/build_release_pack.js");
need("scripts/verify_release_pack.js");

log("=== ENV ===");
tee(path.join(PROOF_PACK, "00_pwd.txt"), process.cwd());
tee(path.join(PROOF_PACK, "01_node.txt"), execSync("node -v", { encoding: "utf8" }).trim());
tee(path.join(PROOF_PACK, "02_npm.txt"), execSync("npm -v", { encoding: "utf8" }).trim());

log("=== BRAND PURGE ===");
try {
  const purgeOutput = execSync("node scripts/brand_purge.js", { encoding: "utf8" });
  tee(path.join(PROOF_PACK, "03_brand_purge.txt"), purgeOutput);
} catch (e) {
  tee(path.join(PROOF_PACK, "03_brand_purge.txt"), e.stdout || e.message);
}

log("=== BRAND CHECK (AFTER PURGE) ===");
try {
  const grepOutput = execSync('grep -RIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=PROOF_PACK --exclude-dir=dist_test -E "HyperSnatch|hypersnatch|io\\.hypersnatch\\.Platform|hs\\.Platform\\.state\\.v2" . || true', { encoding: "utf8" });
  tee(path.join(PROOF_PACK, "04_brand_hits_after.txt"), grepOutput);
} catch (e) {
  tee(path.join(PROOF_PACK, "04_brand_hits_after.txt"), e.stdout || "");
}

log("=== INSTALL (SAFE) ===");
try {
  const installOutput = execSync("npm install --ignore-scripts", { encoding: "utf8" });
  tee(path.join(PROOF_PACK, "05_npm_install_ignore_scripts.txt"), installOutput);
} catch (e) {
  tee(path.join(PROOF_PACK, "05_npm_install_ignore_scripts.txt"), e.stdout || e.message);
}

try {
  const depsOutput = execSync("npx electron-builder install-app-deps", { encoding: "utf8" });
  tee(path.join(PROOF_PACK, "06_install_app_deps.txt"), depsOutput);
} catch (e) {
  tee(path.join(PROOF_PACK, "06_install_app_deps.txt"), e.stdout || e.message);
}

log("=== VERIFY ===");
try {
  const verifyOutput = execSync("npm run verify", { encoding: "utf8" });
  tee(path.join(PROOF_PACK, "07_npm_verify.txt"), verifyOutput);
} catch (e) {
  tee(path.join(PROOF_PACK, "07_npm_verify.txt"), e.stdout || e.message);
}

log("=== TESTS ===");
try {
  const testOutput = execSync("npm test", { encoding: "utf8" });
  tee(path.join(PROOF_PACK, "08_npm_test.txt"), testOutput);
} catch (e) {
  tee(path.join(PROOF_PACK, "08_npm_test.txt"), e.stdout || e.message);
}

log("=== BUILD RELEASE PACK ===");
try {
  const buildOutput = execSync("node scripts/build_release_pack.js --out ./dist_test", { encoding: "utf8" });
  tee(path.join(PROOF_PACK, "09_build_release_pack.txt"), buildOutput);
} catch (e) {
  tee(path.join(PROOF_PACK, "09_build_release_pack.txt"), e.stdout || e.message);
}

log("=== DIST_TEST LISTING ===");
try {
  const listOutput = execSync("dir ./dist_test /s", { encoding: "utf8" });
  tee(path.join(PROOF_PACK, "10_dist_test_listing.txt"), listOutput);
} catch (e) {
  tee(path.join(PROOF_PACK, "10_dist_test_listing.txt"), e.stdout || e.message);
}

log("=== VERIFY RELEASE PACK ===");
try {
  const verifyPackOutput = execSync("node scripts/verify_release_pack.js --in ./dist_test", { encoding: "utf8" });
  tee(path.join(PROOF_PACK, "11_verify_release_pack.txt"), verifyPackOutput);
} catch (e) {
  tee(path.join(PROOF_PACK, "11_verify_release_pack.txt"), e.stdout || e.message);
}

log("=== DONE ===");
