/**
 * GlobalGraph.js (Phase 91)
 * Elevates evidence analysis to a global, multi-workspace intelligence graph.
 * Supports cross-case merging, lineage tracking, and neighborhood queries.
 */
class GlobalGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.lineage = new Map(); // tracks cases/workspaces that contributed a given node
    }

    addNode(id, type, data = {}, sourceCtx = {}) {
        if (!id || !type) throw new Error("Graph nodes require 'id' and 'type'");

        let node = this.nodes.get(id);
        if (!node) {
            node = { id, type, properties: { ...data }, firstSeen: Date.now(), lastUpdated: Date.now() };
            this.nodes.set(id, node);
            this._updateLineage(id, sourceCtx);
        } else {
            // Merge logic: preserve existing, append new
            node.properties = { ...node.properties, ...data };
            node.lastUpdated = Date.now();
            this._updateLineage(id, sourceCtx);
        }
        return node;
    }

    addEdge(sourceId, targetId, relation, data = {}, sourceCtx = {}) {
        const edge = { id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, source: sourceId, target: targetId, relation, ...data, ts: Date.now() };
        this.edges.push(edge);
        this._updateLineage(edge.id, sourceCtx, true);
        return edge;
    }

    _updateLineage(elementId, ctx, isEdge = false) {
        if (!ctx.caseId) return;

        let lin = this.lineage.get(elementId);
        if (!lin) {
            lin = { type: isEdge ? 'edge' : 'node', cases: new Set(), workspaces: new Set() };
            this.lineage.set(elementId, lin);
        }
        lin.cases.add(ctx.caseId);
        if (ctx.workspaceId) lin.workspaces.add(ctx.workspaceId);
    }

    getNeighborhood(nodeId, depth = 1) {
        if (!this.nodes.has(nodeId)) return { nodes: [], edges: [] };

        let currentDepth = 0;
        const visitedNodes = new Set([nodeId]);
        const resultEdges = new Set();

        let frontier = [nodeId];

        while (currentDepth < depth && frontier.length > 0) {
            const nextFrontier = [];
            for (const frontId of frontier) {
                // Find outgoing and incoming
                const connectedEdges = this.edges.filter(e => e.source === frontId || e.target === frontId);
                for (const e of connectedEdges) {
                    resultEdges.add(e);
                    const neighborId = e.source === frontId ? e.target : e.source;
                    if (!visitedNodes.has(neighborId)) {
                        visitedNodes.add(neighborId);
                        nextFrontier.push(neighborId);
                    }
                }
            }
            frontier = nextFrontier;
            currentDepth++;
        }

        return {
            nodes: Array.from(visitedNodes).map(id => this.nodes.get(id)),
            edges: Array.from(resultEdges)
        };
    }

    getLineage(elementId) {
        const lin = this.lineage.get(elementId);
        if (!lin) return null;
        return {
            cases: Array.from(lin.cases),
            workspaces: Array.from(lin.workspaces)
        };
    }

    summary() {
        return {
            node_count: this.nodes.size,
            edge_count: this.edges.length,
            lineage_tracked: this.lineage.size
        };
    }
}

module.exports = GlobalGraph;
