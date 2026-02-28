/**
 * SmartDecode 2.0 - Doodstream Extractor
 */

const DoodstreamExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?dood\.(?:to|so|la|ws|sh|re|pm|wf|cx)\/[ed]\/([a-zA-Z0-9]+)/i,
        /https?:\/\/doodstream\.com\/[ed]\/([a-zA-Z0-9]+)/i
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
                        host: 'doodstream.com',
                        type: 'video',
                        sourceLayer: 'host_doodstream',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from Doodstream HTML
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        // 1. Doodstream specific: often has a md5 pass link or direct mp4 in some variants
        const domPatterns = [
            /["'](https?:\/\/[^"']+\/pass_md5\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)["']/gi,
            /["'](https?:\/\/[^"']+\/direct\/[a-zA-Z0-9_-]+\.mp4(?:\?[^"']+)?)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                directCandidates.push({
                    url,
                    fileId,
                    host: 'doodstream.com',
                    type: 'video',
                    sourceLayer: 'resurrection_doodstream_dom',
                    confidence: 0.98
                });
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DoodstreamExtractor;
}
