/**
 * EvidenceWeightEngine.js (Phase 98)
 * Defines weighting rules and enforces cryptographic/heuristic constitution.
 */
class EvidenceWeightEngine {
    constructor() {
        this.constitution = {
            'cryptographic_signature': 1.0,
            'dns_resolution': 0.8,
            'cdn_header': 0.7,
            'heuristics_match': 0.4,
            'user_assertion': 0.2
        };
    }

    calculateWeight(evidenceArray) {
        if (!evidenceArray || evidenceArray.length === 0) return 0.0;

        let totalWeight = 0;
        let maxWeight = 0;

        for (const ev of evidenceArray) {
            const weight = this.constitution[ev.type] || 0.1;
            totalWeight += weight;
            if (weight > maxWeight) maxWeight = weight;
        }

        // Blend max weight (highest quality piece) with volumetric accumulation
        // Caps at 1.0
        const finalScore = Math.min(maxWeight + (totalWeight * 0.1), 1.0);

        return {
            score: finalScore.toFixed(3),
            strongestEvidenceType: evidenceArray.find(e => this.constitution[e.type] === maxWeight)?.type || 'unknown',
            totalPieces: evidenceArray.length
        };
    }
}

module.exports = EvidenceWeightEngine;
