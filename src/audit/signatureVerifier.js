const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * SignatureVerifier.js
 * Verifies forensic signatures and artifact integrity.
 */
const SignatureVerifier = {
    /**
     * Verify a signature against data and a public key.
     * @param {Object} data The original data object
     * @param {string} signature Hex-encoded signature
     * @param {string} publicKey PEM-encoded public key
     * @returns {boolean}
     */
    verifyData(data, signature, publicKey) {
        if (!data || !signature || !publicKey) return false;

        const verify = crypto.createVerify('SHA256');
        const content = JSON.stringify(this._canonicalize(data));
        verify.update(content);
        verify.end();

        try {
            return verify.verify(publicKey, signature, 'hex');
        } catch (e) {
            console.error("Signature verification error:", e);
            return false;
        }
    },

    /**
     * Verify a manifest of file hashes.
     * @param {string} rootDir Directory containing the files
     * @param {Object} manifest { filename: expectedHash }
     * @returns {Object} { valid: boolean, failures: Array }
     */
    verifyManifest(rootDir, manifest) {
        const failures = [];
        for (const [filename, expectedHash] of Object.entries(manifest)) {
            const filePath = path.join(rootDir, filename);
            if (!fs.existsSync(filePath)) {
                failures.push({ filename, reason: "MISSING" });
                continue;
            }

            const content = fs.readFileSync(filePath);
            const actualHash = crypto.createHash('sha256').update(content).digest('hex');

            if (actualHash !== expectedHash) {
                failures.push({ filename, reason: "HASH_MISMATCH", expected: expectedHash, actual: actualHash });
            }
        }

        return {
            valid: failures.length === 0,
            failures
        };
    },

    /**
     * Deterministic JSON stringification (sort keys)
     * @private
     */
    _canonicalize(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => this._canonicalize(item));

        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = this._canonicalize(obj[key]);
        });
        return sorted;
    }
};

module.exports = SignatureVerifier;
