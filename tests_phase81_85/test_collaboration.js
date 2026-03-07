const ReviewWorkflow = require('../src/collaboration/reviewWorkflow');
const RedactionEngine = require('../src/redaction/redactionEngine');
const PublicationPipeline = require('../src/publication/publicationPipeline');
const ModelReporter = require('../src/reporting/modelReporter');
const DeploymentOrchestrator = require('../src/deployment/deploymentOrchestrator');

async function runAllTests() {
    console.log("=== Phases 81-85: Collaboration & Publication Full Test Suite ===\n");

    // ---------- Phase 81: Collaborative Review ----------
    console.log("--- Phase 81: Collaborative Review Workflow ---");
    const rw = new ReviewWorkflow();

    const rev = rw.createReview('CASE_001', 'analyst_alice', { assignedBy: 'lead_bob' });
    if (!rev.id) throw new Error("Review missing ID");
    if (rev.state !== 'pending') throw new Error("Initial state should be pending");
    console.log("   OK: Review created.");

    const cmt = rw.comment(rev.id, 'analyst_alice', 'CDN topology looks suspicious');
    if (!cmt.id) throw new Error("Comment missing ID");
    console.log("   OK: Comment added.");

    const ann = rw.annotate(rev.id, 'analyst_alice', { target: 'bundle_B1', text: 'Unusual token TTL', severity: 'warning' });
    if (!ann.id) throw new Error("Annotation missing ID");
    console.log("   OK: Annotation added.");

    rw.decide(rev.id, 'accepted', 'Evidence reviewed and confirmed');
    const decided = rw.getReviewsByCase('CASE_001');
    if (decided[0].state !== 'accepted') throw new Error("Decision state wrong");
    console.log("   OK: Decision (accepted) verified.\n");

    // ---------- Phase 82: Redaction Engine ----------
    console.log("--- Phase 82: Redaction Engine ---");
    const re = new RedactionEngine();

    const result = re.redact('Access token=abc123xyz at https://cdn.example.com/manifest.m3u8 from user@example.com IP 192.168.1.1');
    if (result.text.includes('abc123xyz')) throw new Error("Token not redacted");
    if (result.text.includes('cdn.example.com')) throw new Error("URL not redacted");
    if (result.text.includes('user@example.com')) throw new Error("Email not redacted");
    if (result.text.includes('192.168.1.1')) throw new Error("IP not redacted");
    console.log(`   OK: Text redaction verified (${result.audit.totalRedactions} redactions).`);

    const bundleRedacted = re.redactBundle({ path: 'B1', manifestURL: 'https://cdn.test.com/v1', token: 'token=secret123' });
    if (bundleRedacted.manifestURL.includes('cdn.test.com')) throw new Error("Bundle URL not redacted");
    console.log("   OK: Bundle redaction verified.\n");

    // ---------- Phase 83: Publication Pipeline ----------
    console.log("--- Phase 83: Publication Pipeline ---");
    const pp = new PublicationPipeline();

    const pub = pp.submit({ title: 'CDN Analysis Report', content: { summary: 'test' } }, 'analyst_alice');
    if (pub.state !== 'draft') throw new Error("Initial state should be draft");
    console.log("   OK: Publication submitted as draft.");

    pp.transition(pub.id, 'review', 'analyst_alice');
    if (pp.getByState('review').length !== 1) throw new Error("Review state count wrong");
    console.log("   OK: Transitioned to review.");

    pp.approve(pub.id, 'lead_bob');
    if (pp.getByState('approved').length !== 1) throw new Error("Approved state count wrong");
    console.log("   OK: Approved by lead.");

    pp.transition(pub.id, 'exported', 'system');
    if (pp.getByState('exported').length !== 1) throw new Error("Export state count wrong");
    console.log("   OK: Exported successfully.\n");

    // ---------- Phase 84: Model Reporter ----------
    console.log("--- Phase 84: Model Reporter ---");
    const mr = new ModelReporter();

    const report = mr.generate({
        id: 'CASE_001',
        bundleCount: 5,
        findings: [
            { type: 'ANOMALY', message: 'Short TTL detected', severity: 'HIGH' },
            { type: 'PATTERN', message: 'Akamai-Shaka pattern', severity: 'INFO' }
        ],
        anomalies: [{ severity: 'HIGH', anomaly_score: 85, reasons: ['token_ttl_below_60'] }],
        classifications: [{ label: 'SHAKA_AKAMAI_HLS' }, { label: 'UNKNOWN_PATTERN' }]
    });

    if (!report.id) throw new Error("Report missing ID");
    if (!report.summary) throw new Error("Report missing summary");
    if (report.sections.length < 2) throw new Error("Report should have multiple sections");
    if (report.recommendations.length < 1) throw new Error("Expected recommendations");
    console.log(`   OK: Report generated with ${report.sections.length} sections, ${report.recommendations.length} recommendations.\n`);

    // ---------- Phase 85: Deployment Orchestrator ----------
    console.log("--- Phase 85: Deployment Orchestrator ---");
    const doo = new DeploymentOrchestrator();

    const envs = doo.listEnvironments();
    if (envs.length !== 4) throw new Error(`Expected 4 environments, got ${envs.length}`);
    console.log("   OK: 4 environments available.");

    const dep = doo.deploy('sovereign_airgap', 'airgap');
    if (dep.status !== 'complete') throw new Error("Deployment should be complete");
    if (dep.tasks.length < 4) throw new Error("Expected at least 4 deployment tasks");
    console.log("   OK: Air-gap deployment completed with task tracking.");

    doo.rollback(dep.id);
    const history = doo.getHistory();
    if (history[0].status !== 'rolled_back') throw new Error("Rollback failed");
    console.log("   OK: Rollback verified.\n");

    console.log("====================================");
    console.log("[SUCCESS] All Phases 81-85 verified.");
    console.log("====================================");
}

runAllTests().catch(err => {
    console.error("\n[FAILURE] Test Error:", err);
    process.exit(1);
});
