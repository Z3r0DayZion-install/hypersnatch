/**
 * SmartDecode 2.0 - M3U8 Analysis Module
 * Parses M3U8 master playlists to extract quality variants and structured metadata.
 * Offline only. Does not fetch sub-playlists.
 */

const M3U8Parser = {
    // Patterns for master playlist analysis
    PATTERNS: {
        IS_MASTER: /#EXT-X-STREAM-INF/i,
        STREAM_INF: /#EXT-X-STREAM-INF:([^\n]+)\n([^\n#]+)/gi,
        ATTR_RES: /RESOLUTION=(\d+x\d+)/i,
        ATTR_BANDWIDTH: /BANDWIDTH=(\d+)/i,
        ATTR_CODECS: /CODECS=["']([^"']+)["']/i
    },

    /**
     * Parse M3U8 content for structured metadata
     * @param {string} input raw M3U8 content
     * @param {string} baseUrl original playlist URL
     * @returns {Array} List of variant objects
     */
    parse(input, baseUrl) {
        if (!input || typeof input !== 'string') return [];
        if (!this.PATTERNS.IS_MASTER.test(input)) return [];

        const variants = [];
        let match;
        this.PATTERNS.STREAM_INF.lastIndex = 0;

        while ((match = this.PATTERNS.STREAM_INF.exec(input)) !== null) {
            const attrLine = match[1];
            const urlLine = match[2].trim();

            const resMatch = attrLine.match(this.PATTERNS.ATTR_RES);
            const bwMatch = attrLine.match(this.PATTERNS.ATTR_BANDWIDTH);
            const codecMatch = attrLine.match(this.PATTERNS.ATTR_CODECS);

            const absoluteUrl = this._resolveUrl(urlLine, baseUrl);

            variants.push({
                url: absoluteUrl,
                type: 'hls_variant',
                resolution: resMatch ? resMatch[1] : 'unknown',
                height: resMatch ? parseInt(resMatch[1].split('x')[1]) : 0,
                bandwidth: bwMatch ? parseInt(bwMatch[1]) : 0,
                codecs: codecMatch ? codecMatch[1] : null,
                sourceLayer: 'm3u8_master_parse'
            });
        }

        return variants;
    },

    /**
     * Simple offline URL resolver
     */
    _resolveUrl(target, base) {
        if (target.startsWith('http')) return target;
        if (!base) return target;

        try {
            // Use URL constructor for resolution
            return new URL(target, base).toString();
        } catch (e) {
            // Manual fallback for relative paths if base is just a filename
            const baseParts = base.split('/');
            baseParts.pop(); // Remove filename
            const basePath = baseParts.join('/');
            return target.startsWith('/') ? `${new URL(base).origin}${target}` : `${basePath}/${target}`;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = M3U8Parser;
}
