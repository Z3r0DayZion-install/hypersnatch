const MissionReplayEngine = require('../src/endgame/missionReplayEngine');
const CounterfactualSimulator = require('../src/endgame/counterfactualEngine');
const EvidenceWeightEngine = require('../src/endgame/evidenceWeightEngine');
const ChallengeModeEngine = require('../src/endgame/challengeModeEngine');
const StrategicCommandEngine = require('../src/endgame/strategicCommandEngine');

async function runAllTests() {
    console.log("=== Phases 96-100: Endgame Master Pack Full Test Suite ===\n");

    const mre = new MissionReplayEngine();
    const cfs = new CounterfactualSimulator();
    const ewe = new EvidenceWeightEngine();
    const cme = new ChallengeModeEngine();
    const cmd = new StrategicCommandEngine(mre, cfs, ewe, cme);

    // ---------- Phase 96: Mission Replay ----------
    console.log("--- Phase 96: Mission Replay ---");
    const t0 = Date.now();
    const events = [
        { type: 'ingestion', timestamp: t0 - 5000 },
        { type: 'processing', timestamp: t0 - 4000 },
        { type: 'attribution', timestamp: t0 - 2000 },
        { type: 'conclusion', timestamp: t0 }
    ];

    const replay = cmd.executeCommand('REPLAY_MISSION', { caseId: 'CASE_ENDGAME', events });
    if (replay.timeToAttributionMs !== 3000) throw new Error("Replay attribution timing off");
    if (replay.totalMissionTimeMs !== 5000) throw new Error("Replay mission timing off");
    if (replay.milestones.length !== 3) throw new Error("Replay missed milestones");
    console.log(`   OK: Mission Replay correctly mapped timestamps [Total: ${replay.totalMissionTimeMs}ms]\n`);


    // ---------- Phase 97: Counterfactual Simulator ----------
    console.log("--- Phase 97: Counterfactual Simulator ---");
    const mockGraph = {
        nodes: [{ id: 'n1', sourceId: 'ev_dns' }, { id: 'n2', sourceId: 'ev_dns' }, { id: 'n3', sourceId: 'ev_cert' }],
        edges: []
    };

    const sim = cmd.executeCommand('TEST_COUNTERFACTUAL', { evidenceId: 'ev_dns', graph: mockGraph });
    if (sim.nodesLost !== 2) throw new Error("Counterfactual didn't remove correct nodes");
    if (!sim.wouldChangeConclusion) throw new Error("Counterfactual didn't trigger threshold");

    console.log(`   OK: Counterfactual Simulation removed ${sim.nodesLost} nodes. Impact: ${sim.confidenceImpactPercentage}%`);
    console.log(`   OK: Simulation determined this WOULD ${sim.wouldChangeConclusion ? 'change' : 'not change'} the conclusion.\n`);


    // ---------- Phase 98: Evidence Constitution ----------
    console.log("--- Phase 98: Evidence Constitution ---");
    const evidenceVector = [
        { id: 'dns1', type: 'dns_resolution' },
        { id: 'user', type: 'user_assertion' }
    ];

    const weightResult = cmd.executeCommand('WEIGH_EVIDENCE', { evidenceArray: evidenceVector });
    if (weightResult.score !== "0.900") throw new Error(`Weight score incorrect: ${weightResult.score}`);
    if (weightResult.strongestEvidenceType !== 'dns_resolution') throw new Error("Failed to extract strongest evidence");

    console.log(`   OK: Constitution enforced. Total Weight Score: ${weightResult.score}`);
    console.log(`   OK: Strongest evidential base: ${weightResult.strongestEvidenceType}\n`);


    // ---------- Phase 99: Challenge Mode ----------
    console.log("--- Phase 99: Challenge Mode ---");
    const conclusionStr = "The infrastructure belongs to high-risk actor X.";
    const mockAttribution = { confidence: 0.85, alternatives: [{ provider: 'generic_cloud', confidence: 0.20 }] };
    const mockGaps = [{ gap: "missing final target" }];

    const challenge = cmd.executeCommand('CHALLENGE_CONCLUSION', {
        conclusion: conclusionStr,
        attribution: mockAttribution,
        gaps: mockGaps
    });

    if (challenge.counterArguments.length !== 2) throw new Error("Challenge failed to generate arguments");
    if (challenge.challengeSeverity !== 'HIGH') throw new Error("Challenge severity should be HIGH");

    console.log(`   OK: Challenge Mode generated ${challenge.counterArguments.length} arguments.`);
    console.log(`   OK: Argument 1: [${challenge.counterArguments[0].type}] - ${challenge.counterArguments[0].argument}`);
    console.log(`   OK: Argument 2: [${challenge.counterArguments[1].type}] - ${challenge.counterArguments[1].argument}\n`);


    // ---------- Phase 100: Strategic Command Layer ----------
    console.log("--- Phase 100: Strategic Command Layer ---");
    const history = cmd.getCommandHistory();
    if (history.length !== 4) throw new Error("Command orchestration history invalid");
    if (!history.every(h => h.success)) throw new Error("One or more commands failed orchestration");

    console.log(`   OK: Strategic Command Layer correctly orchestrated all ${history.length} endgame modules.`);
    console.log(`   OK: Unified command log preserved.\n`);

    console.log("====================================");
    console.log("[SUCCESS] Endgame Master Pack Phases 96-100 verified.");
    console.log("====================================");
}

runAllTests().catch(err => {
    console.error("\n[FAILURE] Test Error:", err);
    process.exit(1);
});
