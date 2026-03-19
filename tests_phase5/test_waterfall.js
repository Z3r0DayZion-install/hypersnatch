const buildWaterfall = require('../src/forensics/buildWaterfall');
const parseTimeline = require('../src/forensics/parseTimeline');
const fs = require('fs');
const path = require('path');

console.log("=========================================");
console.log("  PHASE 5: WATERFALL BUILDER TEST     ");
console.log("=========================================\n");

const targetDir = path.resolve(__dirname, '..', 'tests', 'evidence', 'target_2_hls');
const harPath = path.join(targetDir, 'har_classified.json');

const harData = JSON.parse(fs.readFileSync(harPath, 'utf8'));
const timeline = parseTimeline(harData);

console.log("1. Building Waterfall from parsed timeline...");
const waterfall = buildWaterfall(timeline);

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

assert(waterfall.totalSegments === 4, `Waterfall detected ${waterfall.totalSegments} segment downloads (Expected 4)`);
assert(waterfall.clusters.length === 1, `Waterfall organized streams into ${waterfall.clusters.length} unified delivery cluster(s)`);

const cluster = waterfall.clusters[0];
assert(cluster.segmentCount === 4, `Delivery cluster tracked ${cluster.segmentCount} contiguous media segment requests`);
assert(cluster.host === 'test-streams.mux.dev', `Identified origin delivery node: ${cluster.host}`);

console.log("\n=========================================");
console.log(`  RESULTS: ${passed} Passed | ${failed} Failed`);
console.log("=========================================\n");

if (failed > 0) process.exit(1);
