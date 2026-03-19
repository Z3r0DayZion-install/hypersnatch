/**
 * HyperQueryEngine.js
 * Advanced query execution for forensic relational data.
 */
class HyperQueryEngine {
    constructor(indexManager, intelligenceGraph) {
        this.indexManager = indexManager;
        this.graph = intelligenceGraph;
    }

    /**
     * Execute a query against the forensic index and graph.
     * Format: "TYPE:VALUE" (e.g., "cdn:Akamai", "player:VideoJS")
     */
    execute(queryStr) {
        if (!queryStr || typeof queryStr !== 'string') return [];

        const parts = queryStr.split(':');
        if (parts.length < 2) return this._searchAll(queryStr);

        const type = parts[0].toLowerCase();
        const value = parts.slice(1).join(':');

        switch (type) {
            case 'cdn':
            case 'protocol':
            case 'player':
                return this.indexManager.lookup(type, value);
            case 'fingerprint':
            case 'hash':
                return this.indexManager.lookup('fingerprint', value);
            default:
                return this._searchAll(queryStr);
        }
    }

    _searchAll(text) {
        const results = new Set();
        // Simple exhaustive match across all indexes
        for (const index of Object.values(this.indexManager.indexes)) {
            for (const [key, bids] of index.entries()) {
                if (typeof key === 'string' && key.toLowerCase().includes(text.toLowerCase())) {
                    // Ensure bids is always treated as an iterable (e.g., Set or Array)
                    // If bids is a single value, wrap it in an array for consistent iteration
                    const iterableBids = bids instanceof Set || Array.isArray(bids) ? bids : [bids];
                    iterableBids.forEach(b => results.add(b));
                }
            }
        }
        return Array.from(results);
    }
}

module.exports = HyperQueryEngine;
