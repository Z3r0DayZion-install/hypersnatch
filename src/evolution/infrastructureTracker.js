/**
 * InfrastructureTracker.js (Phase 87)
 * Tracks infrastructure evolution across cases and time.
 * Detects CDN migrations, topology drift, and host appearance history.
 */
class InfrastructureTracker {
    constructor() {
        this.nodes = new Map(); // node_id -> node_history
        this.migrations = [];
    }

    record(node, caseId, timestamp = Date.now()) {
        const id = node.id || node.hostname || node.ip;
        if (!id) throw new Error("Node must have an id, hostname, or ip");

        let history = this.nodes.get(id);
        if (!history) {
            history = {
                nodeId: id,
                first_seen: timestamp,
                last_seen: timestamp,
                cases: [caseId],
                providers: [],
                sightings: 1
            };
            this.nodes.set(id, history);
        } else {
            history.last_seen = Math.max(history.last_seen, timestamp);
            history.first_seen = Math.min(history.first_seen, timestamp);
            if (!history.cases.includes(caseId)) history.cases.push(caseId);
            history.sightings++;
        }

        // Process provider / CDN migrations
        if (node.cdn || node.provider) {
            const prov = node.cdn || node.provider;
            if (!history.providers.includes(prov)) {
                if (history.providers.length > 0) {
                    // Migration detected
                    const migration = {
                        nodeId: id,
                        caseId,
                        timestamp,
                        from: history.providers[history.providers.length - 1],
                        to: prov
                    };
                    this.migrations.push(migration);
                }
                history.providers.push(prov);
            }
        }

        return history;
    }

    getHistory(nodeId) {
        return this.nodes.get(nodeId) || null;
    }

    getMigrations() {
        return this.migrations;
    }

    getDriftAnalysis() {
        const driftingNodes = Array.from(this.nodes.values()).filter(n => n.providers.length > 1);
        return {
            totalTracked: this.nodes.size,
            driftingNodes: driftingNodes.length,
            migrationEvents: this.migrations.length,
            highlyEvolutionary: driftingNodes.filter(n => n.providers.length >= 3).map(n => n.nodeId)
        };
    }

    getStats() {
        return {
            nodesTracked: this.nodes.size,
            migrationsDetected: this.migrations.length
        };
    }
}

module.exports = InfrastructureTracker;
