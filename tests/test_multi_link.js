const SmartDecode = require('../src/core/smartdecode');
const assert = require('assert');

async function testMultiLink() {
    console.log("Testing Phase 53: Multi-Link Paste Handler...");

    const input = `
        Check these out:
        https://emload.com/file/12345/video.mp4
        And this one too:
        https://kshared.com/f/67890
        Mixed with some garbage text.
    `;

    const result = await SmartDecode.run(input);

    assert.strictEqual(result.batch, true, "Should detect batch mode");
    assert.strictEqual(result.jobs.length, 2, "Should have 2 discrete jobs");

    console.log("✓ Multi-Link Detection Passed");

    // Verify individual jobs
    assert.ok(result.jobs[0].candidates.length > 0, "Job 1 should have candidates");
    assert.strictEqual(result.jobs[0].candidates[0].host, 'emload.com');

    assert.ok(result.jobs[1].candidates.length > 0, "Job 2 should have candidates");
    assert.strictEqual(result.jobs[1].candidates[0].host, 'kshared.com');

    console.log("✓ Discrete Job Validation Passed");
}

async function testFolderDetection() {
    console.log("Testing Phase 53: Emload Folder Detection...");

    const input = "https://emload.com/folder/abcde12345";
    const result = await SmartDecode.run(input);

    const cand = result.candidates[0];
    assert.strictEqual(cand.type, 'folder', "Should identify as folder");
    assert.strictEqual(cand.requiresExpansion, true, "Should require expansion");

    console.log("✓ Emload Folder Detection Passed");
}

(async () => {
    try {
        await testMultiLink();
        await testFolderDetection();
        console.log("\nALL PHASE 53 TESTS PASSED");
    } catch (err) {
        console.error("\nTEST FAILED:", err.message);
        process.exit(1);
    }
})();
