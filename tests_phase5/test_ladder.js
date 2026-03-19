const buildStreamLadder = require('../src/forensics/buildStreamLadder');
const fs = require('fs');
const path = require('path');

console.log("=========================================");
console.log("  PHASE 5: STREAM LADDER BUILDER TEST ");
console.log("=========================================\n");

const targetDir = path.resolve(__dirname, '..', 'tests', 'evidence', 'target_0_html5');
const m3u8TestPath = path.resolve(__dirname, '..', 'tests', 'evidence', 'target_4_dash', 'manifest.mpd');

// Mock a standard HLS master playlist for reliable parsing assertion
const expectedHlsBuffer = `
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2"
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
`;

console.log("1. Parsing Master M3U8 HLS Mock...");
const ladder = buildStreamLadder(expectedHlsBuffer, 'https://test.com/master.m3u8');

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

assert(ladder.protocol === 'hls', "Protocol designated as HLS");
assert(ladder.levels.length === 3, `Ladder identified ${ladder.levels.length} adaptive tiers`);

// Highest bitrate should be sorted to index 0
const topTier = ladder.levels[0];
assert(topTier.resolution === '1920x1080', "Identified Top Tier Resolution: 1080p");
assert(topTier.bitrate === 3000000, "Identified Top Tier Bitrate: 3Mbps");

console.log("\n=========================================");
console.log(`  RESULTS: ${passed} Passed | ${failed} Failed`);
console.log("=========================================\n");

if (failed > 0) process.exit(1);
