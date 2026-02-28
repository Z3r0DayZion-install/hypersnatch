/**
 * SmartDecode 2.0 - Voe.sx Extractor
 */

const VoeExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?voe\.sx\/[ed]\/([a-zA-Z0-9]+)/i,
        /https?:\/\/voe\.sx\/([a-zA-Z0-9]+)/i
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
                        host: 'voe.sx',
                        type: 'video',
                        sourceLayer: 'host_voe',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from Voe HTML
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        // 1. Voe specific: look for hls link or mp4 source in scripts
        const domPatterns = [
            /["'](https?:\/\/[^"']+\/[a-zA-Z0-9_-]+\.m3u8(?:\?[^"']+)?)["']/gi,
            /["'](https?:\/\/[^"']+\/[a-zA-Z0-9_-]+\.mp4(?:\?[^"']+)?)["']/gi,
            /hls\s*:\s*["'](https?:\/\/[^"']+)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                directCandidates.push({
                    url,
                    fileId,
                    host: 'voe.sx',
                    type: url.includes('m3u8') ? 'hls' : 'video',
                    sourceLayer: 'resurrection_voe_dom',
                    confidence: 0.98
                });
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoeExtractor;
}
