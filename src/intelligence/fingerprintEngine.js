const crypto = require('crypto');

/**
 * FingerprintEngine.js
 * Generates forensic signatures for bundles to identify infrastructure patterns.
 */
const FingerprintEngine = {
    /**
     * Generate a unique fingerprint for a bundle based on its infrastructure.
     */
    generateFingerprint(bundle) {
        const components = {
            player: bundle.playerSignature || 'UNKNOWN_PLAYER',
            protocol: bundle.protocol || 'UNKNOWN_PROTOCOL',
            cdn: bundle.cdn || 'UNKNOWN_CDN',
            token_pattern: this._extractTokenPattern(bundle.token) || 'NONE',
            topology_hash: this._hashTopology(bundle)
        };

        const raw = `${components.player}|${components.protocol}|${components.cdn}|${components.topology_hash}`;
        const hash = crypto.createHash('sha256').update(raw).digest('hex');

        return {
            hash,
            components
        };
    },

    _extractTokenPattern(token) {
        if (!token) return null;
        // Abstract token: keep length and non-alphanumeric separators
        return token.replace(/[a-zA-Z0-9]/g, '.');
    },

    _hashTopology(bundle) {
        // Simple heuristic for infrastructure topology
        const data = (bundle.playerSignature || '') + (bundle.protocol || '') + (bundle.cdn || '');
        return crypto.createHash('md5').update(data).digest('hex').substring(0, 8);
    }
};

module.exports = FingerprintEngine;
