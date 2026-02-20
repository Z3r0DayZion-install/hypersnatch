#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

console.log("🏗️ Building HyperSnatch Release Pack");
console.log("==================================");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist_test");

// Clean and create dist directory
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

// Copy src directory
const srcDir = path.join(DIST, "src");
fs.mkdirSync(srcDir, { recursive: true });

const srcFiles = ["main.js", "preload.js"];
console.log("📂 Copying source files...");
for (const file of srcFiles) {
  const src = path.join(ROOT, "src", file);
  const dest = path.join(srcDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied src: ${file}`);
  } else {
    console.log(`❌ Missing src: ${file}`);
  }
}

// Copy core files
const coreFiles = [
  "hypersnatch.html",
  "package.json"
];

console.log("📦 Copying core files...");
for (const file of coreFiles) {
  const src = path.join(ROOT, file);
  const dest = path.join(DIST, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied: ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
  }
}

// Copy additional helper files
const helperFiles = [
  "constants.js",
  "utils.js", 
  "helpers.js",
  "extensions.js",
  "ui-components.js",
  "enhancements.js"
];

console.log("📋 Copying helper files...");
for (const file of helperFiles) {
  const src = path.join(ROOT, "src", file);
  const dest = path.join(DIST, "src", file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied helper: ${file}`);
  } else {
    console.log(`❌ Missing helper: ${file}`);
  }
}

// Copy core batch processing files
const coreBatchFiles = [
  "batch-processor.js",
  "input-detector.js"
];

console.log("📋 Copying core batch files...");
for (const file of coreBatchFiles) {
  const src = path.join(ROOT, "core", file);
  const dest = path.join(DIST, "core", file);
  
  // Ensure destination directory exists
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied core batch: ${file}`);
  } else {
    console.log(`❌ Missing core batch: ${file}`);
  }
}

// Copy scripts directory
const scriptsDir = path.join(DIST, "scripts");
fs.mkdirSync(scriptsDir, { recursive: true });

const scriptFiles = [
  "brand_purge.js",
  "tear-compile.js", 
  "build_release_pack.js",
  "verify_release_pack.js",
  "test_basic.js"
];

console.log("📋 Copying scripts...");
for (const file of scriptFiles) {
  const src = path.join(ROOT, "scripts", file);
  const dest = path.join(scriptsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied script: ${file}`);
  } else {
    console.log(`❌ Missing script: ${file}`);
  }
}

// Copy config directory
const configSrc = path.join(ROOT, "config");
const configDest = path.join(DIST, "config");
if (fs.existsSync(configSrc)) {
  fs.mkdirSync(configDest, { recursive: true });
  const configFiles = fs.readdirSync(configSrc);
  for (const file of configFiles) {
    const src = path.join(configSrc, file);
    const dest = path.join(configDest, file);
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied config: ${file}`);
  }
} else {
  console.log("❌ Config directory missing");
}

// Create empty required directories
const emptyDirs = ["runtime", "logs", "evidence", "exports"];
for (const dir of emptyDirs) {
  const dirPath = path.join(DIST, dir);
  fs.mkdirSync(dirPath, { recursive: true });
  console.log(`✅ Created directory: ${dir}`);
}

// Create manifest
const manifest = {
  name: "HyperSnatch",
  version: "1.0.0",
  description: "Security-First Evidence Analyzer",
  buildTime: new Date().toISOString(),
  files: coreFiles,
  directories: ["scripts", "config", "runtime", "logs", "evidence", "exports"]
};

fs.writeFileSync(
  path.join(DIST, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

console.log("✅ Build complete!");
console.log(`📁 Output: ${DIST}`);
console.log("🎉 HyperSnatch release pack ready!");
