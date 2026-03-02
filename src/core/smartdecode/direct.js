const IntelligenceManager = require('./intelligence_manager');

/**
 * SmartDecode 2.0 - Direct Extraction Module
 * Robust discovery of stream URLs via verified Intelligence Patterns.
 */

const DirectExtractor = {
    /**
     * Extract candidates from raw string
     * @param {string} input 
     * @returns {Array} List of candidate objects
     */
    extract(input) {
        if (!input || typeof input !== 'string') return [];

        const candidates = new Map();
        const intelligence = IntelligenceManager.getAllPatterns();

        // If no intelligence is loaded, use minimal fallback
        if (intelligence.length === 0) {
            IntelligenceManager._loadFallbacks();
        }

        IntelligenceManager.patterns.forEach((p, key) => {
            this._matchPattern(input, p.regex, key.toLowerCase(), candidates, p.type, p.confidence);
        });

        return Array.from(candidates.values());
    },

    /**
     * Internal matcher to deduplicate and structure
     */
    _matchPattern(input, regex, sourceLayer, map, inferredType, baseConfidence) {
        let match;
        // Reset regex index for global flags
        regex.lastIndex = 0;

        while ((match = regex.exec(input)) !== null) {
            const url = match[1];
            if (!url) continue;

            // Basic normalization and security check
            try {
                const normalized = new URL(url).toString();
                const protocol = new URL(normalized).protocol.toLowerCase();
                
                // Security Boundary: Only allow web protocols
                if (protocol !== 'http:' && protocol !== 'https:') {
                    return;
                }

                if (!map.has(normalized)) {
                    map.set(normalized, {
                        url: normalized,
                        type: inferredType || this._inferType(normalized),
                        sourceLayer,
                        confidence: baseConfidence || this._calculateConfidence(normalized, sourceLayer)
                    });
                }
            } catch (e) {
                // Silent fail for invalid URLs extracted by broad regex
            }
        }
    },

    _inferType(url) {
        const lowerUrl = url.toLowerCase().split('?')[0];
        if (lowerUrl.endsWith('.m3u8')) return 'hls';
        if (lowerUrl.endsWith('.mp4')) return 'mp4';
        if (lowerUrl.endsWith('.ts')) return 'segment';
        if (lowerUrl.endsWith('.pdf')) return 'document';
        return 'unknown';
    },

    _calculateConfidence(url, source) {
        let confidence = 0.5;
        if (url.includes('playlist.m3u8')) confidence += 0.3;
        if (url.includes('.mp4')) confidence += 0.2;
        if (url.includes('.pdf')) confidence += 0.1;
        if (source === 'hls_focused') confidence += 0.1;
        if (source === 'generic_link') confidence -= 0.1; // lower confidence for generic links
        return Math.min(0.95, confidence);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectExtractor;
}
