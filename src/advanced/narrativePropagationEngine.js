/**
 * NarrativePropagationEngine.js (Phase 101-150)
 * Tracks algorithmic spread of signals across network structures, identifying
 * origin nodes, active amplifiers, narrative bridges, and suppression points.
 */
class NarrativePropagationEngine {
    constructor() { }

    trackPropagation(graphSequence) {
        if (!graphSequence || graphSequence.length < 2) return null;

        const propagationMap = {
            origins: [],
            amplifiers: [],
            bridges: [],
            velocity: 0
        };

        let totalEdgesDelta = 0;

        // T0 = original state, Tn = subsequent states
        const t0 = graphSequence[0];
        const tn = graphSequence[graphSequence.length - 1];

        totalEdgesDelta = tn.edges.length - t0.edges.length;
        propagationMap.velocity = totalEdgesDelta / graphSequence.length;

        // Identify node roles
        for (const node of tn.nodes) {
            const initialEdges = t0.edges.filter(e => e.source === node.id || e.target === node.id).length;
            const finalEdges = tn.edges.filter(e => e.source === node.id || e.target === node.id).length;
            const edgeGrowth = finalEdges - initialEdges;

            const wasInT0 = t0.nodes.some(n => n.id === node.id);

            if (!wasInT0 && finalEdges > 0) {
                propagationMap.origins.push(node.id); // Appeared and sprouted
            } else if (edgeGrowth > 10) {
                propagationMap.amplifiers.push(node.id); // Massive growth
            } else if (edgeGrowth > 0 && finalEdges > 2) {
                propagationMap.bridges.push(node.id); // Connected multiple subgraphs
            }
        }

        return {
            id: `prop_${Date.now()}`,
            status: 'tracked',
            roleDistribution: {
                originCount: propagationMap.origins.length,
                amplifierCount: propagationMap.amplifiers.length,
                bridgeCount: propagationMap.bridges.length
            },
            propagationVelocity: propagationMap.velocity.toFixed(2),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = NarrativePropagationEngine;
