const parseTimeline = require('../src/forensics/parseTimeline');
const fs = require('fs');
const path = require('path');

console.log("=========================================");
console.log("  PHASE 5: TIMELINE PARSER TEST");
console.log("=========================================\n");

const targetDir = path.resolve(__dirname, '..', 'tests', 'evidence', 'target_2_hls');
const harPath = path.join(targetDir, 'har_classified.json');

if (!fs.existsSync(harPath)) {
    console.error(`[SKIP] Missing har_classified.json for target_2_hls. Ensure Phase 3 extraction completed.`);
    process.exit(0);
}

const harData = JSON.parse(fs.readFileSync(harPath, 'utf8'));

console.log("1. Parsing Timeline from target_2_hls HAR...");
const timeline = parseTimeline(harData);

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

assert(Array.isArray(timeline), "Timeline is an array");
assert(timeline.length > 0, `Timeline extracted ${timeline.length} total events`);

// Verify indexing and structure
const firstEvent = timeline[0];
assert(firstEvent.index === 0, "Events are properly indexed");
assert(typeof firstEvent.url === 'string', "Event contains a URL string");
assert(typeof firstEvent.classification === 'string', "Event contains a classification string");

// Count classifications to ensure mapping worked
const manifests = timeline.filter(e => e.classification === 'manifest');
const segments = timeline.filter(e => e.classification === 'segment');

assert(manifests.length > 0, `Successfully mapped ${manifests.length} manifest events`);
assert(segments.length > 0, `Successfully mapped ${segments.length} segment events`);

console.log("\n=========================================");
console.log(`  RESULTS: ${passed} Passed | ${failed} Failed`);
console.log("=========================================\n");

if (failed > 0) process.exit(1);
