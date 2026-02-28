/**
 * SmartDecode 2.0 - Mega.nz Extractor
 */

const MegaExtractor = {
    PATTERNS: [
        /https?:\/\/mega\.nz\/file\/([a-zA-Z0-9_-]+)(?:#([a-zA-Z0-9_-]+))?/i,
        /https?:\/\/mega\.nz\/#!([a-zA-Z0-9_-]+)!([a-zA-Z0-9_-]+)/i
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
                const key = match[2] || '';
                if (!candidates.has(url)) {
                    candidates.set(url, {
                        url, fileId, key,
                        filename: 'unknown',
                        host: 'mega.nz',
                        type: 'file',
                        sourceLayer: 'host_mega',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect info from Mega page source (note: Mega uses client-side decryption)
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId, key } = hostCandidate;

        // Mega stores file metadata in the page
        const domPatterns = [
            // File name from page title or meta
            /<title>([^<]+)<\/title>/i,
            // Download manager data
            /(?:var|const|let)\s+(?:dl_url|mega_url)\s*=\s*["'](https?:\/\/[^"']+)["']/gi,
            // API responses embedded in page
            /["'](?:g|p)["']\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
            // Size info
            /"s"\s*:\s*(\d+)/i
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (url.startsWith('http') && !directCandidates.some(c => c.url === url)) {
                    directCandidates.push({
                        url, fileId, key,
                        host: 'mega.nz',
                        type: 'file',
                        sourceLayer: 'resurrection_mega_dom',
                        confidence: 0.88
                    });
                }
            }
        });

        // Reconstruct the canonical download page URL
        if (fileId && key) {
            directCandidates.push({
                url: `https://mega.nz/file/${fileId}#${key}`,
                fileId, key,
                host: 'mega.nz',
                type: 'file',
                sourceLayer: 'resurrection_mega_canonical',
                confidence: 0.99,
                note: 'Mega uses client-side AES decryption — direct CDN download requires MEGAcmd or similar'
            });
        }

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MegaExtractor;
}
