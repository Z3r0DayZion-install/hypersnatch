/**
 * CentralityEngine.js (Phase 78)
 * Advanced graph analytics: centrality scoring, bridge node detection, cluster ranking, hot infrastructure.
 * All outputs include metric, score, source nodes/edges, and evidence summaries.
 */
class CentralityEngine {
    constructor() {
        this.lastResults = null;
    }

    /**
     * Compute degree centrality for all nodes in a graph.
     */
    score(graph = { nodes: [], edges: [] }) {
        const degree = {};
        graph.edges.forEach(e => {
            const src = e.source || e.from;
            const tgt = e.target || e.to;
            degree[src] = (degree[src] || 0) + 1;
            degree[tgt] = (degree[tgt] || 0) + 1;
        });

        const results = Object.keys(degree).map(id => ({
            node_id: id,
            centrality: degree[id],
            metric: 'degree',
            evidence: `Node has ${degree[id]} connections`
        })).sort((a, b) => b.centrality - a.centrality);

        this.lastResults = results;
        return results;
    }

    /**
     * Detect bridge nodes — nodes that connect otherwise separate clusters.
     */
    detectBridges(graph = { nodes: [], edges: [] }) {
        const adjacency = {};
        graph.edges.forEach(e => {
            const src = e.source || e.from;
            const tgt = e.target || e.to;
            if (!adjacency[src]) adjacency[src] = new Set();
            if (!adjacency[tgt]) adjacency[tgt] = new Set();
            adjacency[src].add(tgt);
            adjacency[tgt].add(src);
        });

        const bridges = [];
        for (const [node, neighbors] of Object.entries(adjacency)) {
            if (neighbors.size >= 2) {
                const neighborArr = Array.from(neighbors);
                let interconnected = 0;
                for (let i = 0; i < neighborArr.length; i++) {
                    for (let j = i + 1; j < neighborArr.length; j++) {
                        if (adjacency[neighborArr[i]] && adjacency[neighborArr[i]].has(neighborArr[j])) {
                            interconnected++;
                        }
                    }
                }
                const maxPairs = (neighborArr.length * (neighborArr.length - 1)) / 2;
                if (maxPairs > 0 && interconnected / maxPairs < 0.5) {
                    bridges.push({
                        node_id: node,
                        connections: neighbors.size,
                        bridgeScore: Math.round((1 - interconnected / maxPairs) * 100) / 100,
                        metric: 'bridge_coefficient',
                        evidence: `Connects ${neighbors.size} neighbors with low interconnection (${interconnected}/${maxPairs} pairs)`
                    });
                }
            }
        }

        return bridges.sort((a, b) => b.bridgeScore - a.bridgeScore);
    }

    /**
     * Rank clusters by size and connectivity.
     */
    rankClusters(graph = { nodes: [], edges: [] }) {
        const adjacency = {};
        graph.edges.forEach(e => {
            const src = e.source || e.from;
            const tgt = e.target || e.to;
            if (!adjacency[src]) adjacency[src] = new Set();
            if (!adjacency[tgt]) adjacency[tgt] = new Set();
            adjacency[src].add(tgt);
            adjacency[tgt].add(src);
        });

        const visited = new Set();
        const clusters = [];

        for (const node of Object.keys(adjacency)) {
            if (!visited.has(node)) {
                const cluster = [];
                const queue = [node];
                while (queue.length > 0) {
                    const current = queue.shift();
                    if (visited.has(current)) continue;
                    visited.add(current);
                    cluster.push(current);
                    (adjacency[current] || new Set()).forEach(n => {
                        if (!visited.has(n)) queue.push(n);
                    });
                }
                clusters.push({
                    id: `cluster_${clusters.length}`,
                    nodes: cluster,
                    size: cluster.length,
                    metric: 'connected_component'
                });
            }
        }

        return clusters.sort((a, b) => b.size - a.size);
    }

    /**
     * Score hot infrastructure nodes — high degree + high bridge score.
     */
    scoreHotNodes(graph) {
        const centrality = this.score(graph);
        const bridges = this.detectBridges(graph);
        const bridgeMap = {};
        bridges.forEach(b => { bridgeMap[b.node_id] = b.bridgeScore; });

        return centrality.map(c => ({
            node_id: c.node_id,
            hotScore: c.centrality + (bridgeMap[c.node_id] || 0) * 10,
            centrality: c.centrality,
            bridgeScore: bridgeMap[c.node_id] || 0,
            metric: 'composite_hot_score',
            evidence: `Degree=${c.centrality}, Bridge=${(bridgeMap[c.node_id] || 0).toFixed(2)}`
        })).sort((a, b) => b.hotScore - a.hotScore);
    }

    getStats() {
        return {
            lastResultCount: this.lastResults ? this.lastResults.length : 0
        };
    }
}

module.exports = CentralityEngine;
