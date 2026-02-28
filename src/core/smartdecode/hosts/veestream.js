/**
 * SmartDecode 2.0 - VeeStream.to Extractor
 */

const VeeStreamExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?(?:veestream\.to|veestream\.me|veestream\.net)\/[ev]\/([a-zA-Z0-9]+)/i
    ],

    extract(input) {
        if (!input || typeof input !== 'string') return [];
        const candidates = new Map();
        this.PATTERNS.forEach(regex => {
            let match;
            const localRegex = new RegExp(regex, 'gi');
            while ((match = localRegex.exec(input)) !== null) {
                const url = match[0];
                const fileId = match[1];
                if (!candidates.has(url)) {
                    candidates.set(url, {
                        url, fileId, filename: 'unknown',
                        host: 'veestream.to',
                        type: 'video',
                        sourceLayer: 'host_veestream',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from VeeStream HTML
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        // 1. Veestream specific: look for player data or m3u8 sources
        const domPatterns = [
            /["'](https?:\/\/[^"']+\/hls\/[a-zA-Z0-9_-]+\/[^"']+\.m3u8(?:\?[^"']+)?)["']/gi,
            /file\s*:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)(?:\?[^"']+)?)["']/gi,
            /["'](https?:\/\/[^"']+\/dl\?[^"']+)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!url.includes(fileId) && !url.includes('cdn')) continue;
                directCandidates.push({
                    url,
                    fileId,
                    host: 'veestream.to',
                    type: 'video',
                    sourceLayer: 'resurrection_veestream_hardmode',
                    confidence: 0.99,
                    meta: {
                        hardmode: true,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VeeStreamExtractor;
}
