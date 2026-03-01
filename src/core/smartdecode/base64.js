/**
 * SmartDecode 2.0 - Base64 Decoding Module
 * Safely discovers and decodes large Base64 blobs to find buried stream URLs.
 */

const Base64Extractor = {
    // Regex for finding potential Base64 strings. Minimum length 32 to avoid noise.
    // Must be Alphanumeric + / + + and optionally padded with =
    B64_PATTERN: /([A-Za-z0-9+/]{32,}(?:={0,2}))/g,

    // Max size to decode to prevent memory exhaustion (8MB)
    MAX_DECODE_SIZE: 8 * 1024 * 1024,

    /**
     * Scan input for Base64 and return decoded streams
     * @param {string} input 
     * @param {Object} directExtractor Reference to direct.js to re-scan
     * @param {Object} hostExtractors Optional reference to hosts.js
     * @returns {Array} List of candidate objects
     */
    extract(input, directExtractor, hostExtractors) {
        if (!input || typeof input !== 'string') return [];

        const candidates = new Map();
        let match;
        this.B64_PATTERN.lastIndex = 0;

        while ((match = this.B64_PATTERN.exec(input)) !== null) {
            const b64Data = match[1];
            if (b64Data.length > this.MAX_DECODE_SIZE) continue;

            const decoded = this._safeDecode(b64Data);
            if (decoded && decoded.length > 10) {
                // Re-scan decoded content using direct.js
                const foundDirect = directExtractor.extract(decoded);
                foundDirect.forEach(c => {
                    const key = c.url;
                    if (!candidates.has(key)) {
                        candidates.set(key, {
                            ...c,
                            sourceLayer: 'base64_decoded',
                            confidence: c.confidence * 0.9 // Slightly lower confidence for decoded stuff
                        });
                    }
                });

                // Re-scan decoded content using hostExtractors
                if (hostExtractors && typeof hostExtractors.extractAll === 'function') {
                    const foundHosts = hostExtractors.extractAll(decoded);
                    foundHosts.forEach(c => {
                        const key = c.url;
                        if (!candidates.has(key)) {
                            candidates.set(key, {
                                ...c,
                                sourceLayer: 'base64_host_decoded',
                                confidence: (c.confidence || 0.9) * 0.9
                            });
                        }
                    });
                }
            }
        }

        return Array.from(candidates.values());
    },

    /**
     * Deterministic safe decode without crashing or using Buffer (for web compatibility)
     */
    _safeDecode(str) {
        try {
            // Use atob if available (browser/electron), else fallback
            if (typeof atob === 'function') {
                return atob(str);
            }

            // Node.js fallback
            if (typeof Buffer !== 'undefined') {
                return Buffer.from(str, 'base64').toString('binary');
            }
        } catch (e) {
            return null;
        }
        return null;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Base64Extractor;
}
