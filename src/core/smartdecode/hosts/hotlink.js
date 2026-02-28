/**
 * SmartDecode 2.0 - Hotlink.cc Extractor
 */

const HotlinkExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?hotlink\.cc\/([a-zA-Z0-9]+)/i
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
                        host: 'hotlink.cc',
                        type: 'file',
                        sourceLayer: 'host_hotlink',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from Hotlink HTML
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        // 1. Hotlink specific: look for direct download or stream links
        const domPatterns = [
            /["'](https?:\/\/[^"']+\.hotlink\.cc\/i?dl\/[a-zA-Z0-9_-]+\/[^"']+)["']/gi,
            /["'](https?:\/\/[\w.-]+\/file(?:\d+)?\/[a-zA-Z0-9_-]+\.(?:mp4|m3u8)(?:\?[^"']+)?)["']/gi,
            /download_url\s*:\s*["']([^"']+)["']/gi
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
                    host: 'hotlink.cc',
                    type: 'file',
                    sourceLayer: 'resurrection_hotlink_hardmode',
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
    module.exports = HotlinkExtractor;
}
