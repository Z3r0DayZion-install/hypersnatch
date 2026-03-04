/**
 * SmartDecode 2.0 - Gofile.io Extractor
 */

const GofileExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?gofile\.io\/d\/([a-zA-Z0-9]+)/i
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
                        host: 'gofile.io',
                        type: 'file',
                        sourceLayer: 'host_gofile',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from Gofile HTML/JSON
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        // 1. Gofile specific: look for direct data links and download URLs
        const domPatterns = [
            /["'](https?:\/\/[^"']+\.gofile\.io\/download\/[a-zA-Z0-9_-]+\/[^"']+)["']/gi,
            /["']link["']\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
            /window\.directLink\s*=\s*["']([^"']+)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern.source, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!url.includes('download') && !url.includes('cdn')) continue;
                directCandidates.push({
                    url,
                    fileId,
                    host: 'gofile.io',
                    type: 'file',
                    sourceLayer: 'resurrection_gofile_hardmode',
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
    module.exports = GofileExtractor;
}
