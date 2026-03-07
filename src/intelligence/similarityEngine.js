/**
 * SimilarityEngine.js
 * Computes forensic similarity between bundles.
 */
const SimilarityEngine = {
    /**
     * Calculate a similarity score (0-100) between two fingerprints.
     */
    similarityScore(fnA, fnB) {
        let score = 0;
        const a = fnA.components;
        const b = fnB.components;

        if (a.player === b.player && a.player !== 'UNKNOWN_PLAYER') score += 30;
        if (a.protocol === b.protocol && a.protocol !== 'UNKNOWN_PROTOCOL') score += 20;
        if (a.cdn === b.cdn && a.cdn !== 'UNKNOWN_CDN') score += 25;
        if (a.token_pattern === b.token_pattern && a.token_pattern !== 'NONE') score += 15;
        if (a.topology_hash === b.topology_hash) score += 10;

        return Math.min(score, 100);
    },

    /**
     * Find similar bundles from a list given a target fingerprint.
     */
    findSimilar(targetFn, bundleList) {
        return bundleList
            .map(b => {
                const bFn = b.fingerprint_data || {};
                return {
                    bundle: b,
                    score: this.similarityScore(targetFn, bFn)
                };
            })
            .filter(item => item.score > 20) // Minimum threshold
            .sort((a, b) => b.score - a.score);
    }
};

module.exports = SimilarityEngine;
