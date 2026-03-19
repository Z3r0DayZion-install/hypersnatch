const GlobalGraph = require('../src/global/globalGraph');
const InfraAttributionEngine = require('../src/attribution/infraAttributionEngine');
const AdversaryFingerprintEngine = require('../src/fingerprinting/adversaryFingerprintEngine');
const SelfHealingOrchestrator = require('../src/healing/selfHealingOrchestrator');
const AutonomousDiscoveryEngine = require('../src/discovery/autonomousDiscoveryEngine');

async function runAllTests() {
    console.log("=== Phases 91-95: Strategic Intelligence Full Test Suite ===\n");

    // ---------- Phase 91: Global Graph ----------
    console.log("--- Phase 91: Global Intelligence Graph ---");
    const gg = new GlobalGraph();

    // Add nodes from multiple cases
    gg.addNode('N1', 'host', { ip: '1.2.3.4' }, { caseId: 'CASE_A' });
    gg.addNode('N2', 'domain', { name: 'test.com' }, { caseId: 'CASE_A' });
    gg.addEdge('N1', 'N2', 'resolves', {}, { caseId: 'CASE_A' });

    // Merge node from another case
    gg.addNode('N1', 'host', { asn: 12345 }, { caseId: 'CASE_B' });

    const summary = gg.summary();
    if (summary.node_count !== 2) throw new Error("Expected 2 nodes");
    if (summary.edge_count !== 1) throw new Error("Expected 1 edge");

    const lineage = gg.getLineage('N1');
    if (lineage.cases.length !== 2) throw new Error("Lineage should show 2 contributing cases");
    console.log("   OK: Global graph merged deterministically with lineage records.");

    const nh = gg.getNeighborhood('N1', 1);
    if (nh.nodes.length !== 2) throw new Error("Neighborhood query failed");
    console.log(`   OK: Neighborhood query returned ${nh.nodes.length} nodes.\n`);

    // ---------- Phase 92: Infrastructure Attribution ----------
    console.log("--- Phase 92: Infrastructure Attribution ---");
    const iae = new InfraAttributionEngine();

    const attr1 = iae.attribute({ cdn: 'cloudfront', token_pattern: 'jwt' });
    if (attr1.provider !== 'aws_delivery_family') throw new Error("Failed AWS attribution");
    if (attr1.confidence < 0.8) throw new Error("Confidence too low");
    if (attr1.reasons.length === 0) throw new Error("Missing reasons");
    if (attr1.alternatives.length === 0) throw new Error("Missing alternatives");

    const attr2 = iae.attribute({ dns: 'hostinger' });
    if (attr2.provider !== 'high_risk_hosting') throw new Error("Failed high risk hosting attribution");

    console.log(`   OK: Attribution generated for AWS [Conf: ${attr1.confidence}], High-Risk [Conf: ${attr2.confidence}]`);
    console.log("   OK: Reasons and alternatives successfully emitted.\n");

    // ---------- Phase 93: Adversary Fingerprinting ----------
    console.log("--- Phase 93: Adversary Fingerprinting ---");
    const afe = new AdversaryFingerprintEngine();

    const fp1 = afe.fingerprint({ cdn: 'AKAMAI', protocol: 'HLS', token_pattern: 'CUSTOM_JWT' });
    const fp2 = afe.fingerprint({ cdn: 'AKAMAI', protocol: 'HLS', token_pattern: 'CUSTOM_JWT' });
    const fp3 = afe.fingerprint({ cdn: 'CLOUDFLARE', protocol: 'HLS', token_pattern: 'CUSTOM_JWT' });

    if (fp1.label !== 'AKAMAI_HLS_CUSTOM_JWT') throw new Error("Fingerprint label generation failed");
    console.log(`   OK: Fingerprint generated: ${fp1.label}`);

    const cmp = afe.compare(fp1.label, fp3.label);
    if (cmp >= 1.0) throw new Error("Comparison artifact should not match 100%");
    console.log(`   OK: Distinct fingerprint comparison deterministic (Score: ${cmp.toFixed(2)})`);

    const groups = afe.groupPatterns();
    if (groups.length !== 1 || groups[0].count !== 2) throw new Error("Pattern grouping failed");
    console.log("   OK: Pattern groups grouped shared adversary operations.\n");

    // ---------- Phase 94: Self-Healing Pipelines ----------
    console.log("--- Phase 94: Self-Healing Pipelines ---");
    const sho = new SelfHealingOrchestrator();

    const heal1 = sho.recover({ stage: 'smart_decode', error: 'parser_rejected', bundleId: 'B1' });
    if (heal1.action !== 'fallback_generic_parser') throw new Error("Recovery plan failed for parser error");
    if (!heal1.degraded) throw new Error("Should be degraded mode");
    console.log(`   OK: Recovery plan generated [Action: ${heal1.action}, Degraded: ${heal1.degraded}]`);

    const heal2 = sho.recover({ stage: 'intelligence_graph', error: 'deadlock', bundleId: 'B2' });
    if (heal2.action !== 'retry_with_jitter') throw new Error("Recovery plan failed for deadlock");

    const audit = sho.getAuditLog();
    if (audit.length !== 2) throw new Error("Recovery audit failed");
    console.log("   OK: Recovery audit emitted correctly.\n");

    // ---------- Phase 95: Autonomous Discovery ----------
    console.log("--- Phase 95: Autonomous Discovery Mode ---");
    const ade = new AutonomousDiscoveryEngine();

    const disco = ade.discover({
        global_graph_nodes: 50,
        unclassified_patterns: 5,
        unattributed_infrastructure: 10
    });

    if (disco.suggestions.length !== 2) throw new Error("Expected 2 discovery suggestions");
    if (disco.intelligence_gaps.length !== 1) throw new Error("Expected 1 intelligence gap");

    // Check constraints
    if (disco.suggestions[0].review_state !== 'suggested') throw new Error("Suggestions must be review-gated");

    console.log(`   OK: Emitted ${disco.suggestions.length} suggestions (review-gated) and ${disco.intelligence_gaps.length} gaps.`);
    console.log("   OK: Discovery execution preserved manual review requirements.\n");

    console.log("====================================");
    console.log("[SUCCESS] All Phases 91-95 verified.");
    console.log("====================================");
}

runAllTests().catch(err => {
    console.error("\n[FAILURE] Test Error:", err);
    process.exit(1);
});
