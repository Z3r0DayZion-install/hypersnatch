#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

console.log("🧪 HyperSnatch - Basic Tests");
console.log("============================");

let testsPassed = 0;
let testsTotal = 0;

function test(name, condition, message) {
  testsTotal++;
  if (condition) {
    console.log(`✅ TEST PASSED: ${name}`);
    testsPassed++;
  } else {
    console.log(`❌ TEST FAILED: ${name} - ${message}`);
  }
}

// Test 1: Check required files exist
test("Required file: hypersnatch.html", fs.existsSync("hypersnatch.html"), "Main HTML file missing");
test("Required file: package.json", fs.existsSync("package.json"), "Package.json missing");
test("Required file: src/main.js", fs.existsSync("src/main.js"), "Main process file missing");
test("Required file: src/preload.js", fs.existsSync("src/preload.js"), "Preload script missing");

// Test 2: Check package.json structure
try {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  test("Package.json has name", !!pkg.name, "Package name missing");
  test("Package.json has version", !!pkg.version, "Package version missing");
  test("Package.json has scripts", !!pkg.scripts, "Scripts section missing");
  test("Package name is 'hypersnatch'", pkg.name === "hypersnatch", "Package name should be 'hypersnatch'");
  test("App ID is correct", pkg.build?.appId === "com.hypersnatch.platform", "App ID should be 'com.hypersnatch.platform'");
} catch (e) {
  console.log(`❌ PACKAGE.JSON PARSING ERROR: ${e.message}`);
}

// Test 3: Check HTML file content
try {
  const html = fs.readFileSync("hypersnatch.html", "utf8");
  test("HTML contains HyperSnatch title", html.includes("HyperSnatch"), "HTML should contain HyperSnatch title");
} catch (e) {
  console.log(`❌ HTML READING ERROR: ${e.message}`);
}

// Test 4: Check scripts directory
test("Scripts directory exists", fs.existsSync("scripts"), "Scripts directory missing");
test("Brand purge script exists", fs.existsSync("scripts/brand_purge.js"), "Brand purge script missing");
test("Tear compile script exists", fs.existsSync("scripts/tear-compile.js"), "Tear compile script missing");
test("Build release script exists", fs.existsSync("scripts/build_release_pack.js"), "Build release script missing");
test("Verify release script exists", fs.existsSync("scripts/verify_release_pack.js"), "Verify release script missing");

// Test 5: Check config directory
test("Config directory exists", fs.existsSync("config"), "Config directory missing");

// Test 6: Check for Node.js and npm
try {
  const nodeVersion = process.version;
  test("Node.js version valid", nodeVersion.startsWith("v"), "Invalid Node.js version");
} catch (e) {
  console.log(`❌ NODE.JS VERSION ERROR: ${e.message}`);
}

// Results
console.log("\n============================");
console.log(`📊 Test Results: ${testsPassed}/${testsTotal} passed`);
console.log(`📈 Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%`);

if (testsPassed === testsTotal) {
  console.log("🎉 ALL TESTS PASSED!");
  process.exit(0);
} else {
  console.log("💥 SOME TESTS FAILED!");
  process.exit(1);
}
