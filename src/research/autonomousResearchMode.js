/**
 * AutonomousResearchMode.js (Phase 75)
 * Generates research suggestions with mandatory analyst review states.
 * States: suggested → queued → approved → executed → rejected
 * Nothing executes without review.
 */
class AutonomousResearchMode {
    constructor() {
        this.queue = [];
    }

    /**
     * Generate research suggestions based on case context signals.
     */
    generate(context = {}) {
        const suggestions = [];

        if ((context.anomaly_score || 0) > 60) {
            suggestions.push({
                id: `rs_${Date.now()}_1`,
                type: 'REPLAY_MUTATION',
                reason: 'High anomaly score suggests resilience testing via replay mutations.',
                confidence: Math.min(0.5 + (context.anomaly_score / 200), 0.95),
                review_state: 'suggested',
                evidence: { anomaly_score: context.anomaly_score }
            });
        }

        if ((context.similar_bundle_count || 0) > 5) {
            suggestions.push({
                id: `rs_${Date.now()}_2`,
                type: 'CROSS_CASE_COMPARE',
                reason: 'High similar bundle count suggests reusable infrastructure — cross-case comparison recommended.',
                confidence: Math.min(0.5 + (context.similar_bundle_count / 20), 0.90),
                review_state: 'suggested',
                evidence: { similar_bundle_count: context.similar_bundle_count }
            });
        }

        if ((context.singleton_patterns || 0) > 0) {
            suggestions.push({
                id: `rs_${Date.now()}_3`,
                type: 'FOLLOW_UP_QUERY',
                reason: 'Singleton infrastructure patterns detected — suggest deep-dive HyperQuery.',
                confidence: 0.70,
                review_state: 'suggested',
                evidence: { singleton_patterns: context.singleton_patterns }
            });
        }

        if ((context.unknown_classifications || 0) > 2) {
            suggestions.push({
                id: `rs_${Date.now()}_4`,
                type: 'FINGERPRINT_LIBRARY_UPDATE',
                reason: 'Multiple unclassified bundles detected — suggest adding to fingerprint library.',
                confidence: 0.65,
                review_state: 'suggested',
                evidence: { unknown_classifications: context.unknown_classifications }
            });
        }

        this.queue.push(...suggestions);

        return {
            suggestions,
            review_required: true,
            total_queued: this.queue.length
        };
    }

    /**
     * Transition a suggestion to a new review state.
     */
    updateState(suggestionId, newState) {
        const validStates = ['suggested', 'queued', 'approved', 'executed', 'rejected'];
        if (!validStates.includes(newState)) throw new Error(`Invalid state: ${newState}`);

        const item = this.queue.find(s => s.id === suggestionId);
        if (item) {
            item.review_state = newState;
            item.stateUpdatedAt = new Date().toISOString();
        }
        return item;
    }

    /**
     * Get all suggestions in a given state.
     */
    getByState(state) {
        return this.queue.filter(s => s.review_state === state);
    }

    /**
     * Generate an analyst review packet.
     */
    generateReviewPacket() {
        return {
            generatedAt: new Date().toISOString(),
            pending: this.getByState('suggested').length,
            queued: this.getByState('queued').length,
            approved: this.getByState('approved').length,
            executed: this.getByState('executed').length,
            rejected: this.getByState('rejected').length,
            items: this.queue
        };
    }

    getStats() {
        return {
            totalSuggestions: this.queue.length,
            pending: this.getByState('suggested').length,
            approved: this.getByState('approved').length,
            executed: this.getByState('executed').length,
            rejected: this.getByState('rejected').length
        };
    }
}

module.exports = AutonomousResearchMode;
