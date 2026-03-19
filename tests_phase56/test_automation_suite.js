const assert = require('assert');
const path = require('path');
const clipboardHistory = require('../src/automation/clipboardHistory');
const { matchStrict } = require('../src/automation/hostSignatureRules');
const decodeQueue = require('../src/automation/decodeQueue');
const rateLimiter = require('../src/automation/rateLimiter');
const clipboardWatcher = require('../src/automation/clipboardWatcher');

async function runTests() {
    console.log("=== HyperSnatch Phase 56 Automation Suite ===");

    // 1. Host Signatures Strict Regex Rules
    console.log("[1/5] Testing Host Strict Signature Rules...");
    const validUrl = "https://rapidgator.net/file/123abc456/test_file.zip";
    const validUrl2 = "http://www.kshared.com/file/xx1234/vid.mp4";
    const invalidUrl = "https://example.com/rapidgator/fake";

    const m1 = matchStrict(validUrl);
    assert.strictEqual(m1.host, "RAPIDGATOR", "Should match Rapidgator strict rule");

    const m2 = matchStrict(validUrl2);
    assert.strictEqual(m2.host, "KSHARED", "Should match KShared strict rule");

    const m3 = matchStrict(invalidUrl);
    assert.strictEqual(m3, null, "Should reject loose partial matches");
    console.log("  -> Passed. Rigid host mapping enforced.");

    // 2. Clipboard History Memory Engine
    console.log("[2/5] Testing Clipboard History Debouncing...");
    clipboardHistory.clear();
    clipboardHistory.ttlMs = 1000; // 1 second memory

    assert.ok(!clipboardHistory.has(validUrl), "Should not have url initially");
    clipboardHistory.add(validUrl);
    assert.ok(clipboardHistory.has(validUrl), "Should have url after adding");

    // Wait to expire
    await new Promise(r => setTimeout(r, 1200));
    assert.ok(!clipboardHistory.has(validUrl), "Should clear memory after TTL drops");
    console.log("  -> Passed. Memory leak loop prevention works.");

    // 3. Rate Limiter Burst Mechanism
    console.log("[3/5] Testing Token Bucket Rate Limiter...");
    rateLimiter.maxTokens = 3;
    rateLimiter.tokens = 3;
    rateLimiter.msPerToken = 1000; // 1 per sec
    rateLimiter.lastRefill = Date.now();

    assert.ok(rateLimiter.canExecute(), "Should have initial tokens");
    assert.ok(rateLimiter.recordExecution()); // 2 left
    assert.ok(rateLimiter.recordExecution()); // 1 left
    assert.ok(rateLimiter.recordExecution()); // 0 left
    assert.ok(!rateLimiter.canExecute(), "Should be throttled down to 0 tokens");

    await new Promise(r => setTimeout(r, 1100));
    assert.ok(rateLimiter.canExecute(), "Should refill 1 token after delay");
    console.log("  -> Passed. Throttler mitigates IP-ban cascades.");

    // 4. Decode Queue State Engine
    console.log("[4/5] Testing Decode Stateful Queue...");
    // Clear any existing
    decodeQueue.queue = [];
    decodeQueue.history = [];

    const job1 = decodeQueue.enqueue(validUrl, "RAPIDGATOR");
    assert.ok(job1.id, "Job created");
    assert.strictEqual(job1.status, 'pending');

    // Try queuing duplicate
    const job2 = decodeQueue.enqueue(validUrl, "RAPIDGATOR");
    assert.strictEqual(job2, null, "Should block duplicate active enqueues");

    // Dequeue processing
    const popped = decodeQueue.dequeue();
    assert.strictEqual(popped.id, job1.id);
    assert.strictEqual(popped.status, 'active');

    decodeQueue.updateStatus(popped.id, 'completed');
    assert.strictEqual(decodeQueue.getQueue().length, 0, "Queue empty after finish");
    assert.strictEqual(decodeQueue.getHistory().length, 1, "Moved to history");
    console.log("  -> Passed. Stateful enqueuing/dequeueing ensures serial safety.");

    // 5. Watcher Integration Logic
    console.log("[5/5] Testing Clipboard Orchestrator (Pulse Evaluator)...");
    clipboardHistory.clear();
    decodeQueue.queue = [];
    clipboardWatcher.setMode('AUTO DECODE');

    let mockedClipboard = validUrl2;
    clipboardWatcher.setProvider(async () => mockedClipboard);

    // Inject mock event handler to catch the emit
    let events = [];
    clipboardWatcher.setEventHandler((t, d) => events.push(t));

    await clipboardWatcher._poll();
    assert.ok(events.includes('CLIPBOARD_MATCH'), "Should fire match event");
    assert.ok(events.includes('QUEUE_ADDED'), "Should add to queue");
    assert.strictEqual(decodeQueue.getQueue().length, 1, "Queue holds mapped target");

    // Second poll should hit history debounce
    await clipboardWatcher._poll();
    assert.strictEqual(decodeQueue.getQueue().length, 1, "Second poll shouldn't add duplicate");
    console.log("  -> Passed. Orchestrator integrates Modules Rules 1-5 correctly.");

    console.log("\n=============================================");
    console.log("ALL PHASE 56 METRICS & QUEUE TESTS PASSED! ✅");
    console.log("=============================================\n");
    process.exit(0);
}

runTests().catch(err => {
    console.error("TEST FAILED:", err);
    process.exit(1);
});
