/**
 * PatternDiscoveryEngine.js (Phase 66)
 * Heuristic discovery of recurring infrastructure patterns across forensic bundles.
 */
class PatternDiscoveryEngine {
    constructor() {
        this.discoveredPatterns = new Map();
    }

    /**
     * Discover recurring patterns from a list of bundles.
     * Groups bundles by CDN+Player+Protocol composite key.
     */
    discover(bundles) {
        this.discoveredPatterns.clear();

        bundles.forEach(b => {
            const cdn = (b.cdn || 'UNKNOWN').toUpperCase();
            const player = (b.playerSignature || 'UNKNOWN').toUpperCase();
            const protocol = (b.protocol || 'UNKNOWN').toUpperCase();
            const key = `${cdn}::${player}::${protocol}`;

            if (!this.discoveredPatterns.has(key)) {
                this.discoveredPatterns.set(key, {
                    key,
                    cdn, player, protocol,
                    bundleIds: [],
                    frequency: 0,
                    firstSeen: new Date().toISOString()
                });
            }

            const pattern = this.discoveredPatterns.get(key);
            pattern.bundleIds.push(b.path || b.id || 'unknown');
            pattern.frequency++;
        });

        return this.getPatterns();
    }

    /**
     * Get all discovered patterns, sorted by frequency descending.
     */
    getPatterns() {
        return Array.from(this.discoveredPatterns.values())
            .sort((a, b) => b.frequency - a.frequency);
    }

    /**
     * Get only patterns that appear more than the threshold.
     */
    getRecurring(minFrequency = 2) {
        return this.getPatterns().filter(p => p.frequency >= minFrequency);
    }

    /**
     * Get the dominant infrastructure pattern (highest frequency).
     */
    getDominant() {
        const patterns = this.getPatterns();
        return patterns.length > 0 ? patterns[0] : null;
    }

    /**
     * Get statistics about discovered patterns.
     */
    getStats() {
        const patterns = this.getPatterns();
        return {
            totalPatterns: patterns.length,
            recurring: patterns.filter(p => p.frequency >= 2).length,
            uniqueCdns: new Set(patterns.map(p => p.cdn)).size,
            uniquePlayers: new Set(patterns.map(p => p.player)).size,
            uniqueProtocols: new Set(patterns.map(p => p.protocol)).size,
            dominant: this.getDominant()
        };
    }
}

module.exports = PatternDiscoveryEngine;
