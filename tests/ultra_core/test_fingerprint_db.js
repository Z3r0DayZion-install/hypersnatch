const { FingerprintDB } = require('../../src/core/smartdecode/fingerprint_db');
const assert = require('assert');

async function runTests() {
    console.log("=== Testing FingerprintDB ===");
    const db = new FingerprintDB();

    // Test 1: VideoJS Match
    const videoJsContext = {
        domSnapshot: `<div class="video-js vjs-default-skin"><video></video></div><script src="video.min.js"></script>`,
        playerConfig: `{"videojs": true, "playerParams": {}}`,
        streamTrace: []
    };

    const res1 = db.matchFingerprint(videoJsContext);
    console.log("Test 1 Result:", res1);
    assert.strictEqual(res1.player, "VideoJS", "Failed to identify VideoJS");
    assert(parseFloat(res1.confidence) > 0.5, "Confidence too low for VideoJS match");
    console.log("✅ VideoJS Match Successful\n");

    // Test 2: JWPlayer Match
    const jwPlayerContext = {
        domSnapshot: `<div id="jwplayer_container" class="jwplayer"><video></video></div><script src="jwplayer.js"></script>`,
        playerConfig: `{"jwplayer": {"autostart": true}}`,
        streamTrace: ["[MSE] appendBuffer", "jwplayer().getPlaylist()"]
    };

    const res2 = db.matchFingerprint(jwPlayerContext);
    console.log("Test 2 Result:", res2);
    assert.strictEqual(res2.player, "JWPlayer", "Failed to identify JWPlayer");
    assert(parseFloat(res2.confidence) > 0.5, "Confidence too low for JWPlayer match");
    console.log("✅ JWPlayer Match Successful\n");

    // Test 3: Unknown Player
    const unknownContext = {
        domSnapshot: `<div class="random-player"></div><script src="app.js"></script>`,
        playerConfig: `{}`,
        streamTrace: []
    };

    const res3 = db.matchFingerprint(unknownContext);
    console.log("Test 3 Result:", res3);
    assert.strictEqual(res3.player, "Unknown", "Incorrectly identified an unknown player");
    console.log("✅ Unknown Player Handled Successfully\n");

    console.log("All FingerprintDB tests passed!");
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
