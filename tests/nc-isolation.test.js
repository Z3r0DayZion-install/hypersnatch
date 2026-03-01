// ==================== NEURALCACHE-CORE // ISOLATION TESTS ====================
"use strict";

const NeuralCacheCore = require('../src/core/neuralcache-core');
const assert = require('assert');

async function runTests() {
    console.log("--- Starting NeuralCache-Core Isolation Tests ---");

    // Test 1: Corrupt Ciphertext
    console.log("[Test 1] Testing Ciphertext Corruption...");
    NeuralCacheCore.deriveMasterKey("test-pass", "test-salt");
    const record = NeuralCacheCore.encryptRecord("Sensitive Data");
    
    // Flip 1 byte in ciphertext
    const corruptedCiphertext = Buffer.from(record.ciphertext, 'base64');
    corruptedCiphertext[0] = corruptedCiphertext[0] ^ 0xFF;
    record.ciphertext = corruptedCiphertext.toString('base64');

    try {
        NeuralCacheCore.decryptRecord(record);
        assert.fail("Should have failed decryption");
    } catch (err) {
        assert.strictEqual(err.message, "NC_CORE_INTEGRITY_FAILURE", "Unexpected error message");
        console.log("✅ Correctly rejected corrupted ciphertext.");
    }

    // Test 2: Version/Epoch Mismatch
    console.log("[Test 2] Testing Epoch/Version Mismatch...");
    const record2 = NeuralCacheCore.encryptRecord("More Sensitive Data");
    record2.version = "OLD-EPOCH-V0";
    try {
        NeuralCacheCore.decryptRecord(record2);
        assert.fail("Should have failed version check");
    } catch (err) {
        assert.strictEqual(err.message, "Epoch/Version Mismatch", "Unexpected error message");
        console.log("✅ Correctly rejected older epoch version.");
    }

    // Test 3: Manifest Tampering
    console.log("[Test 3] Testing Manifest Tampering...");
    const files = [
        { path: 'evidence.json', hash: 'a1b2c3d4' },
        { path: 'report.pdf', hash: 'e5f6g7h8' }
    ];
    const manifest = NeuralCacheCore.generateManifest(files);
    
    // Tamper with a hash
    files[0].hash = 'DEADBEEF';
    const tamperedManifest = NeuralCacheCore.generateManifest(files);
    
    assert.notStrictEqual(manifest.hash, tamperedManifest.hash, "Manifest hashes should differ");
    console.log("✅ Correctly detected manifest tampering.");

    // Test 4: Device Key Isolation (Timing Safe Check)
    console.log("[Test 4] Testing Device Key Isolation...");
    const data = "Forensic Manifest Content";
    const sig = NeuralCacheCore.signWithDevice(data, "CPU-01", "BASE-01");
    
    const isValid = NeuralCacheCore.verifyDeviceSeal(data, sig, "CPU-01", "BASE-01");
    const isInvalid = NeuralCacheCore.verifyDeviceSeal(data, sig, "CPU-02", "BASE-01");
    
    assert.strictEqual(isValid, true, "Valid seal should be accepted");
    assert.strictEqual(isInvalid, false, "Invalid seal (wrong hardware) should be rejected");
    console.log("✅ Correctly enforced hardware-bound signature isolation.");

    // Test 5: Key Purge Isolation
    console.log("[Test 5] Testing Session Purge Isolation...");
    NeuralCacheCore.purge();
    try {
        NeuralCacheCore.encryptRecord("Secret");
        assert.fail("Should have failed after purge");
    } catch (err) {
        assert.strictEqual(err.message, "Master Key Not Derived", "Unexpected error message");
        console.log("✅ Correctly purged internal session material.");
    }

    // Test 6: Corrupted Auth Tag
    console.log("[Test 6] Testing Auth Tag Corruption...");
    NeuralCacheCore.deriveMasterKey("test-pass", "test-salt");
    const record3 = NeuralCacheCore.encryptRecord("Auth Tag Test");
    const corruptedTag = Buffer.from(record3.tag, 'base64');
    corruptedTag[0] = corruptedTag[0] ^ 0xFF; // Flip 1 bit
    record3.tag = corruptedTag.toString('base64');
    try {
        NeuralCacheCore.decryptRecord(record3);
        assert.fail("Should have failed due to auth tag corruption");
    } catch (err) {
        assert.strictEqual(err.message, "NC_CORE_INTEGRITY_FAILURE", "Unexpected error message");
        console.log("✅ Correctly rejected corrupted auth tag.");
    }

    // Test 7: Corrupted IV
    console.log("[Test 7] Testing IV Corruption...");
    const record4 = NeuralCacheCore.encryptRecord("IV Test");
    const corruptedIV = Buffer.from(record4.iv, 'base64');
    corruptedIV[0] = corruptedIV[0] ^ 0xFF; // Flip 1 bit
    record4.iv = corruptedIV.toString('base64');
    try {
        NeuralCacheCore.decryptRecord(record4);
        assert.fail("Should have failed due to IV corruption");
    } catch (err) {
        assert.strictEqual(err.message, "NC_CORE_INTEGRITY_FAILURE", "Unexpected error message");
        console.log("✅ Correctly rejected corrupted IV.");
    }

    console.log("--- All Isolation Tests Passed ---");
}

runTests().catch(err => {
    console.error("❌ Test Suite Failed:", err);
    process.exit(1);
});
