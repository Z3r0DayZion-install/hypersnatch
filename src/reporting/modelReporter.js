/**
 * ModelReporter.js (Phase 84)
 * AI-assisted report generation from case findings, graph analytics, and anomaly scores.
 * Produces structured analyst briefs with evidence chains.
 */
class ModelReporter {
    constructor() {
        this.reports = [];
    }

    generate(caseData) {
        const findings = caseData.findings || [];
        const anomalies = caseData.anomalies || [];
        const graphMetrics = caseData.graphMetrics || {};
        const classifications = caseData.classifications || [];

        // Build executive summary
        const sections = [];

        sections.push({
            title: 'Executive Summary',
            content: `Analysis of case ${caseData.id || 'UNKNOWN'} containing ${caseData.bundleCount || 0} bundles. ` +
                `${findings.length} findings, ${anomalies.length} anomalies, ${classifications.length} classified patterns.`
        });

        // Findings section
        if (findings.length > 0) {
            sections.push({
                title: 'Key Findings',
                items: findings.map(f => ({
                    type: f.type || 'FINDING',
                    summary: f.message || f.summary || 'No description',
                    severity: f.severity || 'INFO',
                    evidence: f.evidence || []
                }))
            });
        }

        // Anomaly section
        if (anomalies.length > 0) {
            const highSeverity = anomalies.filter(a => a.severity === 'HIGH');
            sections.push({
                title: 'Anomaly Analysis',
                summary: `${anomalies.length} anomalies detected (${highSeverity.length} HIGH severity)`,
                items: anomalies.slice(0, 10).map(a => ({
                    score: a.anomaly_score || a.score || 0,
                    severity: a.severity || 'LOW',
                    reasons: a.reasons || []
                }))
            });
        }

        // Graph section
        if (graphMetrics.centralNodes) {
            sections.push({
                title: 'Infrastructure Topology',
                summary: `${graphMetrics.centralNodes.length} central nodes identified`,
                hotNodes: graphMetrics.hotNodes || [],
                bridges: graphMetrics.bridges || []
            });
        }

        // Recommendations
        const recommendations = [];
        if (anomalies.filter(a => a.severity === 'HIGH').length > 0) {
            recommendations.push('Review HIGH-severity anomalies for potential infrastructure abuse indicators.');
        }
        if (classifications.filter(c => c.label === 'UNKNOWN_PATTERN').length > 0) {
            recommendations.push('Unclassified patterns found — consider adding to fingerprint library.');
        }
        if (findings.length > 5) {
            recommendations.push('Significant finding volume — consider splitting into sub-cases for focused review.');
        }

        const report = {
            id: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            caseId: caseData.id || 'UNKNOWN',
            generatedAt: new Date().toISOString(),
            summary: sections[0].content,
            sections,
            recommendations,
            metadata: {
                bundleCount: caseData.bundleCount || 0,
                findingCount: findings.length,
                anomalyCount: anomalies.length,
                classificationCount: classifications.length
            }
        };

        this.reports.push(report);
        return report;
    }

    getStats() {
        return {
            totalReports: this.reports.length
        };
    }
}

module.exports = ModelReporter;
