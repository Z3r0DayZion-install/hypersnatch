const detectCDN = require('../src/forensics/detectCDN');
const parseTimeline = require('../src/forensics/parseTimeline');
const fs = require('fs');
const path = require('path');

console.log("=========================================");
console.log("  PHASE 5: CDN DETECTION TEST          ");
console.log("=========================================\n");

const targetDir = path.resolve(__dirname, '..', 'tests', 'evidence', 'target_2_hls');
const harPath = path.join(targetDir, 'har_classified.json');

const harData = JSON.parse(fs.readFileSync(harPath, 'utf8'));
const timeline = parseTimeline(harData);

console.log("1. Executing CDN footprint analysis...");
const cdnProfile = detectCDN(timeline);

let passed = 0;
let failed = 0;

const assert = (condition, message) => {
    if (condition) {
        console.log(`  [PASS] ${message}`);
        passed++;
    } else {
        console.error(`  [FAIL] ${message}`);
        failed++;
    }
};

assert(cdnProfile.evidenceHost === 'test-streams.mux.dev', `Evaluated Primary Media Origin: ${cdnProfile.evidenceHost}`);
assert(cdnProfile.cdn === 'Mux Video', `Successfully fingerprinted CDN platform: ${cdnProfile.cdn}`);
assert(cdnProfile.confidence >= 0.90, `Diagnostic Confidence Index: ${(cdnProfile.confidence * 100).toFixed(0)}%`);

console.log("\n=========================================");
console.log(`  RESULTS: ${passed} Passed | ${failed} Failed`);
console.log("=========================================\n");

if (failed > 0) process.exit(1);
