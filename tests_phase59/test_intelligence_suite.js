const IntelligenceGraph = require('../src/intelligence/intelligenceGraph');
const FingerprintEngine = require('../src/intelligence/fingerprintEngine');
const SimilarityEngine = require('../src/intelligence/similarityEngine');

async function runIntelligenceTests() {
    console.log("--- Phase 59: Intelligence Graph Engine Test Suite ---");

    const graph = new IntelligenceGraph();

    // 1. Graph Operations
    console.log("[TEST] Graph Node/Edge Operations...");
    graph.addNode('BUNDLE', 'B1', { host: 'rapidgator.net' });
    graph.addNode('CDN', 'CDN-X', { region: 'US-EAST' });
    graph.addEdge('B1', 'CDN-X', 'SERVED_BY');

    const edges = graph.getEdgesForNode('B1');
    if (edges.length !== 1 || edges[0].target !== 'CDN-X') throw new Error("Edge creation failed");
    console.log("   OK: Graph structure verified.");

    // 2. Fingerprinting
    console.log("[TEST] Forensic Fingerprinting...");
    const mockBundle = {
        playerSignature: 'VideoJS_7.10',
        protocol: 'HLS_AES',
        cdn: 'Akamai_V1',
        token: 'auth-123-abc-456'
    };
    const fp = FingerprintEngine.generateFingerprint(mockBundle);
    if (!fp.hash || fp.components.player !== 'VideoJS_7.10') throw new Error("Fingerprint generation failed");
    if (fp.components.token_pattern !== '....-...-...-...') throw new Error("Token pattern abstraction failed");
    console.log("   OK: Forensic signatures generated stable hashes.");

    // 3. Similarity Analytics
    console.log("[TEST] Similarity Analytics...");
    const mockBundle2 = {
        playerSignature: 'VideoJS_7.10',
        protocol: 'HLS_AES',
        cdn: 'Cloudflare_V2', // Different CDN
        token: 'user-789-uvw-012' // Same pattern as 'auth-123-abc-456'
    };
    const fp2 = FingerprintEngine.generateFingerprint(mockBundle2);

    const score = SimilarityEngine.similarityScore(fp, fp2);
    // Expected: 30 (player) + 20 (protocol) + 15 (token_pattern) = 65
    console.log(`   Internal Score Check: ${score}`);
    if (score !== 65) throw new Error(`Unexpected similarity score: ${score}`);

    const similar = SimilarityEngine.findSimilar(fp, [
        { path: 'file2.hyper', fingerprint_data: fp2 },
        { path: 'file3.hyper', fingerprint_data: FingerprintEngine.generateFingerprint({ playerSignature: 'Other' }) }
    ]);

    if (similar.length === 0 || similar[0].bundle.path !== 'file2.hyper') throw new Error("Similarity search failed");
    console.log(`   OK: Similarity engine correctly identified overlap (${score}%).`);

    console.log("\n[SUCCESS] Phase 59 Intelligence Graph Engine verified.");
}

runIntelligenceTests().catch(err => {
    console.error("\n[FAILURE] Intelligence Test Error:", err);
    process.exit(1);
});
