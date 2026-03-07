const PatternDiscoveryEngine = require('../src/intelligence/patternDiscoveryEngine');
const ClusterEngine = require('../src/intelligence/clusterEngine');
const AnomalyDetector = require('../src/intelligence/anomalyDetector');

async function runPhase66Tests() {
    console.log("--- Phase 66: Pattern Discovery Engine Test Suite ---");

    const pde = new PatternDiscoveryEngine();
    const ce = new ClusterEngine();
    const ad = new AnomalyDetector();

    const bundles = [
        { path: 'B1', cdn: 'Akamai', playerSignature: 'Shaka', protocol: 'HLS' },
        { path: 'B2', cdn: 'Akamai', playerSignature: 'Shaka', protocol: 'HLS' },
        { path: 'B3', cdn: 'Cloudflare', playerSignature: 'VideoJS', protocol: 'DASH' },
        { path: 'B4', cdn: 'Akamai', playerSignature: 'Shaka', protocol: 'HLS' },
        { path: 'B5', cdn: 'Fastly', playerSignature: 'Native', protocol: 'WEBRTC' }
    ];

    // 1. Pattern Discovery
    console.log("[TEST] Pattern Discovery...");
    const patterns = pde.discover(bundles);
    if (patterns.length !== 3) throw new Error(`Expected 3 patterns, got ${patterns.length}`);
    if (patterns[0].frequency !== 3) throw new Error("Dominant pattern frequency incorrect");
    console.log("   OK: Frequency-based pattern discovery verified.");

    // 2. Recurring Detection
    console.log("[TEST] Recurring Patterns...");
    const recurring = pde.getRecurring(2);
    if (recurring.length !== 1) throw new Error("Recurring filter failed");
    console.log("   OK: Recurring threshold filter verified.");

    // 3. Clustering
    console.log("[TEST] Cluster Engine...");
    const clusters = ce.cluster(bundles, ['cdn', 'protocol']);
    if (clusters.length !== 3) throw new Error(`Expected 3 clusters, got ${clusters.length}`);
    if (ce.getLargest().size !== 3) throw new Error("Largest cluster size incorrect");
    console.log("   OK: Multi-trait clustering verified.");

    // 4. Anomaly Detection
    console.log("[TEST] Anomaly Detection...");
    const anomalies = ad.detect(bundles, patterns);
    // B3 (Cloudflare/VideoJS/DASH) and B5 (Fastly/Native/WEBRTC) are singletons
    const singletonAnomalies = anomalies.filter(a => a.reason === 'SINGLETON_PATTERN');
    if (singletonAnomalies.length !== 2) throw new Error(`Expected 2 singleton anomalies, got ${singletonAnomalies.length}`);
    console.log("   OK: Singleton anomaly detection verified.");

    // 5. Stats
    console.log("[TEST] Unified Stats...");
    const stats = pde.getStats();
    if (stats.uniqueCdns !== 3) throw new Error("CDN count incorrect");
    console.log("   OK: Pattern statistics verified.");

    console.log("\n[SUCCESS] Phase 66 Pattern Discovery Engine verified.");
}

runPhase66Tests().catch(err => {
    console.error("\n[FAILURE] Phase 66 Test Error:", err);
    process.exit(1);
});
