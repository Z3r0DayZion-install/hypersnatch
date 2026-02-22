/**
 * SmartDecode 2.0 - Streamtape Extractor
 */

const StreamtapeExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?streamtape\.com\/[ve]\/([a-zA-Z0-9]+)/i,
        /https?:\/\/streamtape\.com\/[ve]\/([a-zA-Z0-9]+)/i
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
                        host: 'streamtape.com',
                        type: 'video',
                        sourceLayer: 'host_streamtape',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from Streamtape HTML
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        // 1. Streamtape specific: look for videolink innerHTML or obfuscated stream path
        const domPatterns = [
            /document\.getElementById\(['"]videolink['"]\)\.innerHTML\s*=\s*["']([^"']+)["']/gi,
            /["'](https?:\/\/[^"']+\/get_video[?&]token=[a-zA-Z0-9_-]+(?:\&expires=[0-9]+)?)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                directCandidates.push({
                    url,
                    fileId,
                    host: 'streamtape.com',
                    type: 'video',
                    sourceLayer: 'resurrection_streamtape_dom',
                    confidence: 0.98
                });
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamtapeExtractor;
}
