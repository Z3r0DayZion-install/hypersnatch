const PatternClassifier = require('../src/ai/patternClassifier');
const AnomalyScorer = require('../src/ai/anomalyScorer');
const FingerprintLibrary = require('../src/library/fingerprintLibrary');
const CrossCaseMiner = require('../src/intelligence/crossCaseMiner');
const AutonomousResearchMode = require('../src/research/autonomousResearchMode');

async function runAllTests() {
    console.log("=== Phases 71-75: Self-Learning Intelligence Full Test Suite ===\n");

    // ---------- Phase 71: AI Pattern Classification ----------
    console.log("--- Phase 71: AI Pattern Classification ---");
    const pc = new PatternClassifier();

    const c1 = pc.classify({ player: 'shaka', cdn: 'cloudfront', protocol: 'dash' });
    console.log(`[TEST] Known pattern: ${c1.label} (${c1.confidence})`);
    if (c1.label !== 'SHAKA_CLOUDFRONT_DASH') throw new Error("Classification missed known pattern");
    if (c1.confidence <= 0) throw new Error("Confidence should be positive");
    if (c1.reasons.length === 0) throw new Error("Reasons must be non-empty");
    console.log("   OK: Known pattern classified with reasons.");

    const c2 = pc.classify({ player: 'unknown_player', cdn: 'mystery', protocol: 'rtmp' });
    console.log(`[TEST] Unknown pattern: ${c2.label}`);
    if (c2.label !== 'UNKNOWN_PATTERN') throw new Error("Should be UNKNOWN_PATTERN");
    console.log("   OK: Unknown pattern correctly labeled.");

    const bulk = pc.classifyBundles([
        { path: 'B1', playerSignature: 'Shaka', cdn: 'Akamai', protocol: 'HLS' },
        { path: 'B2', playerSignature: 'VideoJS', cdn: 'Akamai', protocol: 'HLS' }
    ]);
    console.log(`[TEST] Bulk classification: ${bulk.length} results`);
    if (bulk.length !== 2) throw new Error("Bulk classification count wrong");
    console.log("   OK: Bulk classification verified.\n");

    // ---------- Phase 72: Anomaly ML Scoring ----------
    console.log("--- Phase 72: Anomaly ML Scoring ---");
    const as = new AnomalyScorer();

    const s1 = as.score({ token_ttl_seconds: 5, topology_rarity: 0.95, mutation_divergence: 0.8 });
    console.log(`[TEST] High anomaly: score=${s1.anomaly_score} severity=${s1.severity}`);
    if (s1.anomaly_score < 70) throw new Error("Expected HIGH severity score");
    if (s1.severity !== 'HIGH') throw new Error("Expected HIGH severity");
    if (s1.reasons.length === 0) throw new Error("Reasons must be emitted");
    console.log("   OK: High anomaly scored with reasons.");

    const s2 = as.score({ token_ttl_seconds: 300 });
    console.log(`[TEST] Low anomaly: score=${s2.anomaly_score} severity=${s2.severity}`);
    if (s2.severity !== 'LOW') throw new Error("Expected LOW severity");
    console.log("   OK: Low anomaly correctly scored.");

    // Determinism check
    const s3 = as.score({ token_ttl_seconds: 5, topology_rarity: 0.95 });
    const s4 = as.score({ token_ttl_seconds: 5, topology_rarity: 0.95 });
    if (s3.anomaly_score !== s4.anomaly_score) throw new Error("Scoring must be deterministic");
    console.log("   OK: Deterministic scoring verified.\n");

    // ---------- Phase 73: Fingerprint Library ----------
    console.log("--- Phase 73: Infrastructure Fingerprint Library ---");
    const fl = new FingerprintLibrary(); // In-memory only for test

    fl.add({ label: 'SHAKA_CLOUDFRONT_DASH', cdn: 'cloudfront', player: 'shaka', protocol: 'dash', confidence: 0.92 });
    fl.add({ label: 'VIDEOJS_AKAMAI_HLS', cdn: 'akamai', player: 'videojs', protocol: 'hls', confidence: 0.90 });
    fl.add({ label: 'SHAKA_AKAMAI_HLS', cdn: 'akamai', player: 'shaka', protocol: 'hls', confidence: 0.88 });

    console.log(`[TEST] Library entries: ${fl.entries.length}`);
    if (fl.entries.length !== 3) throw new Error("Entry count wrong");

    const found = fl.findByLabel('SHAKA_CLOUDFRONT_DASH');
    if (found.length !== 1) throw new Error("findByLabel failed");
    console.log("   OK: findByLabel verified.");

    const similar = fl.findSimilar({ cdn: 'akamai' });
    if (similar.length !== 2) throw new Error(`Expected 2 similar, got ${similar.length}`);
    console.log("   OK: findSimilar verified.");

    const comparison = fl.compare({ cdn: 'akamai', player: 'shaka', protocol: 'hls' });
    if (comparison.length === 0) throw new Error("Compare returned nothing");
    if (comparison[0].similarity <= 0) throw new Error("Similarity should be positive");
    console.log("   OK: Compare verified.");

    const exported = fl.export();
    if (exported.totalEntries !== 3) throw new Error("Export count wrong");
    console.log("   OK: Export verified.\n");

    // ---------- Phase 74: Cross-Case Mining ----------
    console.log("--- Phase 74: Cross-Case Intelligence Mining ---");
    const ccm = new CrossCaseMiner();

    const cases = [
        {
            id: 'CASE_001', bundles: [
                { path: 'B1', cdn: 'Akamai', playerSignature: 'Shaka', protocol: 'HLS' },
                { path: 'B2', cdn: 'Cloudflare', playerSignature: 'VideoJS', protocol: 'DASH' }
            ]
        },
        {
            id: 'CASE_002', bundles: [
                { path: 'B3', cdn: 'Akamai', playerSignature: 'Shaka', protocol: 'HLS' },
                { path: 'B4', cdn: 'Fastly', playerSignature: 'Native', protocol: 'WEBRTC' }
            ]
        },
        {
            id: 'CASE_003', bundles: [
                { path: 'B5', cdn: 'Akamai', playerSignature: 'Shaka', protocol: 'HLS' }
            ]
        }
    ];

    const mineResult = ccm.mine(cases);
    console.log(`[TEST] Cross-case links: ${mineResult.crossCaseLinks}`);
    if (mineResult.crossCaseLinks < 1) throw new Error("Expected at least 1 cross-case link");
    if (mineResult.sharedInfrastructureGroups.length === 0) throw new Error("No shared infrastructure found");
    console.log(`[TEST] Shared groups: ${mineResult.sharedInfrastructureGroups.length}`);
    console.log(`[TEST] Merge suggestions: ${mineResult.mergeSuggestions.length}`);
    if (mineResult.mergeSuggestions.length === 0) throw new Error("Expected merge suggestions");
    console.log("   OK: Cross-case mining verified.\n");

    // ---------- Phase 75: Autonomous Research Mode ----------
    console.log("--- Phase 75: Autonomous Research Mode ---");
    const arm = new AutonomousResearchMode();

    const res = arm.generate({ anomaly_score: 80, similar_bundle_count: 8, singleton_patterns: 2 });
    console.log(`[TEST] Suggestions: ${res.suggestions.length}`);
    if (res.suggestions.length < 2) throw new Error("Expected at least 2 suggestions");
    if (!res.review_required) throw new Error("Review must always be required");

    // Verify review states
    res.suggestions.forEach(s => {
        if (s.review_state !== 'suggested') throw new Error("Initial state must be 'suggested'");
        if (!s.reason) throw new Error("Reason must be provided");
        if (!s.evidence) throw new Error("Evidence must be provided");
    });
    console.log("   OK: Initial review states correct.");

    // Test state transitions
    const firstId = res.suggestions[0].id;
    arm.updateState(firstId, 'queued');
    arm.updateState(firstId, 'approved');
    const approved = arm.getByState('approved');
    if (approved.length !== 1) throw new Error("State transition failed");
    console.log("   OK: State transitions verified.");

    // Test review packet
    const packet = arm.generateReviewPacket();
    if (packet.approved !== 1) throw new Error("Review packet approved count wrong");
    console.log("   OK: Review packet generated.\n");

    console.log("====================================");
    console.log("[SUCCESS] All Phases 71-75 verified.");
    console.log("====================================");
}

runAllTests().catch(err => {
    console.error("\n[FAILURE] Test Error:", err);
    process.exit(1);
});
