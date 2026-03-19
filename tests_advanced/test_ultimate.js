const NarrativePropagationEngine = require('../src/advanced/narrativePropagationEngine');
const OperatorBehaviorEngine = require('../src/advanced/operatorBehaviorEngine');
const PredictiveIntelligenceEngine = require('../src/advanced/predictiveIntelligenceEngine');
const AutonomousAssistantEngine = require('../src/advanced/autonomousAssistantEngine');

async function runAllTests() {
    console.log("=== Phase 101-150 Ultimate Evolution Tests ===\n");

    const npe = new NarrativePropagationEngine();
    const obe = new OperatorBehaviorEngine();
    const pie = new PredictiveIntelligenceEngine();
    const aae = new AutonomousAssistantEngine(npe, obe, pie);

    // ---------- Narrative Propagation ----------
    console.log("--- Narrative Propagation Engine ---");
    const t0 = { nodes: [{ id: 'A' }], edges: [] };
    const t1 = { nodes: [{ id: 'A' }, { id: 'B' }], edges: [{ source: 'A', target: 'B' }] };
    const t2 = {
        nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }],
        edges: [{ source: 'A', target: 'B' }, { source: 'B', target: 'C' }, { source: 'B', target: 'D' }, { source: 'C', target: 'D' }]
    };

    const propResult = npe.trackPropagation([t0, t1, t2]);
    if (propResult.propagationVelocity !== "1.33") throw new Error(`Wrong velocity: ${propResult.propagationVelocity}`);
    if (propResult.roleDistribution.originCount !== 3) throw new Error("Failed to count origin sprouts");

    console.log(`   OK: Narrative velocity calculated [${propResult.propagationVelocity} edges/tick].`);
    console.log(`   OK: Identified ${propResult.roleDistribution.originCount} spontaneous origins and structured role distributions.\n`);


    // ---------- Operator Behavior Modeling ----------
    console.log("--- Operator Behavior Engine ---");
    const logs = [
        { type: 'deployment', infrastructure: 'aws_ec2', timestamp: '2026-03-01T02:00:00Z' }, // 02:00
        { type: 'command', infrastructure: 'aws_ec2', timestamp: '2026-03-01T02:30:00Z' },
        { type: 'deployment', infrastructure: 'gcp_compute', timestamp: '2026-03-02T02:00:00Z' } // 02:00
    ];

    const model = obe.modelBehavior('GHOST_99', logs);
    if (!model) throw new Error("Behavior model failed to generate");
    if (model.peakDeploymentHourUtc !== 2) throw new Error("Failed to extract peak behavior hours");
    if (model.reusedInfrastructurePct !== (2 / 3) * 100) throw new Error("Infrastructure reuse percentage wrong");

    console.log(`   OK: Operator GHOST_99 profiled successfully.`);
    console.log(`   OK: Behavior metrics locked: [Peak Hour: ${model.peakDeploymentHourUtc}:00 UTC, Infra Reuse: ${model.reusedInfrastructurePct.toFixed(1)}%]\n`);


    // ---------- Predictive Intelligence ----------
    console.log("--- Predictive Intelligence Engine ---");
    // Feed in previous results
    const forecast = pie.forecast(propResult, model);

    if (forecast.predictions.length !== 1) throw new Error("Expected 1 temporal prediction");
    if (forecast.predictions[0].type !== 'temporal_forecast') throw new Error("Incorrect prediction type");

    console.log(`   OK: Forecast generated based on operator habits.`);
    console.log(`   OK: Prediction: "${forecast.predictions[0].prediction}" (Conf: ${forecast.predictions[0].confidence.toFixed(2)})\n`);


    // ---------- Autonomous Assistant ----------
    console.log("--- Autonomous Investigation Assistant ---");
    const assist = aae.synthesize([t0, t1, t2], logs);

    if (assist.subsystemStates.narrativeTracked !== true) throw new Error("Subsystem sequence failed");
    if (assist.generatedSuggestions.length === 0) throw new Error("Copilot failed to suggest vectors");

    console.log(`   OK: Assistant synthesized signals from Narrative, Behavior, and Predictive sub-engines.`);
    console.log(`   OK: Autonomously generated ${assist.generatedSuggestions.length} active investigation recommendations.\n`);

    console.log("====================================");
    console.log("[SUCCESS] Phase 101-150 Ultimate Evolution verified.");
    console.log("====================================");
}

runAllTests().catch(err => {
    console.error("\n[FAILURE] Test Error:", err);
    process.exit(1);
});
