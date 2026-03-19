"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const NODE = process.execPath;

const checks = [
  { name: "Platinum System", script: "tests/platinum_system.test.js" },
  { name: "Intelligence Layer", script: "tests/test_intelligence_layer.js" },
  { name: "Runtime Forensics", script: "tests/test_runtime_forensics.js" },
];

function runCheck(check) {
  console.log(`\n[VERIFY] ${check.name}`);
  const result = spawnSync(NODE, [check.script], {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`Check failed: ${check.name}`);
  }
}

function main() {
  console.log("====================================================");
  console.log(" HyperSnatch System Verification");
  console.log("====================================================");

  for (const check of checks) runCheck(check);

  console.log("\n====================================================");
  console.log(" SYSTEM VERIFICATION: PASS");
  console.log("====================================================");
}

try {
  main();
} catch (err) {
  console.error("\nSYSTEM VERIFICATION FAILED:", err.message);
  process.exit(1);
}
