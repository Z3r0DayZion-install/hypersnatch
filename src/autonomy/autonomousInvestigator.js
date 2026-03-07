/**
 * AutonomousInvestigator.js (Phase 70)
 * Full auto-pilot forensic scanning — orchestrates the entire pipeline.
 */
class AutonomousInvestigator {
    constructor(engines) {
        this.patternEngine = engines.patternDiscovery;
        this.anomalyDetector = engines.anomalyDetector;
        this.insightGenerator = engines.insightGenerator;
        this.topologyMapper = engines.topologyMapper;
        this.ruleEngine = engines.ruleEngine;
    }

    /**
     * Run a full autonomous investigation on a set of bundles.
     * Pipeline: patterns → clusters → anomalies → topology → rules → insights
     */
    async run(bundles) {
        const report = {
            timestamp: new Date().toISOString(),
            bundleCount: bundles.length,
            stages: {},
            status: 'RUNNING'
        };

        try {
            // Stage 1: Pattern Discovery
            const patterns = this.patternEngine.discover(bundles);
            report.stages.patterns = { count: patterns.length, data: patterns };

            // Stage 2: Anomaly Detection
            const anomalies = this.anomalyDetector.detect(bundles, patterns);
            report.stages.anomalies = { count: anomalies.length, data: anomalies };

            // Stage 3: Topology Mapping
            let topology = null;
            if (this.topologyMapper) {
                topology = this.topologyMapper.mapCase(bundles);
                report.stages.topology = { nodes: topology.totalNodes, edges: topology.totalEdges };
            }

            // Stage 4: Rule Evaluation
            if (this.ruleEngine) {
                const allAlerts = [];
                bundles.forEach(b => {
                    const alerts = this.ruleEngine.evaluate(b);
                    allAlerts.push(...alerts);
                });
                report.stages.rules = { alertCount: allAlerts.length, data: allAlerts };
            }

            // Stage 5: Insight Generation
            const insights = this.insightGenerator.generate(patterns, anomalies, topology);
            report.stages.insights = { count: insights.length, data: insights };

            report.status = 'COMPLETE';
            report.summary = {
                patterns: patterns.length,
                anomalies: anomalies.length,
                insights: insights.length,
                topologyNodes: topology ? topology.totalNodes : 0,
                verdict: anomalies.length === 0 ? 'CLEAN' : anomalies.some(a => a.severity === 'HIGH') ? 'SUSPICIOUS' : 'REVIEW'
            };

        } catch (e) {
            report.status = 'ERROR';
            report.error = e.message;
        }

        return report;
    }
}

module.exports = AutonomousInvestigator;
