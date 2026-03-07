/**
 * AnomalyScorer.js (Phase 72)
 * ML-style anomaly scoring with explainable reason chains.
 * Every score includes: anomaly_score, severity, reasons[], features_assessed[].
 */
class AnomalyScorer {
    constructor() {
        this.scoringRules = [
            { feature: 'token_ttl_seconds', condition: v => v !== undefined && v < 60, weight: 35, reason: 'token_ttl_below_60s' },
            { feature: 'token_ttl_seconds', condition: v => v !== undefined && v < 10, weight: 15, reason: 'token_ttl_critically_low' },
            { feature: 'topology_rarity', condition: v => v !== undefined && v > 0.8, weight: 30, reason: 'rare_topology_pattern' },
            { feature: 'mutation_divergence', condition: v => v !== undefined && v > 0.7, weight: 25, reason: 'high_mutation_divergence' },
            { feature: 'segment_burst_rate', condition: v => v !== undefined && v > 100, weight: 20, reason: 'abnormal_segment_burst' },
            { feature: 'cdn_player_rarity', condition: v => v !== undefined && v > 0.9, weight: 25, reason: 'rare_cdn_player_combination' },
            { feature: 'cross_case_frequency', condition: v => v !== undefined && v === 1, weight: 15, reason: 'singleton_across_cases' }
        ];
        this.history = [];
    }

    /**
     * Score a single observation for anomalous behavior.
     */
    score(observation = {}) {
        let totalScore = 0;
        const reasons = [];
        const featuresAssessed = [];

        for (const rule of this.scoringRules) {
            if (observation[rule.feature] !== undefined) {
                featuresAssessed.push(rule.feature);
                if (rule.condition(observation[rule.feature])) {
                    totalScore += rule.weight;
                    reasons.push({
                        reason: rule.reason,
                        feature: rule.feature,
                        value: observation[rule.feature],
                        weight: rule.weight
                    });
                }
            }
        }

        const result = {
            anomaly_score: Math.min(totalScore, 100),
            severity: totalScore >= 70 ? 'HIGH' : totalScore >= 40 ? 'MEDIUM' : 'LOW',
            reasons,
            features_assessed: featuresAssessed,
            deterministic: true
        };

        this.history.push(result);
        return result;
    }

    /**
     * Score all bundles in a case with observable features.
     */
    scoreBundles(bundles, observationExtractor = null) {
        return bundles.map(b => {
            const obs = observationExtractor ? observationExtractor(b) : b;
            const result = this.score(obs);
            result.bundleId = b.path || b.id || 'unknown';
            return result;
        });
    }

    getStats() {
        return {
            totalScored: this.history.length,
            highSeverity: this.history.filter(h => h.severity === 'HIGH').length,
            mediumSeverity: this.history.filter(h => h.severity === 'MEDIUM').length,
            lowSeverity: this.history.filter(h => h.severity === 'LOW').length,
            averageScore: this.history.length > 0
                ? Math.round(this.history.reduce((s, h) => s + h.anomaly_score, 0) / this.history.length)
                : 0
        };
    }
}

module.exports = AnomalyScorer;
