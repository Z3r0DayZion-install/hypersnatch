/**
 * PredictiveAnomaly.js (Phase 88)
 * Predicts anomalies before they occur based on historical pattern accumulation
 * and behavioral trajectory.
 */
class PredictiveAnomaly {
    constructor() {
        this.predictions = [];
    }

    /**
     * Predict risk based on a sequence of observed patterns over time.
     */
    predict(patternHistory, context = {}) {
        if (!patternHistory || !Array.isArray(patternHistory)) {
            throw new Error("Pattern history array required");
        }

        let riskLevel = "normal";
        const reasons = [];
        let riskScore = 0; // 0-100

        // 1. Pattern Repetition Velocity
        if (patternHistory.length >= 3) {
            // If the same pattern happens rapidly
            const recent = patternHistory.slice(-3);
            const typeSet = new Set(recent.map(p => p.type || p.label));
            if (typeSet.size === 1) {
                riskScore += 40;
                reasons.push("Rapid repetition of identical pattern");
            }
        }

        // 2. Escalation Trajectory (INFO -> WARN -> HIGH)
        const severityValues = { 'INFO': 1, 'LOW': 2, 'MEDIUM': 3, 'WARN': 4, 'HIGH': 5, 'CRITICAL': 6 };
        let escalationDetected = false;
        for (let i = 1; i < patternHistory.length; i++) {
            const prev = severityValues[patternHistory[i - 1].severity] || 0;
            const curr = severityValues[patternHistory[i].severity] || 0;
            if (curr > prev && curr >= 4) {
                escalationDetected = true;
            }
        }
        if (escalationDetected) {
            riskScore += 50;
            reasons.push("Severity escalation trajectory detected");
        }

        // 3. Known Predictive Risk Flags
        if (context.has_proxy_evasion_history) {
            riskScore += 30;
            reasons.push("History of proxy evasion (high predictive risk)");
        }

        // Determine discrete tier
        riskScore = Math.min(riskScore, 100);
        if (riskScore >= 80) riskLevel = "critical_predictive";
        else if (riskScore >= 50) riskLevel = "elevated_predictive";
        else if (riskScore >= 20) riskLevel = "monitored";

        const prediction = {
            id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            targetId: context.targetId || 'unknown',
            riskLevel,
            riskScore,
            reasons,
            predictedAt: new Date().toISOString()
        };

        this.predictions.push(prediction);
        return prediction;
    }

    getHighRiskPredictions() {
        return this.predictions.filter(p => p.riskScore >= 50);
    }

    getStats() {
        return {
            totalPredictions: this.predictions.length,
            critical: this.predictions.filter(p => p.riskLevel === 'critical_predictive').length
        };
    }
}

module.exports = PredictiveAnomaly;
