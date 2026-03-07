/**
 * InsightGenerator.js (Phase 68)
 * Autonomous generation of forensic insights and findings from patterns.
 */
class InsightGenerator {
    constructor() {
        this.insights = [];
    }

    /**
     * Generate insights from discovered patterns and anomalies.
     */
    generate(patterns, anomalies = [], topology = null) {
        this.insights = [];

        // Pattern frequency insights
        patterns.forEach(p => {
            if (p.frequency >= 3) {
                this.insights.push({
                    type: 'DOMINANT_PATTERN',
                    severity: 'INFO',
                    message: `Infrastructure pattern "${p.key}" appears ${p.frequency} times — likely a primary delivery stack.`,
                    data: { key: p.key, frequency: p.frequency }
                });
            }
        });

        // Anomaly-driven insights
        anomalies.forEach(a => {
            if (a.severity === 'HIGH') {
                this.insights.push({
                    type: 'HIGH_RISK_ANOMALY',
                    severity: 'WARNING',
                    message: `Bundle "${a.bundleId}" uses a unique infrastructure stack not seen in other evidence — possible evasion or migration.`,
                    data: a
                });
            }
        });

        // CDN diversity insight
        const uniqueCdns = new Set(patterns.map(p => p.cdn).filter(c => c !== 'UNKNOWN'));
        if (uniqueCdns.size > 2) {
            this.insights.push({
                type: 'CDN_DIVERSITY',
                severity: 'INFO',
                message: `${uniqueCdns.size} distinct CDN providers detected across patterns — multi-CDN strategy or migration in progress.`,
                data: { cdns: Array.from(uniqueCdns) }
            });
        }

        // Protocol diversity insight
        const uniqueProtocols = new Set(patterns.map(p => p.protocol).filter(p => p !== 'UNKNOWN'));
        if (uniqueProtocols.size > 2) {
            this.insights.push({
                type: 'PROTOCOL_DIVERSITY',
                severity: 'INFO',
                message: `${uniqueProtocols.size} streaming protocols detected — complex delivery architecture.`,
                data: { protocols: Array.from(uniqueProtocols) }
            });
        }

        // Topology insights
        if (topology && topology.totalNodes > 10) {
            this.insights.push({
                type: 'COMPLEX_TOPOLOGY',
                severity: 'INFO',
                message: `Infrastructure topology contains ${topology.totalNodes} nodes and ${topology.totalEdges} edges — complex delivery network.`,
                data: { nodes: topology.totalNodes, edges: topology.totalEdges }
            });
        }

        return this.insights;
    }

    getInsights() { return this.insights; }

    getStats() {
        return {
            totalInsights: this.insights.length,
            warnings: this.insights.filter(i => i.severity === 'WARNING').length,
            info: this.insights.filter(i => i.severity === 'INFO').length
        };
    }
}

module.exports = InsightGenerator;
