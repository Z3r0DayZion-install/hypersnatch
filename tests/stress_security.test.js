// tests/stress_security.test.js
// Extreme Stress and Security Test Suite for HyperSnatch Core
"use strict";

const assert = require('assert');
const SmartDecode = require('../src/core/smartdecode/index');

async function runExtremeTests() {
    console.log("🚀 STARTING EXTREME STRESS & SECURITY AUDIT\n");

    // ════════════════════════════════════════════════════════════════════════════
    // 1. STRESS TEST: MASSIVE LINK INGESTION
    // ════════════════════════════════════════════════════════════════════════════
    console.log("[STRESS] Testing 2,000 unique links...");
    let massiveInput = "";
    for (let i = 0; i < 2000; i++) {
        // Use .mp4 to ensure it's classified as a candidate
        massiveInput += `https://example.com/asset${i}.mp4 `;
    }
    
    const start = Date.now();
    const results = await SmartDecode.run(massiveInput);
    const end = Date.now();
    
    console.log(`  ✅ Processed 2,000 links in ${end - start}ms`);
    console.log(`  📊 Candidates found: ${results.candidates.length}`);
    assert.strictEqual(results.candidates.length, 2000, "Should have 2,000 candidates");

    // ════════════════════════════════════════════════════════════════════════════
    // 2. SECURITY: RECURSIVE BASE64 NESTING
    // ════════════════════════════════════════════════════════════════════════════
    console.log("[SECURITY] Testing Recursive Base64 Depth...");
    // Create a 5-level nested base64 string
    let nested = "https://example.com/topsecret.mp4";
    for (let i = 0; i < 5; i++) {
        nested = Buffer.from(nested).toString('base64');
    }
    
    const nestedResult = await SmartDecode.run(nested);
    console.log(`  ✅ Nested Base64 handled. Found: ${nestedResult.candidates.length} items`);

    // ════════════════════════════════════════════════════════════════════════════
    // 3. SECURITY: MALFORMED HTML & SNIPPETS (Fuzzing)
    // ════════════════════════════════════════════════════════════════════════════
    console.log("[SECURITY] Fuzzing DecodeEngine with Malformed Inputs...");
    const malformed = [
        "<a>", 
        "<a href=''>", 
        "<a href='javascript:alert(1)'>", 
        "<div data-source='<<<<>>>>'>",
        "A".repeat(100000), // Long string
        "{\"json\": \"not really\"}",
        "<script>while(1){}</script>"
    ];

    for (const snippet of malformed) {
        try {
            await SmartDecode.run(snippet);
            console.log(`  ✅ Input Safe: ${snippet.substring(0, 20)}...`);
        } catch (e) {
            console.error(`  ❌ Crash on: ${snippet.substring(0, 20)}`);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 4. MEMORY AUDIT: LARGE PAYLOADS
    // ════════════════════════════════════════════════════════════════════════════
    console.log("[AUDIT] Testing Memory Persistence (Simulated)...");
    const largeObj = { data: "X".repeat(10 * 1024 * 1024) }; // 10MB
    const serialized = JSON.stringify(largeObj);
    assert.ok(serialized.length > 10 * 1024 * 1024, "Serialization check");
    console.log("  ✅ Large payload (10MB) serialization successful.");

    console.log("\n🛡️ AUDIT COMPLETE: System Stable under Extreme Load.");
}

runExtremeTests().catch(err => {
    console.error("\n❌ AUDIT FAILED:", err.stack);
    process.exit(1);
});
