const detectTokenPatterns = require('../src/forensics/detectTokenPatterns');

console.log("=========================================");
console.log("  PHASE 5: TOKEN DETECTION TEST        ");
console.log("=========================================\n");

// Offline mock of candidate structure mapped by Phase 3 extraction
const mockCandidates = [
    { url: "https://test.mux.dev/video.mp4?sig=abcdef123&ttl=167890" },
    { url: "https://akamai-edge.net/stream.m3u8?hdnts=st=123~exp=456~acl=/*~hmac=abcd1234efgh" },
    { url: "https://cloudfront.net/out.mpd?Policy=eyJTdGF0ZW1&Signature=aX7f5&Key-Pair-Id=APK123" }
];

console.log("1. Running pattern footprinting on candidate dataset...");
const tokens = detectTokenPatterns(mockCandidates);

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

assert(tokens.detected === true, "Token usage signature detected on candidates");
assert(tokens.tokenTypes.includes('Akamai Edge Authorization'), "Fingerprinted Akamai 'hdnts' schema");
assert(tokens.tokenTypes.includes('AWS CloudFront Policy'), "Fingerprinted CloudFront secure policy schema");
assert(tokens.tokenTypes.includes('Signature Hash'), "Fingerprinted generic signature enforcement");
assert(tokens.sampleParameters.length > 0, "Obtained redacted token sample artifacts");

console.log("\n=========================================");
console.log(`  RESULTS: ${passed} Passed | ${failed} Failed`);
console.log("=========================================\n");

if (failed > 0) process.exit(1);
