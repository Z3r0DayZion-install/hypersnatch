const ReplayMutationEngine = require('../src/replay/replayMutationEngine');

async function runMutationTests() {
    console.log("--- Phase 62: Replay Mutation Engine Test Suite ---");

    const engine = new ReplayMutationEngine();
    const sessionId = "TEST_SESSION_123";

    // 1. Header Mutation
    console.log("[TEST] Header Mutation...");
    engine.setMutation(sessionId, {
        enabled: true,
        modifyHeaders: { 'X-Forensic-Trace': 'TRUE', 'User-Agent': 'HyperSnatch/1.0' }
    });

    const mockReq = {
        url: 'https://example.com/stream.m3u8',
        headers: { 'Accept': '*/*' }
    };

    const mutated = engine.mutate(sessionId, 'request', mockReq);
    if (mutated.headers['X-Forensic-Trace'] !== 'TRUE') throw new Error("Header injection failed");
    if (mutated.headers['User-Agent'] !== 'HyperSnatch/1.0') throw new Error("Header override failed");
    console.log("   OK: Header mutations applied correctly.");

    // 2. Token Injection
    console.log("[TEST] Token Injection...");
    engine.setMutation(sessionId, {
        enabled: true,
        injectTokens: 'auth=verified&ts=9999'
    });

    const mockReq2 = { url: 'https://cdn.net/data' };
    const mutated2 = engine.mutate(sessionId, 'request', mockReq2);
    if (!mutated2.url.includes('?auth=verified&ts=9999')) throw new Error("Token injection failed (new query)");

    const mockReq3 = { url: 'https://cdn.net/hide?existing=1' };
    const mutated3 = engine.mutate(sessionId, 'request', mockReq3);
    if (!mutated3.url.includes('&auth=verified&ts=9999')) throw new Error("Token injection failed (append query)");
    console.log("   OK: Token injection logic verified.");

    // 3. Toggle Control
    console.log("[TEST] Mutation Toggle...");
    engine.setMutation(sessionId, { enabled: false, injectTokens: 'SHOULD_NOT_SEE' });
    const mutated4 = engine.mutate(sessionId, 'request', mockReq2);
    if (mutated4.url.includes('SHOULD_NOT_SEE')) throw new Error("Mutation applied when disabled!");
    console.log("   OK: Enabled/Disabled states respect configuration.");

    console.log("\n[SUCCESS] Phase 62 Replay Mutation Engine verified.");
}

runMutationTests().catch(err => {
    console.error("\n[FAILURE] Mutation Test Error:", err);
    process.exit(1);
});
