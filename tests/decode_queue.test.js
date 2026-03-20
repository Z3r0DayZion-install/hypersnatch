// tests/decode_queue.test.js
// Unit tests for automation decode queue observability and control flow.

"use strict";

const assert = require("assert");
const decodeQueue = require("../src/automation/decodeQueue");

let passed = 0;
let failed = 0;

function resetQueue() {
    decodeQueue.queue = [];
    decodeQueue.history = [];
}

function test(name, fn) {
    try {
        resetQueue();
        fn();
        console.log(`  ✅ ${name}`);
        passed += 1;
    } catch (err) {
        console.error(`  ❌ ${name}: ${err.message}`);
        failed += 1;
    }
}

function run() {
    console.log("\n[1] Enqueue Observability");
    test("enqueue records timestamps/source/action log", () => {
        const job = decodeQueue.enqueue("https://example.com/stream.m3u8", null, { source: "operator" });
        assert.ok(job, "job should be enqueued");
        assert.strictEqual(job.source, "operator");
        assert.ok(typeof job.addedAt === "number");
        assert.strictEqual(job.retryCount, 0);
        assert.ok(Array.isArray(job.actionLog));
        assert.strictEqual(job.actionLog[0].action, "enqueued");
    });

    console.log("\n[2] Runtime Timing");
    test("dequeue sets startedAt and retry count", () => {
        const queued = decodeQueue.enqueue("https://example.com/live.m3u8", null, { source: "clipboard" });
        const active = decodeQueue.dequeue();
        assert.strictEqual(active.id, queued.id);
        assert.strictEqual(active.status, "running");
        assert.ok(typeof active.startedAt === "number");
        assert.strictEqual(active.retryCount, 1);
        assert.strictEqual(active.attempts, 1);
    });

    console.log("\n[3] Manual Review Reason");
    test("manual review preserves explicit reason", () => {
        const queued = decodeQueue.enqueue("https://example.com/needs-review.m3u8", null, { source: "operator" });
        const ok = decodeQueue.markManualReview(queued.id, "DRM marker mismatch", "operator");
        assert.strictEqual(ok, true);
        const list = decodeQueue.getQueue();
        assert.strictEqual(list[0].status, "manual-review");
        assert.strictEqual(list[0].manualReviewReason, "DRM marker mismatch");
        assert.strictEqual(list[0].lastAction.action, "manual-review");
    });

    console.log("\n[4] Failure Intelligence");
    test("failed jobs include explicit reason and duration", () => {
        const queued = decodeQueue.enqueue("https://example.com/fail.m3u8", null, { source: "operator" });
        decodeQueue.dequeue();
        const ok = decodeQueue.fail(queued.id, "HTTP 503 from origin");
        assert.strictEqual(ok, true);
        const hist = decodeQueue.getHistory(5);
        assert.strictEqual(hist.length, 1);
        assert.strictEqual(hist[0].status, "failed");
        assert.strictEqual(hist[0].failureReason, "HTTP 503 from origin");
        assert.ok(typeof hist[0].durationMs === "number");
        assert.strictEqual(hist[0].lastAction.action, "failed");
    });

    console.log("\n[5] Warning Outcome");
    test("warning status captured for no-candidate refusal result", () => {
        const queued = decodeQueue.enqueue("https://example.com/warn.m3u8", null, { source: "operator" });
        decodeQueue.dequeue();
        const ok = decodeQueue.complete(queued.id, { candidates: [], refusals: [{ reason: "auth-boundary" }] });
        assert.strictEqual(ok, true);
        const hist = decodeQueue.getHistory(5);
        assert.strictEqual(hist[0].status, "warning");
        assert.ok(hist[0].lastResultSummary);
        assert.strictEqual(hist[0].lastResultSummary.kind, "warn");
    });

    console.log("\n[6] Requeue Intelligence");
    test("requeue preserves retry count and appends action log", () => {
        const queued = decodeQueue.enqueue("https://example.com/retry.m3u8", null, { source: "operator" });
        decodeQueue.dequeue();
        decodeQueue.fail(queued.id, "Timeout");
        const requeued = decodeQueue.requeue(queued.id, "operator", "Retry after timeout");
        assert.strictEqual(requeued, true);
        const list = decodeQueue.getQueue();
        assert.strictEqual(list.length, 1);
        assert.strictEqual(list[0].status, "queued");
        assert.strictEqual(list[0].retryCount, 1);
        assert.strictEqual(list[0].lastAction.action, "requeued");
    });

    console.log("\n[7] Case Linkage");
    test("attach case writes case id and records action", () => {
        const queued = decodeQueue.enqueue("https://example.com/case.m3u8", null, { source: "operator" });
        const ok = decodeQueue.attachCase(queued.id, "case-abc123", "Case ABC 123", "operator");
        assert.strictEqual(ok, true);
        const list = decodeQueue.getQueue();
        assert.strictEqual(list[0].caseId, "case-abc123");
        assert.strictEqual(list[0].lastAction.action, "case-linked");
    });

    console.log("\n[8] Metrics");
    test("metrics include retry counter", () => {
        const queuedA = decodeQueue.enqueue("https://example.com/a.m3u8", null, { source: "operator" });
        decodeQueue.dequeue();
        decodeQueue.fail(queuedA.id, "Connection reset");

        const queuedB = decodeQueue.enqueue("https://example.com/b.m3u8", null, { source: "operator" });
        decodeQueue.pause(queuedB.id, "operator");

        const metrics = decodeQueue.getMetrics();
        assert.strictEqual(metrics.failed, 1);
        assert.strictEqual(metrics.paused, 1);
        assert.ok(metrics.retries >= 1);
    });

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Decode Queue Tests: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

run();
