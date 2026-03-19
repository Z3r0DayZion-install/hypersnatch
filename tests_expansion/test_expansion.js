const AnalystMemoryLayer = require('../src/expansion/analystMemoryLayer');
const ThreatHeatmapEngine = require('../src/expansion/threatHeatmapEngine');
const DataProvenanceSystem = require('../src/expansion/dataProvenanceSystem');
const ExplainabilityLayer = require('../src/expansion/explainabilityLayer');

async function runAllTests() {
    console.log("=== Post-100 Expansion: Advanced Intelligence Layer Tests ===\n");

    // ---------- Analyst Memory Layer ----------
    console.log("--- Analyst Memory Layer ---");
    const aml = new AnalystMemoryLayer();

    aml.recordDecision('CASE_ALPHA', 'analyst_01', 'sug_123', 'accepted', 'Looks solid.');
    aml.annotate('CASE_ALPHA', 'analyst_01', 'n_host_4', 'This IP keeps recurring outside typical hours.');

    const caseMem = aml.getCaseMemory('CASE_ALPHA');
    if (caseMem.decisions.length !== 1) throw new Error("Decision memory failed to record");
    if (caseMem.annotations.length !== 1) throw new Error("Annotation memory failed to record");

    console.log(`   OK: Institutional memory synced 1 decision and 1 annotation for CASE_ALPHA.\n`);


    // ---------- Threat Heatmap Engine ----------
    console.log("--- Threat Heatmap Engine ---");
    const the = new ThreatHeatmapEngine();

    const mockGraphContext = {
        nodes: [
            { id: 'h1', properties: { riskScore: 85 } },
            { id: 'h2', properties: { riskScore: 90 } },
            { id: 'safe1', properties: { riskScore: 10 } }
        ],
        edges: [
            { source: 'h1', target: 'h2' },
            { source: 'h1', target: 'safe1' }
        ]
    };

    const heatmap = the.generateHeatmap(mockGraphContext);
    if (heatmap.totalHighRiskNodes !== 2) throw new Error("Heatmap failed to isolate high-risk nodes");
    if (heatmap.hotspots.length !== 2) throw new Error("Heatmap failed to group hotspots");
    if (heatmap.hotspots[0].densityScore !== 170) throw new Error("Heatmap density scoring calculation failed"); // 85 * 2 edges

    console.log(`   OK: Identified 2 high-risk nodes.`);
    console.log(`   OK: Generated hotspot clusters correctly mapped density scores [Max: ${heatmap.hotspots[0].densityScore}].\n`);


    // ---------- Data Provenance System ----------
    console.log("--- Data Provenance System ---");
    const dps = new DataProvenanceSystem();

    dps.tagSignal('sig_777', 'Pixeldrain API', 'public_leaks_db');
    dps.appendStep('sig_777', 'SmartDecode Parser', 0.9);
    dps.appendStep('sig_777', 'Graph Ingestion', 1.0);

    const trace = dps.getTrace('sig_777');
    if (trace.source !== 'Pixeldrain API') throw new Error("Provenance tag dropped source");
    if (trace.processingChain.length !== 2) throw new Error("Provenance chain lost steps");
    if (trace.processingChain[0].weight !== 0.9) throw new Error("Provenance failed to log temporal weights");

    console.log(`   OK: Provenance logged origin [${trace.source}].`);
    console.log(`   OK: Execution chain preserved ${trace.processingChain.length} immutable step transitions.\n`);


    // ---------- Explainability Layer ----------
    console.log("--- Explainable AI (XAI) Layer ---");
    const xai = new ExplainabilityLayer();

    const attributionExplain = xai.explain('attribution', {
        provider: 'AWS CloudFront',
        confidence: 0.92,
        reasons: ['JWT signing pattern matched AWS baseline', 'ASNs correspond to AWS delivery ranges']
    });

    if (!attributionExplain.reasoningTree || attributionExplain.reasoningTree.length !== 2) throw new Error("Failed to map reasoning tree");
    if (attributionExplain.evidenceContribution.primary !== 'JWT signing pattern matched AWS baseline') throw new Error("Failed to isolate primary evidence contribution");

    console.log(`   OK: XAI mapped reasoning tree bridging attribution logic.`);
    console.log(`   OK: XAI isolated primary contribution parameters for human analyst review.\n`);

    console.log("====================================");
    console.log("[SUCCESS] Post-100 Expansion layers successfully verified.");
    console.log("====================================");
}

runAllTests().catch(err => {
    console.error("\n[FAILURE] Test Error:", err);
    process.exit(1);
});
