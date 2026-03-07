/**
 * CounterfactualSimulator.js (Phase 97)
 * Tests alternate hypotheses by removing or altering key evidence 
 * and recalculating downstream assumptions.
 */
class CounterfactualSimulator {
    constructor() { }

    simulateRemoval(evidenceId, currentGraph) {
        const alteredGraph = {
            nodes: currentGraph.nodes.filter(n => n.sourceId !== evidenceId),
            edges: currentGraph.edges.filter(e => e.source !== evidenceId && e.target !== evidenceId)
        };

        // Simulate drop in confidence 
        let confidenceImpact = 0;
        const removedNodes = currentGraph.nodes.length - alteredGraph.nodes.length;

        if (removedNodes > 0) {
            confidenceImpact = Math.min((removedNodes / currentGraph.nodes.length) * 100, 100);
        }

        return {
            simulationId: `cf_${Date.now()}`,
            evidenceRemoved: evidenceId,
            nodesLost: removedNodes,
            confidenceImpactPercentage: confidenceImpact.toFixed(2),
            wouldChangeConclusion: confidenceImpact > 30, // threshold
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = CounterfactualSimulator;
