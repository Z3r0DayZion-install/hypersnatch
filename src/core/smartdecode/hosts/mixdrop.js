/**
 * SmartDecode 2.0 - Mixdrop Extractor
 */

const MixdropExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?mixdrop\.(?:co|to|sx|bz|ch)\/e\/([a-zA-Z0-9]+)/i
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
                        host: 'mixdrop.co',
                        type: 'video',
                        sourceLayer: 'host_mixdrop',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from Mixdrop HTML
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        // 1. Mixdrop specific: look for MDCore.stream and similar script-based links
        const domPatterns = [
            /MDCore\.stream\s*=\s*["']([^"']+)["']/gi,
            /MDCore\.wurl\s*=\s*["']([^"']+)["']/gi,
            /["'](https?:\/\/[^"']+\/index\.mp4\?[^"']+)["']/gi,
            /["'](https?:\/\/[^"']+\/v\/[a-zA-Z0-9]+\/src\/[a-zA-Z0-9_-]+\.mp4(?:\?[^"']+)?)["']/gi,
            /["'](https?:\/\/[^"']+\/download\/[a-zA-Z0-9_-]+\.mp4(?:\?[^"']+)?)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!url.startsWith('http')) continue;
                directCandidates.push({
                    url,
                    fileId,
                    host: 'mixdrop.co',
                    type: 'video',
                    sourceLayer: 'resurrection_mixdrop_hardmode',
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
    module.exports = MixdropExtractor;
}
