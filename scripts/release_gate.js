"use strict";

/**
 * release_gate.js
 *
 * Single-command release gate runner for HyperSnatch.
 * Runs the full required gate order in sequence, stops on first failure,
 * and prints a clear operator-readable summary.
 *
 * Usage:  npm run release:gate
 *
 * Gate order (per CLEAN_WORKTREE_RELEASE_FLOW.md):
 *   1. preflight      — environment assumptions check
 *   2. npm test       — unit tests
 *   3. verify:ui      — UI smoke / harness check
 *   4. build:wrapper  — release artifact build
 *   5. verify         — packaged artifact + signature boundary checks
 *   6. verify:asar    — asar module completeness + unpacked window launch proof
 *   7. audit:stable   — strict stable signoff (APPROVED required)
 */

const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const STEPS = [
  { name: "preflight",     cmd: "npm run preflight"      },
  { name: "test",          cmd: "npm test"                },
  { name: "verify:ui",     cmd: "npm run verify:ui"       },
  { name: "build:wrapper", cmd: "npm run build:wrapper"   },
  { name: "verify",        cmd: "npm run verify"          },
  { name: "verify:asar",   cmd: "npm run verify:asar"     },
  { name: "audit:stable",  cmd: "npm run audit:stable"    },
];

const WIDTH = 16;
const results = [];

console.log("\nHyperSnatch Release Gate");
console.log("=".repeat(60));

let aborted = false;
for (const step of STEPS) {
  if (aborted) {
    results.push({ name: step.name, status: "SKIP", detail: "skipped after failure" });
    continue;
  }
  process.stdout.write(`  Running ${step.name.padEnd(WIDTH)} ... `);
  try {
    execSync(step.cmd, { cwd: ROOT, stdio: "pipe" });
    console.log("PASS");
    results.push({ name: step.name, status: "PASS", detail: "" });
  } catch (err) {
    const detail = (err.stdout || err.stderr || "").toString().trim().split("\n").slice(-3).join(" | ");
    console.log("FAIL");
    results.push({ name: step.name, status: "FAIL", detail });
    aborted = true;
  }
}

console.log("=".repeat(60));
const failed = results.filter(r => r.status === "FAIL");
const skipped = results.filter(r => r.status === "SKIP");

if (failed.length === 0) {
  console.log("  RELEASE GATE: PASS — all steps passed; safe to tag and release");
  console.log("  Next: git tag -a vX.Y.Z <sha> -m 'HyperSnatch vX.Y.Z release'");
} else {
  console.log(`  RELEASE GATE: FAIL — stopped at step '${failed[0].name}'`);
  if (failed[0].detail) console.log(`  Detail: ${failed[0].detail}`);
  if (skipped.length) console.log(`  Skipped: ${skipped.map(s => s.name).join(", ")}`);
  console.log("  Fix the failure above and re-run: npm run release:gate");
}
console.log("");

process.exit(failed.length > 0 ? 1 : 0);
