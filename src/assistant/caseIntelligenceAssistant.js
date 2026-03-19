/**
 * CaseIntelligenceAssistant.js (Phase 69)
 * Provides contextual suggestions and forensic advice based on case data.
 */
class CaseIntelligenceAssistant {
    constructor(patternEngine, anomalyDetector, insightGenerator) {
        this.patternEngine = patternEngine;
        this.anomalyDetector = anomalyDetector;
        this.insightGenerator = insightGenerator;
    }

    /**
     * Suggest related bundles based on shared infrastructure.
     */
    suggestRelated(targetBundle, allBundles) {
        const targetCdn = (targetBundle.cdn || '').toUpperCase();
        const targetProto = (targetBundle.protocol || '').toUpperCase();

        return allBundles.filter(b => {
            if (b.path === targetBundle.path) return false;
            const cdn = (b.cdn || '').toUpperCase();
            const proto = (b.protocol || '').toUpperCase();
            return cdn === targetCdn || proto === targetProto;
        }).map(b => ({
            bundleId: b.path || b.id,
            matchReason: (b.cdn || '').toUpperCase() === targetCdn ? 'SHARED_CDN' : 'SHARED_PROTOCOL',
            confidence: (b.cdn || '').toUpperCase() === targetCdn && (b.protocol || '').toUpperCase() === targetProto ? 'HIGH' : 'MEDIUM'
        }));
    }

    /**
     * Highlight anomalies in the current case.
     */
    highlightAnomalies(bundles) {
        const patterns = this.patternEngine.discover(bundles);
        return this.anomalyDetector.detect(bundles, patterns);
    }

    /**
     * Propose replay experiments for a given bundle.
     */
    proposeExperiments(bundle) {
        const experiments = [];

        if (bundle.cdn) {
            experiments.push({
                type: 'HEADER_MUTATION',
                description: `Test CDN response with modified User-Agent for ${bundle.cdn}`,
                config: { modifyHeaders: { 'User-Agent': 'Mozilla/5.0 (Research)' }, enabled: true }
            });
        }

        if (bundle.token) {
            experiments.push({
                type: 'TOKEN_REPLAY',
                description: `Replay with expired/modified token to test TTL enforcement`,
                config: { injectTokens: 'expired_token=true', enabled: true }
            });
        }

        experiments.push({
            type: 'PROTOCOL_PROBE',
            description: `Test protocol downgrade resilience (${bundle.protocol || 'UNKNOWN'} → HTTP)`,
            config: { modifyHeaders: { 'X-Protocol-Override': 'http' }, enabled: true }
        });

        return experiments;
    }

    /**
     * Generate a case intelligence briefing.
     */
    generateBriefing(caseData) {
        const bundles = caseData.bundles || [];
        const patterns = this.patternEngine.discover(bundles);
        const anomalies = this.anomalyDetector.detect(bundles, patterns);
        const insights = this.insightGenerator.generate(patterns, anomalies);

        return {
            caseId: caseData.id,
            timestamp: new Date().toISOString(),
            summary: {
                totalBundles: bundles.length,
                patterns: patterns.length,
                recurringPatterns: patterns.filter(p => p.frequency >= 2).length,
                anomalies: anomalies.length,
                insights: insights.length
            },
            topFindings: insights.slice(0, 5),
            recommendations: this._generateRecommendations(patterns, anomalies)
        };
    }

    _generateRecommendations(patterns, anomalies) {
        const recs = [];
        if (anomalies.length > 0) {
            recs.push('Investigate anomalous bundles that deviate from established infrastructure patterns.');
        }
        if (patterns.filter(p => p.frequency >= 3).length > 0) {
            recs.push('Dominant infrastructure pattern identified — consider deep-diving into this delivery stack.');
        }
        if (anomalies.some(a => a.severity === 'HIGH')) {
            recs.push('HIGH severity anomalies detected — prioritize investigation of these bundles.');
        }
        return recs;
    }
}

module.exports = CaseIntelligenceAssistant;
