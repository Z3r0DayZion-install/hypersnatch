/**
 * SmartDecode 2.0 - Pixeldrain.com Extractor
 */

const PixeldrainExtractor = {
    PATTERNS: [
        /https?:\/\/pixeldrain\.com\/u\/([a-zA-Z0-9]+)/i
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
                        host: 'pixeldrain.com',
                        type: 'file',
                        sourceLayer: 'host_pixeldrain',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct download links from Pixeldrain
     * Pixeldrain has a public API: /api/file/{fileId}
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        // Pixeldrain's API is predictable
        if (fileId) {
            directCandidates.push({
                url: `https://pixeldrain.com/api/file/${fileId}`,
                fileId,
                host: 'pixeldrain.com',
                type: 'file',
                sourceLayer: 'resurrection_pixeldrain_api',
                confidence: 0.96
            });

            directCandidates.push({
                url: `https://pixeldrain.com/api/file/${fileId}?download`,
                fileId,
                host: 'pixeldrain.com',
                type: 'file',
                sourceLayer: 'resurrection_pixeldrain_download',
                confidence: 0.98
            });
        }

        // Also scan for embedded viewer data
        const domPatterns = [
            /["'](https?:\/\/pixeldrain\.com\/api\/file\/[a-zA-Z0-9_-]+(?:\?[^"']*)?)["']/gi,
            /(?:var|const|let)\s+(?:download_url|file_url|viewerData)\s*=\s*["'](https?:\/\/[^"']+)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!directCandidates.some(c => c.url === url)) {
                    directCandidates.push({
                        url, fileId,
                        host: 'pixeldrain.com',
                        type: 'file',
                        sourceLayer: 'resurrection_pixeldrain_dom',
                        confidence: 0.95
                    });
                }
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixeldrainExtractor;
}
