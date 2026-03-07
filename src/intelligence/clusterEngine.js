/**
 * ClusterEngine.js (Phase 66)
 * Groups forensic bundles into similarity clusters using shared infrastructure traits.
 */
class ClusterEngine {
    constructor() {
        this.clusters = [];
    }

    /**
     * Cluster bundles by a configurable set of traits.
     * @param {Array} bundles - Array of bundle objects.
     * @param {Array} traits - Bundle properties to cluster on (e.g., ['cdn', 'protocol']).
     * @returns {Array} Array of cluster objects.
     */
    cluster(bundles, traits = ['cdn', 'protocol']) {
        this.clusters = [];
        const groups = new Map();

        bundles.forEach(b => {
            const key = traits.map(t => (b[t] || 'UNKNOWN').toString().toUpperCase()).join('|');
            if (!groups.has(key)) {
                groups.set(key, {
                    clusterKey: key,
                    traits: {},
                    members: [],
                    size: 0
                });
                traits.forEach(t => {
                    groups.get(key).traits[t] = (b[t] || 'UNKNOWN').toString().toUpperCase();
                });
            }
            groups.get(key).members.push(b.path || b.id || 'unknown');
            groups.get(key).size++;
        });

        this.clusters = Array.from(groups.values()).sort((a, b) => b.size - a.size);
        return this.clusters;
    }

    /**
     * Get the largest cluster.
     */
    getLargest() {
        return this.clusters.length > 0 ? this.clusters[0] : null;
    }

    /**
     * Get clusters larger than a minimum size.
     */
    getSignificant(minSize = 2) {
        return this.clusters.filter(c => c.size >= minSize);
    }

    /**
     * Get cluster statistics.
     */
    getStats() {
        return {
            totalClusters: this.clusters.length,
            significantClusters: this.clusters.filter(c => c.size >= 2).length,
            largestClusterSize: this.clusters.length > 0 ? this.clusters[0].size : 0,
            singletons: this.clusters.filter(c => c.size === 1).length
        };
    }
}

module.exports = ClusterEngine;
