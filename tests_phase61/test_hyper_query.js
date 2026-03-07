const IndexManager = require('../src/query/indexManager');
const HyperQueryEngine = require('../src/query/hyperQueryEngine');

async function runHyperQueryTests() {
    console.log("--- Phase 61: HyperQuery Engine Test Suite ---");

    const indexer = new IndexManager();
    const queryEngine = new HyperQueryEngine(indexer, { getNode: (id) => ({ id }) });

    // 1. Data Mocking & Indexing
    console.log("[TEST] Relational Indexing...");
    const bundle1 = {
        path: 'case1/B1.hyper',
        cdn: 'Cloudflare',
        protocol: 'HLS',
        playerSignature: 'VideoJS',
        fingerprint_data: { hash: 'HASH_A' }
    };
    const bundle2 = {
        path: 'case2/B2.hyper',
        cdn: 'Akamai',
        protocol: 'HLS',
        playerSignature: 'Shaka',
        fingerprint_data: { hash: 'HASH_B' }
    };

    indexer.indexBundle(bundle1);
    indexer.indexBundle(bundle2);

    const stats = indexer.getStatistics();
    if (stats.cdns !== 2 || stats.protocols !== 1) throw new Error("Indexing stats incorrect");
    console.log("   OK: Indexing verified.");

    // 2. Specific Lookups
    console.log("[TEST] Type-Specific Queries...");
    const resCdn = queryEngine.execute('cdn:Akamai');
    if (resCdn.length !== 1 || resCdn[0] !== 'case2/B2.hyper') throw new Error("CDN lookup failed");

    const resProto = queryEngine.execute('protocol:HLS');
    if (resProto.length !== 2) throw new Error("Protocol overlap lookup failed");
    console.log("   OK: Tagged queries verified.");

    // 3. Generic Text Search
    console.log("[TEST] Generic Text Search...");
    const resGeneric = queryEngine.execute('Cloud');
    if (resGeneric.length !== 1 || resGeneric[0] !== 'case1/B1.hyper') throw new Error("Generic search failed");
    console.log("   OK: Generic text search verified.");

    // 4. Fingerprint Lookup
    console.log("[TEST] Fingerprint Lookup...");
    const resFp = queryEngine.execute('hash:HASH_B');
    if (resFp.length !== 1 || resFp[0] !== 'case2/B2.hyper') throw new Error("Fingerprint lookup failed");
    console.log("   OK: Fingerprint resolving verified.");

    console.log("\n[SUCCESS] Phase 61 HyperQuery Engine verified.");
}

runHyperQueryTests().catch(err => {
    console.error("\n[FAILURE] HyperQuery Test Error:", err);
    process.exit(1);
});
