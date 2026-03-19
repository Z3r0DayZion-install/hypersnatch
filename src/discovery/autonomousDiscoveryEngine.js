/**
 * AutonomousDiscoveryEngine.js (Phase 95)
 * Continuously proposes new lines of inquiry across intelligence structures.
 * Generates queueable suggestions and identifies intelligence gaps.
 */
class AutonomousDiscoveryEngine {
    constructor() {
        this.discoveryHistory = [];
    }

    discover(context = {}) {
        const suggestions = [];
        const gaps = [];

        // 1. Suggest Neighborhood Expansion
        if ((context.global_graph_nodes || 0) > 10) {
            suggestions.push({
                id: `sugg_${Date.now()}_a`,
                type: "neighborhood_expansion",
                target: context.graphId || 'global',
                reason: `Graph size (${context.global_graph_nodes}) supports rich relationship expansion.`,
                confidence: 0.85,
                review_state: "suggested" // Rule: always review-gated
            });
        }

        // 2. Suggest Classification Follow-up
        if ((context.unclassified_patterns || 0) > 0) {
            suggestions.push({
                id: `sugg_${Date.now()}_b`,
                type: "classification_followup",
                target: context.patternId || 'unknown_group',
                reason: `${context.unclassified_patterns} unclassified patterns detected matching recent adversary fingerprints.`,
                confidence: 0.92,
                review_state: "suggested"
            });
        }

        // 3. Identify Intelligence Gaps (e.g. missing attribution data)
        if (context.unattributed_infrastructure && context.unattributed_infrastructure > 5) {
            gaps.push({
                id: `gap_${Date.now()}_c`,
                type: "missing_attribution",
                reason: "More than 5 active infrastructure nodes lack provider attribution. Prioritize resolving WHOIS/BGP mappings.",
                severity: "MEDIUM"
            });
        }

        const output = {
            timestamp: new Date().toISOString(),
            suggestions,
            intelligence_gaps: gaps,
            queueCount: suggestions.length
        };

        this.discoveryHistory.push(output);
        return output;
    }

    getHistory() {
        return this.discoveryHistory;
    }

    getStats() {
        return {
            totalDiscoveryRuns: this.discoveryHistory.length,
            totalSuggestionsGenerated: this.discoveryHistory.reduce((acc, run) => acc + run.suggestions.length, 0),
            totalGapsIdentified: this.discoveryHistory.reduce((acc, run) => acc + run.intelligence_gaps.length, 0)
        };
    }
}

module.exports = AutonomousDiscoveryEngine;
