const TimelineEngine = require('../src/timeline/timelineEngine');
const InfrastructureTracker = require('../src/evolution/infrastructureTracker');
const PredictiveAnomaly = require('../src/predictive/predictiveAnomaly');
const ForensicSimulator = require('../src/simulation/forensicSimulator');
const ThreatReporter = require('../src/threat/threatReporter');

async function runAllTests() {
    console.log("=== Phases 86-90: Predictive Intelligence Full Test Suite ===\n");

    // ---------- Phase 86: Timeline Reconstruction ----------
    console.log("--- Phase 86: Timeline Reconstruction ---");
    const te = new TimelineEngine();

    const now = Date.now();
    const events = [
        { id: 'e1', type: 'fetch', ts: now - 3600000 },
        { id: 'e2', type: 'extract', ts: now - 3599000 },
        { id: 'e3', type: 'burst1', ts: now - 10000 },
        { id: 'e4', type: 'burst2', ts: now - 9500 },
        { id: 'e5', type: 'burst3', ts: now - 9000 },
        { id: 'e6', type: 'burst4', ts: now - 8500 },
        { id: 'e7', type: 'burst5', ts: now - 8000 }
    ];

    const tl = te.reconstruct('CASE_001', events);
    console.log(`[TEST] Clusters: ${tl.clusters.length}, Bursts: ${tl.bursts.length}`);
    if (tl.clusters.length !== 2) throw new Error("Expected 2 clusters (historical vs recent burst)");
    if (tl.bursts.length !== 1) throw new Error("Expected 1 burst detected");
    console.log("   OK: Timeline reconstructed with clustering and rapid burst detection.\n");

    // ---------- Phase 87: Infrastructure Evolution Tracker ----------
    console.log("--- Phase 87: Infrastructure Evolution ---");
    const it = new InfrastructureTracker();

    it.record({ id: 'nodeA', provider: 'cdn1' }, 'CASE_001', now - 86400000);
    const hist1 = it.record({ id: 'nodeA', provider: 'cdn2' }, 'CASE_002', now);

    console.log(`[TEST] NodeA Providers: ${hist1.providers.join(' -> ')}`);
    if (hist1.providers.length !== 2) throw new Error("Expected 2 providers recorded");

    const drifts = it.getDriftAnalysis();
    if (drifts.migrationEvents !== 1) throw new Error("Expected 1 migration event");
    console.log("   OK: CDN migration event detected across cases.\n");

    // ---------- Phase 88: Predictive Anomaly ----------
    console.log("--- Phase 88: Predictive Anomaly ---");
    const pa = new PredictiveAnomaly();

    const normal = pa.predict([{ type: 'req', severity: 'INFO' }, { type: 'res', severity: 'LOW' }]);
    if (normal.riskLevel !== 'normal') throw new Error("Expected normal risk");

    const rapid = pa.predict([
        { type: 'auth_fail', severity: 'INFO' },
        { type: 'auth_fail', severity: 'INFO' },
        { type: 'auth_fail', severity: 'INFO' }
    ]);
    if (rapid.riskScore < 40) throw new Error("Expected elevated score from rapid repetition");

    const escalating = pa.predict([
        { type: 'probe', severity: 'LOW' },
        { type: 'auth_fail', severity: 'WARN' },
        { type: 'bypass', severity: 'HIGH' }
    ], { targetId: 'T1' });

    console.log(`[TEST] Escalating Risk: ${escalating.riskScore} (${escalating.riskLevel})`);
    if (escalating.riskScore < 50) throw new Error("Expected escalating severity detection");
    console.log("   OK: Predictive trajectories and repetitions scored.\n");

    // ---------- Phase 89: Forensic Simulator ----------
    console.log("--- Phase 89: Forensic Simulator ---");
    const fs = new ForensicSimulator();

    const simSecure = fs.simulate('token_expiration', { id: 'b1', manifestURL: 'http://test', token: 'secure123' });
    if (simSecure.verdict !== 'SECURE') throw new Error("Expected SECURE verdict for normal token");

    const simVuln = fs.simulate('token_expiration', { id: 'b2', manifestURL: 'http://test', token: 'vuln_bypass' });
    if (simVuln.verdict !== 'VULNERABLE') throw new Error("Expected VULNERABLE verdict");
    console.log("   OK: Token expiration scenarios deterministically simulated.");

    const simFailover = fs.simulate('cdn_failover', { id: 'b3', manifestURL: 'http://test', cdn: 'primaryCDN' });
    if (simFailover.verdict !== 'RESILIENT') throw new Error("Expected RESILIENT verdict");
    console.log("   OK: CDN failover scenario simulated.\n");

    // ---------- Phase 90: Threat Reporter ----------
    console.log("--- Phase 90: Threat Reporter ---");
    const tr = new ThreatReporter();

    const caseData = {
        id: 'CASE_CRITICAL',
        findings: [{ indicator: '192.168.1.100' }],
        anomalies: [
            { severity: 'HIGH', riskScore: 85 },
            { severity: 'HIGH', riskScore: 90 }
        ],
        predictions: [
            { riskLevel: 'critical_predictive' },
            { riskLevel: 'critical_predictive' }
        ],
        timeline: tl
    };

    const report = tr.generate(caseData);
    console.log(`[TEST] Threat Level: ${report.threat_level} (Score: ${report.score})`);
    if (report.threat_level !== 'CRITICAL') throw new Error("Expected CRITICAL threat report");
    if (report.timelineHighlights.length !== 1) throw new Error("Expected timeline burst highlight");
    console.log("   OK: Automated threat report generated with summaries and IoCs.\n");

    console.log("====================================");
    console.log("[SUCCESS] All Phases 86-90 verified.");
    console.log("====================================");
}

runAllTests().catch(err => {
    console.error("\n[FAILURE] Test Error:", err);
    process.exit(1);
});
