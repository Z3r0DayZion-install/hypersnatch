/**
 * ExplainabilityLayer.js (Expansion)
 * Exposes reasoning trees, evidence contributions, and "why this result?" logic.
 */
class ExplainabilityLayer {
    constructor() { }

    explain(resultType, context) {
        if (resultType === 'attribution') {
            const { provider, confidence, reasons } = context;
            return {
                title: `Why was this attributed to ${provider}?`,
                confidenceBreakdown: `Base attribution locked at ${(confidence * 100).toFixed(1)}%.`,
                reasoningTree: reasons.map((r, i) => `Step ${i + 1}: ${r}`),
                evidenceContribution: {
                    primary: reasons[0] || 'Unknown heuristics',
                    secondary: reasons.length > 1 ? reasons.slice(1) : []
                }
            };
        }
        else if (resultType === 'anomaly') {
            return {
                title: `Why is this considered an anomaly?`,
                reasoningTree: [
                    "1. Behavior deviated from established baseline.",
                    `2. Context flag: ${context.flag || 'Unknown'} triggered threshold.`
                ]
            };
        }

        return { error: 'Unknown result type for explanation' };
    }
}

module.exports = ExplainabilityLayer;
