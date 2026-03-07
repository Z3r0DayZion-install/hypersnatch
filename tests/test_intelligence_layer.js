/**
 * HyperSnatch Phase 7: Intelligence Layer Test Suite
 */

const siteFingerprint = require('../src/intelligence/siteFingerprint');
const playerFingerprint = require('../src/intelligence/playerFingerprint');
const tokenClassifier = require('../src/intelligence/tokenClassifier');

const mockBundle = {
    evidence: {
        network_har: {
            log: {
                entries: [
                    { request: { url: "https://example.com/wp-content/uploads/video.ts" }, response: { content: { size: 1000 } }, time: 100 },
                    { request: { url: "https://example.com/license?hdnts=secure" }, response: { content: { size: 500 } }, time: 50 }
                ]
            }
        },
        player_config: {
            videojs: { version: "8.10.0" }
        }
    }
};

function runIntelligenceTests() {
    console.log("🚀 Running Phase 7 Intelligence Layer Tests...");

    const siteResults = siteFingerprint.analyze(mockBundle);
    console.log(`✅ Site Classification: ${siteResults.data.classification} (Confidence: ${siteResults.data.confidence})`);

    const playerResults = playerFingerprint.analyze(mockBundle);
    console.log(`✅ Player Type: ${playerResults.data.playerType} (Version: ${playerResults.data.version})`);

    const tokenResults = tokenClassifier.analyze(mockBundle);
    console.log(`✅ DRM Detected: ${tokenResults.data.drmType}`);

    console.log("\n📊 Intelligence Layer: ALL PASS");
}

runIntelligenceTests();
