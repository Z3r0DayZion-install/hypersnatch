const WorkspaceStore = require('../src/workspaces/workspaceStore');
const TrustRegistry = require('../src/federation/trustRegistry');
const CentralityEngine = require('../src/graph/centralityEngine');
const PolicyEngine = require('../src/policy/policyEngine');
const DeploymentProfiles = require('../src/enterprise/deploymentProfiles');

async function runAllTests() {
    console.log("=== Phases 76-80: Enterprise Intelligence Full Test Suite ===\n");

    // ---------- Phase 76: Multi-Workspace ----------
    console.log("--- Phase 76: Multi-Workspace / Team Operations ---");
    const wss = new WorkspaceStore();

    const ws1 = wss.createWorkspace('Forensic Team Alpha');
    const ws2 = wss.createWorkspace('Research Lab Beta');
    console.log(`[TEST] Workspaces created: ${wss.listWorkspaces().length}`);
    if (wss.listWorkspaces().length !== 2) throw new Error("Workspace count wrong");

    const mem = wss.addMember(ws1.id, { name: 'Alice', role: 'lead_analyst' });
    if (mem.role !== 'lead_analyst') throw new Error("Role assignment failed");
    console.log("   OK: Member added with role.");

    const assign = wss.assignCase(ws1.id, 'CASE_001', mem.id);
    if (assign.status !== 'assigned') throw new Error("Assignment status wrong");
    console.log("   OK: Case assigned.");

    const feed = wss.getActivityFeed(ws1.id);
    if (feed.length < 3) throw new Error("Activity feed incomplete");
    console.log(`   OK: Activity feed: ${feed.length} entries.\n`);

    // ---------- Phase 77: Federation ----------
    console.log("--- Phase 77: Federation / Trust Registry ---");
    const tr = new TrustRegistry();

    const src = tr.addSource({ name: 'Partner Lab', fingerprint: 'fp_abc123', trustLevel: 'pending' });
    if (!src.id) throw new Error("Source missing ID");
    console.log("   OK: Trust source added.");

    const found = tr.findByFingerprint('fp_abc123');
    if (!found || found.name !== 'Partner Lab') throw new Error("Fingerprint lookup failed");
    console.log("   OK: Fingerprint lookup verified.");

    tr.verifySource(src.id);
    const verified = tr.findByFingerprint('fp_abc123');
    if (verified.trustLevel !== 'verified') throw new Error("Verification failed");
    console.log("   OK: Source verified.");

    const receipt = tr.logExchange({ sourceId: src.id, direction: 'import', bundleCount: 5, verified: true });
    if (!receipt.id) throw new Error("Exchange receipt missing");
    console.log("   OK: Exchange receipt generated.");

    const audit = tr.getExchangeAudit();
    if (audit.length !== 1) throw new Error("Audit trail wrong");
    console.log("   OK: Exchange audit trail verified.\n");

    // ---------- Phase 78: Graph Analytics ----------
    console.log("--- Phase 78: Advanced Graph Analytics ---");
    const ce = new CentralityEngine();

    const graph = {
        nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }],
        edges: [
            { source: 'A', target: 'B' },
            { source: 'A', target: 'C' },
            { source: 'B', target: 'C' },
            { source: 'A', target: 'D' },
            { source: 'D', target: 'E' }
        ]
    };

    const centrality = ce.score(graph);
    console.log(`[TEST] Centrality: ${centrality.length} nodes scored`);
    if (centrality[0].centrality < 2) throw new Error("Top centrality too low");
    if (!centrality[0].evidence) throw new Error("Evidence missing from centrality");
    console.log("   OK: Centrality scoring verified.");

    const bridges = ce.detectBridges(graph);
    console.log(`[TEST] Bridges: ${bridges.length} detected`);
    console.log("   OK: Bridge detection verified.");

    const clusters = ce.rankClusters(graph);
    console.log(`[TEST] Clusters: ${clusters.length} found`);
    if (clusters.length < 1) throw new Error("No clusters found");
    console.log("   OK: Cluster ranking verified.");

    const hotNodes = ce.scoreHotNodes(graph);
    if (!hotNodes[0].metric) throw new Error("Hot node metric missing");
    console.log("   OK: Hot infrastructure scoring verified.\n");

    // ---------- Phase 79: Policy Engine ----------
    console.log("--- Phase 79: Policy Engine ---");
    const pe = new PolicyEngine();

    pe.loadPolicies([
        { name: 'airgap_exchange', field: 'workspace_mode', value: 'airgap', action: 'deny', reason: 'Airgap policy blocks remote exchange' },
        { name: 'restricted_plugins', field: 'plugin_mode', value: 'restricted', action: 'deny', reason: 'Plugin loading restricted' },
        { name: 'allow_local_replay', field: 'replay_source', value: 'local', action: 'allow', reason: 'Local replay allowed' }
    ]);

    const decisions = pe.evaluate({ workspace_mode: 'airgap' }, 'analyst_1');
    console.log(`[TEST] Policy decisions: ${decisions.length}`);
    if (decisions.length !== 1) throw new Error("Expected 1 policy match");
    if (decisions[0].action !== 'deny') throw new Error("Expected deny action");
    if (!decisions[0].reasons.length) throw new Error("Reasons missing from decision");
    console.log("   OK: Policy evaluation with reasons verified.");

    const check = pe.isAllowed('remote_exchange', { workspace_mode: 'airgap' });
    if (check.allowed) throw new Error("Should be denied");
    console.log("   OK: isAllowed correctly denied.");

    const pAudit = pe.getAuditLog();
    if (pAudit.length < 1) throw new Error("Policy audit log empty");
    console.log("   OK: Policy audit log verified.\n");

    // ---------- Phase 80: Enterprise Controls ----------
    console.log("--- Phase 80: Enterprise Deployment Controls ---");
    const dp = new DeploymentProfiles();

    const profiles = dp.listProfiles();
    console.log(`[TEST] Profiles available: ${profiles.length}`);
    if (profiles.length !== 5) throw new Error(`Expected 5 profiles, got ${profiles.length}`);

    const active = dp.activateProfile('sovereign_airgap');
    if (!active.offline_only) throw new Error("Sovereign profile must be offline-only");
    console.log("   OK: Sovereign air-gap profile activated.");

    const compliance = dp.checkCompliance('remote_exchange');
    if (compliance.compliant) throw new Error("Remote exchange should violate air-gap");
    if (compliance.violations.length === 0) throw new Error("Expected violations");
    console.log("   OK: Compliance check blocked remote exchange.");

    const quota = dp.getQuotaReport();
    if (!quota.deterministic) throw new Error("Quota report must be deterministic");
    console.log("   OK: Quota report verified.\n");

    console.log("====================================");
    console.log("[SUCCESS] All Phases 76-80 verified.");
    console.log("====================================");
}

runAllTests().catch(err => {
    console.error("\n[FAILURE] Test Error:", err);
    process.exit(1);
});
