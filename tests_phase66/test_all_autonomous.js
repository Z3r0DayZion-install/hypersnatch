const PatternDiscoveryEngine = require('../src/intelligence/patternDiscoveryEngine');
const ClusterEngine = require('../src/intelligence/clusterEngine');
const AnomalyDetector = require('../src/intelligence/anomalyDetector');
const TopologyMapper = require('../src/intelligence/topologyMapper');
const InsightGenerator = require('../src/intelligence/insightGenerator');
const CaseIntelligenceAssistant = require('../src/assistant/caseIntelligenceAssistant');
const AutonomousInvestigator = require('../src/autonomy/autonomousInvestigator');

async function runAllTests() {
    console.log("=== Phases 66-70: Autonomous Intelligence Full Test Suite ===\n");

    const bundles = [
        { path: 'B1', cdn: 'Akamai', playerSignature: 'Shaka', protocol: 'HLS', origin: 'origin1.com', manifestURL: 'https://cdn.akamai.com/manifest.m3u8', segmentHost: 'seg.akamai.com', token: 'cid=abc123' },
        { path: 'B2', cdn: 'Akamai', playerSignature: 'Shaka', protocol: 'HLS', origin: 'origin1.com', manifestURL: 'https://cdn.akamai.com/v2/manifest.m3u8' },
        { path: 'B3', cdn: 'Cloudflare', playerSignature: 'VideoJS', protocol: 'DASH', origin: 'origin2.com' },
        { path: 'B4', cdn: 'Akamai', playerSignature: 'Shaka', protocol: 'HLS', origin: 'origin1.com' },
        { path: 'B5', cdn: 'Fastly', playerSignature: 'Native', protocol: 'WEBRTC', origin: 'origin3.com', tokenService: 'auth.fastly.com' }
    ];

    // ---------- Phase 66: Pattern Discovery ----------
    console.log("--- Phase 66: Pattern Discovery Engine ---");
    const pde = new PatternDiscoveryEngine();
    const patterns = pde.discover(bundles);
    console.log(`[TEST] Pattern Discovery: Found ${patterns.length} patterns`);
    if (patterns.length !== 3) throw new Error(`Expected 3 patterns, got ${patterns.length}`);
    if (patterns[0].frequency !== 3) throw new Error("Dominant pattern frequency wrong");
    console.log("   OK: Pattern discovery verified.");

    const ce = new ClusterEngine();
    const clusters = ce.cluster(bundles, ['cdn']);
    console.log(`[TEST] Clustering: Found ${clusters.length} clusters`);
    if (clusters[0].size !== 3) throw new Error("Largest cluster size wrong");
    console.log("   OK: Clustering verified.");

    const ad = new AnomalyDetector();
    const anomalies = ad.detect(bundles, patterns);
    const singletons = anomalies.filter(a => a.reason === 'SINGLETON_PATTERN');
    console.log(`[TEST] Anomaly Detection: Found ${singletons.length} singleton anomalies`);
    if (singletons.length !== 2) throw new Error(`Expected 2 singletons, got ${singletons.length}`);
    console.log("   OK: Anomaly detection verified.\n");

    // ---------- Phase 67: Topology Mapper ----------
    console.log("--- Phase 67: Infrastructure Topology Mapper ---");
    const tm = new TopologyMapper();
    const topo = tm.mapCase(bundles);
    console.log(`[TEST] Topology: ${topo.totalNodes} nodes, ${topo.totalEdges} edges`);
    if (topo.totalNodes < 5) throw new Error("Too few topology nodes");
    if (topo.totalEdges < 3) throw new Error("Too few topology edges");
    console.log("   OK: Topology mapping verified.\n");

    // ---------- Phase 68: Insight Generator ----------
    console.log("--- Phase 68: Autonomous Insight Generator ---");
    const ig = new InsightGenerator();
    const insights = ig.generate(patterns, anomalies, topo);
    console.log(`[TEST] Insights Generated: ${insights.length}`);
    if (insights.length === 0) throw new Error("No insights generated");
    const dominantInsight = insights.find(i => i.type === 'DOMINANT_PATTERN');
    if (!dominantInsight) throw new Error("Dominant pattern insight missing");
    console.log("   OK: Insight generation verified.\n");

    // ---------- Phase 69: Case Intelligence Assistant ----------
    console.log("--- Phase 69: Case Intelligence Assistant ---");
    const cia = new CaseIntelligenceAssistant(pde, ad, ig);
    const related = cia.suggestRelated(bundles[0], bundles);
    console.log(`[TEST] Related Suggestions: ${related.length} for B1`);
    if (related.length < 2) throw new Error("Too few related suggestions");

    const experiments = cia.proposeExperiments(bundles[0]);
    console.log(`[TEST] Proposed Experiments: ${experiments.length}`);
    if (experiments.length < 2) throw new Error("Too few experiment proposals");

    const briefing = cia.generateBriefing({ id: 'CASE_001', bundles });
    console.log(`[TEST] Briefing: ${briefing.summary.patterns} patterns, ${briefing.recommendations.length} recommendations`);
    if (!briefing.summary) throw new Error("Briefing summary missing");
    console.log("   OK: Case intelligence assistant verified.\n");

    // ---------- Phase 70: Autonomous Investigator ----------
    console.log("--- Phase 70: Autonomous Investigator ---");
    const ai = new AutonomousInvestigator({
        patternDiscovery: new PatternDiscoveryEngine(),
        anomalyDetector: new AnomalyDetector(),
        insightGenerator: new InsightGenerator(),
        topologyMapper: new TopologyMapper(),
        ruleEngine: null
    });
    const report = await ai.run(bundles);
    console.log(`[TEST] Autonomous Report Status: ${report.status}`);
    if (report.status !== 'COMPLETE') throw new Error(`Report status: ${report.status}`);
    console.log(`[TEST] Autonomous Verdict: ${report.summary.verdict}`);
    if (!['CLEAN', 'SUSPICIOUS', 'REVIEW'].includes(report.summary.verdict)) throw new Error("Invalid verdict");
    console.log("   OK: Autonomous investigation verified.\n");

    console.log("====================================");
    console.log("[SUCCESS] All Phases 66-70 verified.");
    console.log("====================================");
}

runAllTests().catch(err => {
    console.error("\n[FAILURE] Test Error:", err);
    process.exit(1);
});
