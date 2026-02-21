/**
 * SmartDecode 2.0 - Deanonymizer / Unpacker Module
 * Deterministic reversal of P.A.C.K.E.R. (Dean Edwards) obfuscation without using eval().
 */

const Unpacker = {
    // Regex for finding packer blocks: eval(function(p,a,c,k,e,d)...)
    PACKER_PATTERN: /eval\(function\(p,a,c,k,e,d\)\{.*?return\s+p\}.*?\(["'](.*?)["'],\d+,\d+,["'](.*?)["']\.split\(["']\|["']\)/g,

    /**
     * Scan input for packed JS and return unpacked results
     * @param {string} input 
     * @param {Object} directExtractor Reference to direct.js to re-scan
     * @returns {Array} List of candidate objects
     */
    extract(input, directExtractor) {
        if (!input || typeof input !== 'string') return [];

        const candidates = new Map();
        let match;
        this.PACKER_PATTERN.lastIndex = 0;

        while ((match = this.PACKER_PATTERN.exec(input)) !== null) {
            const p = match[1]; // The payload
            const k = match[2] ? match[2].split('|') : []; // The key mapping

            const unpacked = this._unpack(p, k);
            if (unpacked) {
                // Re-scan unpacked content
                const found = directExtractor.extract(unpacked);
                found.forEach(c => {
                    const key = c.url;
                    if (!candidates.has(key)) {
                        candidates.set(key, {
                            ...c,
                            sourceLayer: 'unpacker_result',
                            confidence: c.confidence * 0.95 // High confidence for unpacked URLs
                        });
                    }
                });
            }
        }

        return Array.from(candidates.values());
    },

    /**
     * Hand-rolled deterministic unpacker
     * Reversed from standard p,a,c,k,e,d logic
     */
    _unpack(p, k) {
        try {
            // k is the dictionary
            // p is the payload with base62/baseN encoded indexes

            // Simple base62 decoder for the tokens
            const decodeWord = (word) => {
                let n = 0;
                const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                for (let i = 0; i < word.length; i++) {
                    n = n * 62 + alphabet.indexOf(word[i]);
                }
                return n;
            };

            // The standard packer replaces words with indexes
            // We need to find every word-like token and see if it maps to k[index]
            return p.replace(/\b(\w+)\b/g, (match) => {
                // Try to see if match is an index in k
                // Some packers use base36, base62, etc. 
                // We'll try to determine if it's a numeric index or a base62 encoded index
                const idx = this._baseToDecimal(match, 62);
                return (k[idx] || match) || match;
            });
        } catch (e) {
            return null;
        }
    },

    _baseToDecimal(str, base) {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.substring(0, base);
        let result = 0;
        for (let i = 0; i < str.length; i++) {
            const val = chars.indexOf(str[i]);
            if (val === -1) return -1;
            result = result * base + val;
        }
        return result;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Unpacker;
}
