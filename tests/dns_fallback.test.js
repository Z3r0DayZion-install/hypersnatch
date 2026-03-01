// tests/dns_fallback.test.js
// Unit tests for DNS Fallback module — offline, mocked, zero real network calls.
// Run: node tests/dns_fallback.test.js

"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const os = require("os");

const DnsFallback = require("../src/core/smartdecode/dns_fallback");

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`  ✅ ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ ${name}: ${e.message}`);
        failed++;
    }
}

async function runTests() {
    // Use a temp dir for cache so we don't pollute the project
    const tmpDir = path.join(os.tmpdir(), `hs-dns-test-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    // ════════════════════════════════════════════════════════════════════════════
    // 1. INITIALIZATION & CACHE
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n[1] Initialization & Cache");

    await test("init creates empty cache when no file exists", () => {
        DnsFallback.init(tmpDir);
        const cache = DnsFallback.getCache();
        assert.deepStrictEqual(cache, {});
    });

    await test("seedCache stores entry and getCache returns it", () => {
        DnsFallback.init(tmpDir);
        DnsFallback.seedCache("example.com", ["1.2.3.4", "5.6.7.8"]);
        const cache = DnsFallback.getCache();
        assert.ok(cache["example.com"], "example.com should be in cache");
        assert.deepStrictEqual(cache["example.com"].ips, ["1.2.3.4", "5.6.7.8"]);
    });

    await test("seedCache writes to disk", () => {
        const cachePath = path.join(tmpDir, "dns_cache.json");
        assert.ok(fs.existsSync(cachePath), "Cache file should exist on disk");
        const raw = JSON.parse(fs.readFileSync(cachePath, "utf8"));
        assert.ok(raw["example.com"], "example.com should be in disk cache");
    });

    await test("clearCache empties both memory and disk", () => {
        DnsFallback.clearCache();
        const cache = DnsFallback.getCache();
        assert.deepStrictEqual(cache, {});
        const cachePath = path.join(tmpDir, "dns_cache.json");
        const raw = JSON.parse(fs.readFileSync(cachePath, "utf8"));
        assert.deepStrictEqual(raw, {});
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 2. CACHE VALIDITY
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n[2] Cache Validity");

    await test("_isValid returns false for null entry", () => {
        assert.strictEqual(DnsFallback._isValid(null), false);
    });

    await test("_isValid returns false for entry without timestamp", () => {
        assert.strictEqual(DnsFallback._isValid({ ips: ["1.2.3.4"] }), false);
    });

    await test("_isValid returns true for fresh entry", () => {
        const entry = { ips: ["1.2.3.4"], timestamp: Date.now(), ttl: 3600 };
        assert.strictEqual(DnsFallback._isValid(entry), true);
    });

    await test("_isValid returns false for expired entry", () => {
        const entry = { ips: ["1.2.3.4"], timestamp: Date.now() - 7200 * 1000, ttl: 3600 };
        assert.strictEqual(DnsFallback._isValid(entry), false);
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 3. RESOLVE FROM CACHE
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n[3] Resolve from Cache");

    await test("resolve returns cached IPs for seeded hostname", async () => {
        DnsFallback.init(tmpDir);
        DnsFallback.seedCache("cached.example.com", ["10.0.0.1"]);
        const ips = await DnsFallback.resolve("cached.example.com");
        assert.deepStrictEqual(ips, ["10.0.0.1"]);
    });

    await test("resolve returns empty array for null hostname", async () => {
        const ips = await DnsFallback.resolve(null);
        assert.deepStrictEqual(ips, []);
    });

    await test("resolve returns empty array for empty string", async () => {
        const ips = await DnsFallback.resolve("");
        assert.deepStrictEqual(ips, []);
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 4. RETRY LOGIC
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n[4] Retry Logic");

    await test("resolveWithRetry returns cached result on first try", async () => {
        DnsFallback.init(tmpDir);
        DnsFallback.seedCache("retry.example.com", ["10.0.0.2"]);
        const ips = await DnsFallback.resolveWithRetry("retry.example.com", 0);
        assert.deepStrictEqual(ips, ["10.0.0.2"]);
    });

    await test("resolveWithRetry returns empty array for unknown host (no network)", async () => {
        DnsFallback.init(tmpDir);
        DnsFallback.clearCache();
        // Override DoH to simulate failure — mock _queryDoH
        const orig = DnsFallback._queryDoH;
        DnsFallback._queryDoH = async () => { throw new Error("mocked network failure"); };
        const ips = await DnsFallback.resolveWithRetry("nonexistent.invalid", 1);
        DnsFallback._queryDoH = orig; // restore
        assert.deepStrictEqual(ips, []);
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 5. SECURITY & CODE QUALITY
    // ════════════════════════════════════════════════════════════════════════════
    console.log("\n[5] Security & Quality");

    await test("dns_fallback.js contains no eval()", () => {
        const src = fs.readFileSync(
            path.join(__dirname, "../src/core/smartdecode/dns_fallback.js"), "utf8"
        );
        assert.ok(!src.includes("eval("), "dns_fallback.js must not call eval()");
        assert.ok(!src.includes("new Function("), "dns_fallback.js must not call new Function()");
    });

    await test("only uses https module for DoH (not http)", () => {
        const src = fs.readFileSync(
            path.join(__dirname, "../src/core/smartdecode/dns_fallback.js"), "utf8"
        );
        assert.ok(src.includes('require("https")'), "Should require https");
        assert.ok(!src.includes('require("http")'), "Should NOT require http");
    });

    await test("DoH endpoint is Cloudflare", () => {
        const src = fs.readFileSync(
            path.join(__dirname, "../src/core/smartdecode/dns_fallback.js"), "utf8"
        );
        assert.ok(src.includes("cloudflare-dns.com"), "DoH endpoint should be Cloudflare");
    });

    // ════════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ════════════════════════════════════════════════════════════════════════════
    try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
        // Best effort cleanup
    }

    // ════════════════════════════════════════════════════════════════════════════
    // RESULTS
    // ════════════════════════════════════════════════════════════════════════════
    console.log(`\n${"═".repeat(60)}`);
    console.log(`📊 DNS Fallback Tests: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
    if (failed > 0) {
        console.error(`\n⛔ ${failed} test(s) FAILED\n`);
        process.exit(1);
    } else {
        console.log(`\n✅ All DNS fallback tests passed — offline, mocked, zero network calls\n`);
    }
}

runTests().catch(console.error);
