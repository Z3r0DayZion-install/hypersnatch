/**
 * ThreatHeatmapEngine.js (Expansion)
 * Visualizes high-risk clusters across infrastructure, operators, and narratives.
 * Outputs risk density, cluster influence, and temporal activity spikes.
 */
class ThreatHeatmapEngine {
    constructor() { }

    generateHeatmap(graphContext) {
        const { nodes, edges } = graphContext;
        if (!nodes || !edges) return null;

        // 1. Calculate risk density by grouping connected high-risk nodes
        const riskClusters = [];
        const highRiskNodes = nodes.filter(n => n.properties && n.properties.riskScore > 70);

        // Simplistic clustering: single nodes with high risk + edge count
        for (const node of highRiskNodes) {
            const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
            riskClusters.push({
                centerNode: node.id,
                densityScore: node.properties.riskScore * connectedEdges.length,
                connectedNodes: connectedEdges.length
            });
        }

        // Sort by most dense/influential
        riskClusters.sort((a, b) => b.densityScore - a.densityScore);

        return {
            id: `heatmap_${Date.now()}`,
            status: 'generated',
            totalHighRiskNodes: highRiskNodes.length,
            hotspots: riskClusters.slice(0, 5), // Top 5 worst clusters
            generatedAt: new Date().toISOString()
        };
    }
}

module.exports = ThreatHeatmapEngine;
