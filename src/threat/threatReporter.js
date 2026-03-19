/**
 * ThreatReporter.js (Phase 90)
 * Automatically generates Threat Intelligence reports from findings, 
 * anomalies, and timeline data.
 */
class ThreatReporter {
    constructor() {
        this.reports = [];
    }

    generate(caseData) {
        const findings = caseData.findings || [];
        const anomalies = caseData.anomalies || [];
        const timeline = caseData.timeline || null;
        const predictions = caseData.predictions || [];

        // 1. Calculate base threat level
        let levelScore = 0; // 0-10

        // Impact of High anomalies
        const highAnomalies = anomalies.filter(a => a.severity === 'HIGH' || a.riskScore >= 80);
        levelScore += highAnomalies.length * 2;

        // Impact of critical predictions
        const criticalPredictions = predictions.filter(p => p.riskLevel && p.riskLevel.includes('critical'));
        levelScore += criticalPredictions.length * 3;

        // Determine semantic level
        let threat_level = 'LOW';
        if (levelScore >= 8) threat_level = 'CRITICAL';
        else if (levelScore >= 5) threat_level = 'HIGH';
        else if (levelScore >= 3) threat_level = 'MODERATE';

        // 2. Build synthesis summary
        const summary = `Automated Threat Intelligence Report for Case ${caseData.id || 'Unknown'}. ` +
            `Assessed threat level is ${threat_level} based on ${findings.length} findings, ` +
            `${anomalies.length} anomalies, and ${predictions.length} predictive risks.`;

        // 3. Assemble report
        const report = {
            id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            caseId: caseData.id || 'Unknown',
            generatedAt: new Date().toISOString(),
            threat_level,
            score: Math.min(levelScore, 10),
            summary,
            indicatorsOfInterest: [],
            timelineHighlights: []
        };

        // Extract IoCs from findings
        findings.forEach(f => {
            if (f.indicator) report.indicatorsOfInterest.push(f.indicator);
        });

        if (timeline && timeline.bursts) {
            report.timelineHighlights = timeline.bursts.map(b =>
                `Burst of ${b.eventCount} events at ${new Date(b.startTs).toISOString()}`
            );
        }

        this.reports.push(report);
        return report;
    }

    getReports() {
        return this.reports;
    }

    getStats() {
        return {
            totalReports: this.reports.length,
            criticalThreats: this.reports.filter(r => r.threat_level === 'CRITICAL').length
        };
    }
}

module.exports = ThreatReporter;
