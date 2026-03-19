/**
 * IndexManager.js
 * High-performance indexing system for forensic artifact lookups.
 */
class IndexManager {
    constructor() {
        this.indexes = {
            cdn: new Map(),        // cdn -> Set of bundleIds
            protocol: new Map(),   // protocol -> Set of bundleIds
            player: new Map(),     // player -> Set of bundleIds
            fingerprint: new Map() // hash -> bundleId
        };
    }

    /**
     * Index a bundle's infrastructure metadata.
     */
    indexBundle(bundle) {
        const bid = bundle.fingerprint || bundle.path;

        if (bundle.cdn) this._addToIndex('cdn', bundle.cdn, bid);
        if (bundle.protocol) this._addToIndex('protocol', bundle.protocol, bid);
        if (bundle.playerSignature) this._addToIndex('player', bundle.playerSignature, bid);

        if (bundle.fingerprint_data && bundle.fingerprint_data.hash) {
            this._addToIndex('fingerprint', bundle.fingerprint_data.hash, bid);
        }
    }

    _addToIndex(type, value, bid) {
        if (!this.indexes[type].has(value)) {
            this.indexes[type].set(value, new Set());
        }
        this.indexes[type].get(value).add(bid);
    }

    lookup(type, value) {
        if (!this.indexes[type]) return [];
        const results = this.indexes[type].get(value);
        return results ? Array.from(results) : [];
    }

    clear() {
        for (const key in this.indexes) {
            this.indexes[key].clear();
        }
    }

    getStatistics() {
        return {
            cdns: this.indexes.cdn.size,
            protocols: this.indexes.protocol.size,
            players: this.indexes.player.size,
            fingerprints: this.indexes.fingerprint.size
        };
    }
}

module.exports = IndexManager;
