const SmartDecode = require('../src/core/smartdecode');
const assert = require('assert');

async function testHostFolders() {
    console.log("Testing Phase 54: Multi-Host Folder Injection...");

    const testCases = [
        {
            url: "https://kshared.com/f/ab12cd34",
            host: "kshared.com",
            type: "folder",
            requiresExpansion: true
        },
        {
            url: "https://rapidgator.net/folder/xy98zw76",
            host: "rapidgator.net",
            type: "folder",
            requiresExpansion: true
        },
        {
            url: "https://nitroflare.com/folder/nf123456",
            host: "nitroflare.com",
            type: "folder",
            requiresExpansion: true
        },
        {
            url: "https://filelion.live/list/fl987654",
            host: "filelion.live",
            type: "folder",
            requiresExpansion: true
        }
    ];

    for (const tc of testCases) {
        console.log(`\nTesting ${tc.host}...`);
        const result = await SmartDecode.run(tc.url);

        // Output could either be single candidate or batch item if it was passed via batch runner
        // Since we pass a single URL, it should return a standard result object
        assert.ok(result && result.candidates && result.candidates.length > 0, `Should find candidate for ${tc.host}`);

        const cand = result.candidates[0];

        assert.strictEqual(cand.host, tc.host, `Host mismatch for ${tc.host}`);
        assert.strictEqual(cand.type, tc.type, `Type mismatch for ${tc.host}`);
        assert.strictEqual(cand.requiresExpansion, tc.requiresExpansion, `Expansion mismatch for ${tc.host}`);

        console.log(`✓ ${tc.host} passed folder test.`);
    }

    console.log("\nALL PHASE 54 FOLDER TESTS PASSED");
}

(async () => {
    try {
        await testHostFolders();
    } catch (err) {
        console.error("\nTEST FAILED:", err.message);
        process.exit(1);
    }
})();
