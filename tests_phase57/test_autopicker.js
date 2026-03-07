const assert = require('assert');
const AutoPicker = require('../src/core/auto-picker');

function runTests() {
    console.log("=== HyperSnatch Phase 57 AutoPicker Tests ===");

    // Mock candidates
    const highConf = [
        { url: 'https://cdn.example.com/video1.mp4', finalScore: 0.9, host: 'cdn.example.com' },
        { url: 'https://cdn.example.com/video2.mp4', finalScore: 0.7, host: 'cdn.example.com' }
    ];

    const lowConf = [
        { url: 'https://cdn.example.com/video3.mp4', finalScore: 0.3, host: 'cdn.example.com' }
    ];

    const tiedConf = [
        { url: 'https://cdn.example.com/tie1.mp4', finalScore: 0.85, host: 'cdn.example.com' },
        { url: 'https://cdn.example.com/tie2.mp4', finalScore: 0.84, host: 'cdn.example.com' }
    ];

    // 1. Basic High Confidence Auto-Pick
    console.log("[1/4] Testing High Confidence Auto-Pick...");
    const pick1 = AutoPicker.pick(highConf, { autoSelect: true });
    assert.strictEqual(pick1.url, highConf[0].url, "Should pick the highest score candidate");
    console.log("  -> Passed.");

    // 2. Minimum Confidence Threshold
    console.log("[2/4] Testing Minimum Confidence Threshold...");
    const pick2 = AutoPicker.pick(lowConf, { autoSelect: true, minConfidence: 0.4 });
    assert.strictEqual(pick2, null, "Should return null for low confidence candidates");
    console.log("  -> Passed.");

    // 3. Manual Mode (autoSelect: false)
    console.log("[3/4] Testing Manual Mode (autoSelect: false)...");
    const pick3 = AutoPicker.pick(highConf, { autoSelect: false });
    assert.strictEqual(pick3, null, "Should not auto-pick when autoSelect is false");
    console.log("  -> Passed.");

    // 4. Default Confidence Threshold (0.4)
    console.log("[4/4] Testing Default Confidence Threshold...");
    const pick4 = AutoPicker.pick([{ url: 'test', finalScore: 0.39 }], { autoSelect: true });
    assert.strictEqual(pick4, null, "Should reject below 0.4 by default");
    const pick5 = AutoPicker.pick([{ url: 'test', finalScore: 0.41 }], { autoSelect: true });
    assert.ok(pick5, "Should accept above 0.4 by default");
    console.log("  -> Passed.");

    console.log("\n=============================================");
    console.log("ALL PHASE 57 AUTOPICKER TESTS PASSED! ✅");
    console.log("=============================================\n");
}

try {
    runTests();
} catch (err) {
    console.error("TEST FAILED:", err);
    process.exit(1);
}
