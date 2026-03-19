/**
 * PredictiveIntelligenceEngine.js (Phase 101-150)
 * Forecasts likely future actions based on operator models and graph trends.
 */
class PredictiveIntelligenceEngine {
    constructor() { }

    forecast(graphTrends, behaviorProfile) {
        const forecasts = [];
        const confidenceDecay = 0.85; // Confidence naturally decays over time/jumps

        if (behaviorProfile) {
            const nextDeploymentHour = behaviorProfile.peakDeploymentHourUtc;
            forecasts.push({
                type: 'temporal_forecast',
                prediction: `Next deployment expected around ${nextDeploymentHour}:00 UTC.`,
                confidence: (behaviorProfile.modelConfidence === 'HIGH' ? 0.9 : 0.4) * confidenceDecay
            });

            if (behaviorProfile.reusedInfrastructurePct < 30) {
                forecasts.push({
                    type: 'infrastructure_forecast',
                    prediction: `High probability of adopting novel infrastructure for next campaign.`,
                    confidence: 0.8 * confidenceDecay
                });
            }
        }

        if (graphTrends && graphTrends.propagationVelocity > 5) {
            forecasts.push({
                type: 'trend_forecast',
                prediction: `Graph edge velocity (${graphTrends.propagationVelocity}) indicates imminent narrative scale-up.`,
                confidence: 0.95 * confidenceDecay
            });
        }

        return {
            id: `forecast_${Date.now()}`,
            status: 'generated',
            predictions: forecasts,
            aggregateConfidence: forecasts.length > 0 ? forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length : 0,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = PredictiveIntelligenceEngine;
