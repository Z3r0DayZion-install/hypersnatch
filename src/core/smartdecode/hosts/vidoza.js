/**
 * SmartDecode 2.0 - Vidoza Extractor
 */

const VidozaExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?vidoza\.net\/[edv]\/([a-zA-Z0-9_-]+)(?:\.[a-z0-9]+)?/i,
        /https?:\/\/vidoza\.net\/([a-zA-Z0-9_-]{3,})(?:\.[a-z0-9]+)?/i
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
                        host: 'vidoza.net',
                        type: 'video',
                        sourceLayer: 'host_vidoza',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from Vidoza HTML
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        // 1. Vidoza specific: look for mp4 source and curate the URL
        const domPatterns = [
            /src\s*:\s*["'](https?:\/\/[^"']+\.mp4(?:\?[^"']+)?)["']/gi,
            /["'](https?:\/\/vidoza\.net\/v\/[a-zA-Z0-9_-]+\.mp4(?:\?[^"']+)?)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern.source, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                directCandidates.push({
                    url,
                    fileId,
                    host: 'vidoza.net',
                    type: 'video',
                    sourceLayer: 'resurrection_vidoza_dom',
                    confidence: 0.98
                });
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VidozaExtractor;
}
