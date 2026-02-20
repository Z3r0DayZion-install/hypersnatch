#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying HyperSnatch Release Pack");
console.log("====================================");

const distPath = process.argv[2] || "./dist_test";

if (!fs.existsSync(distPath)) {
  console.error(`❌ Directory not found: ${distPath}`);
  process.exit(1);
}

let errors = 0;
let warnings = 0;

function checkFile(filePath, description) {
  const fullPath = path.join(distPath, filePath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`✅ ${description}: ${filePath} (${stats.size} bytes)`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} - MISSING`);
    errors++;
    return false;
  }
}

function checkDir(dirPath, description) {
  const fullPath = path.join(distPath, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    console.log(`✅ ${description}: ${dirPath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${dirPath} - MISSING`);
    errors++;
    return false;
  }
}

console.log("\n📁 Checking required files...");
checkFile("hypersnatch.html", "Main HTML file");
checkFile("package.json", "Package configuration");
checkFile("manifest.json", "Release manifest");

console.log("\n📂 Checking source files...");
checkFile("src/main.js", "Main process");
checkFile("src/preload.js", "Preload script");

console.log("\n📋 Checking scripts...");
checkFile("scripts/brand_purge.js", "Brand purge script");
checkFile("scripts/tear-compile.js", "Tear compile script");
checkFile("scripts/build_release_pack.js", "Build script");
checkFile("scripts/verify_release_pack.js", "Verify script");
checkFile("scripts/test_basic.js", "Test script");

console.log("\n📁 Checking directories...");
checkDir("config", "Configuration directory");
checkDir("runtime", "Runtime directory");
checkDir("logs", "Logs directory");
checkDir("evidence", "Evidence directory");
checkDir("exports", "Exports directory");

console.log("\n📋 Checking package.json...");
try {
  const pkgPath = path.join(distPath, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  
  if (pkg.name === "hypersnatch") {
    console.log("✅ Package name correct");
  } else {
    console.log(`❌ Package name incorrect: ${pkg.name}`);
    errors++;
  }
  
  if (pkg.build?.appId === "com.hypersnatch.platform") {
    console.log("✅ App ID correct");
  } else {
    console.log(`❌ App ID incorrect: ${pkg.build?.appId}`);
    errors++;
  }
} catch (e) {
  console.log(`❌ Package.json parsing error: ${e.message}`);
  errors++;
}

console.log("\n🔍 Checking for Platform references...");
try {
  const htmlPath = path.join(distPath, "hypersnatch.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  
  if (html.toLowerCase().includes("Platform")) {
    console.log("❌ Platform references found in HTML");
    errors++;
  } else {
    console.log("✅ No Platform references in HTML");
  }
} catch (e) {
  console.log(`❌ HTML check error: ${e.message}`);
  errors++;
}

console.log("\n====================================");
console.log(`📊 Verification Results:`);
console.log(`   Errors: ${errors}`);
console.log(`   Warnings: ${warnings}`);

if (errors === 0) {
  console.log("🎉 VERIFICATION PASSED!");
  console.log("✅ HyperSnatch release pack is ready for distribution!");
  process.exit(0);
} else {
  console.log("💥 VERIFICATION FAILED!");
  console.log("❌ Fix errors before distribution.");
  process.exit(1);
}
