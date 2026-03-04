/**
 * SmartDecode 2.0 - Vudeo.net Extractor
 */

const VudeoExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?vudeo\.net\/(?:embed-)?([a-zA-Z0-9]+)(?:\.html)?/i,
        /https?:\/\/(?:www\.)?vudeo\.io\/(?:embed-)?([a-zA-Z0-9]+)(?:\.html)?/i
    ],

    extract(input) {
        if (!input || typeof input !== 'string') return [];
        const candidates = new Map();
        this.PATTERNS.forEach(regex => {
            let match;
            const localRegex = new RegExp(regex.source, 'gi');
            while ((match = localRegex.exec(input)) !== null) {
                const url = match[0];
                const fileId = match[1];
                if (!candidates.has(url)) {
                    candidates.set(url, {
                        url, fileId, filename: 'unknown',
                        host: 'vudeo.net',
                        type: 'video',
                        sourceLayer: 'host_vudeo',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from Vudeo HTML
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        // 1. Vudeo specific: look for sources array or jwplayer config
        const domPatterns = [
            /sources:\s*\[\s*{\s*file:\s*["']([^"']+)["']/gi,
            /["']file["']\s*:\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8)(?:\?[^"']+)?)["']/gi,
            /["'](https?:\/\/[\w.-]+\/(?:[a-z0-9]+\/)+[a-z0-9_-]+\.(?:mp4|m3u8)(?:\?[^"']+)?)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern.source, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!url.includes(fileId) && !url.includes('cdn')) continue;
                directCandidates.push({
                    url,
                    fileId,
                    host: 'vudeo.net',
                    type: 'video',
                    sourceLayer: 'resurrection_vudeo_hardmode',
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
    module.exports = VudeoExtractor;
}
