/**
 * SmartDecode 2.0 - Direct Extraction Module
 * Robust regex-based discovery of stream URLs in raw strings.
 */

const DirectExtractor = {
    // Common stream extensions and patterns
    PATTERNS: {
        STREAM: /(https?:\/\/[^\s"'`<>]+?\.(mp4|m3u8|ts|zip)(?:\?[^\s"'`<>]+)?)/gi,
        HLS_PLAYLIST: /(https?:\/\/[^\s"'`<>]+?playlist\.m3u8(?:\?[^\s"'`<>]+)?)/gi,
        BURIED_URL: /["'](https?:\/\/[^"']+?\.(?:mp4|m3u8|ts|zip)[^"']*?)["']/gi
    },

    /**
     * Extract candidates from raw string
     * @param {string} input 
     * @returns {Array} List of candidate objects
     */
    extract(input) {
        if (!input || typeof input !== 'string') return [];

        const candidates = new Map();

        // 1. Standard stream patterns
        this._matchPattern(input, this.PATTERNS.STREAM, 'direct_regex', candidates);

        // 2. Focused playlist patterns
        this._matchPattern(input, this.PATTERNS.HLS_PLAYLIST, 'hls_focused', candidates);

        // 3. Quoted buried URLs (deep scan within JS/HTML attributes)
        this._matchPattern(input, this.PATTERNS.BURIED_URL, 'buried_string', candidates);

        return Array.from(candidates.values());
    },

    /**
     * Internal matcher to deduplicate and structure
     */
    _matchPattern(input, regex, sourceLayer, map) {
        let match;
        // Reset regex index for global flags
        regex.lastIndex = 0;

        while ((match = regex.exec(input)) !== null) {
            const url = match[1];
            if (!url) continue;

            // Basic normalization
            try {
                const normalized = new URL(url).toString();
                if (!map.has(normalized)) {
                    map.set(normalized, {
                        url: normalized,
                        type: this._inferType(normalized),
                        sourceLayer,
                        confidence: this._calculateConfidence(normalized, sourceLayer)
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
        return 'unknown';
    },

    _calculateConfidence(url, source) {
        let confidence = 0.5;
        if (url.includes('playlist.m3u8')) confidence += 0.3;
        if (url.includes('.mp4')) confidence += 0.2;
        if (source === 'hls_focused') confidence += 0.1;
        return Math.min(0.95, confidence);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectExtractor;
}
