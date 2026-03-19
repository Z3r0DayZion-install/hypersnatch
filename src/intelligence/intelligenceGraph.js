/**
 * IntelligenceGraph.js
 * Relational mapping system for forensic artifacts.
 */
class IntelligenceGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
    }

    addNode(type, id, data = {}) {
        if (!id) return;
        this.nodes.set(id, { type, data, timestamp: new Date().toISOString() });
    }

    addEdge(source, target, relation) {
        if (!source || !target) return;
        // Prevent duplicate edges
        const exists = this.edges.some(e =>
            e.source === source && e.target === target && e.relation === relation
        );
        if (!exists) {
            this.edges.push({ source, target, relation, timestamp: new Date().toISOString() });
        }
    }

    getNode(id) {
        return this.nodes.get(id);
    }

    getEdgesForNode(id) {
        return this.edges.filter(e => e.source === id || e.target === id);
    }

    getAllNodes() {
        return Array.from(this.nodes.entries()).map(([id, val]) => ({ id, ...val }));
    }

    getAllEdges() {
        return this.edges;
    }

    clear() {
        this.nodes.clear();
        this.edges = [];
    }
}

module.exports = IntelligenceGraph;
