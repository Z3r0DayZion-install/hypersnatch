/**
 * SmartDecode 2.0 - Turbobit.net Extractor
 */

const TurbobitExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?turbobit\.net\/([a-zA-Z0-9]+)\.html/i,
        /https?:\/\/turb\.to\/([a-zA-Z0-9]+)\.html/i
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
                        host: 'turbobit.net',
                        type: 'file',
                        sourceLayer: 'host_turbobit',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;
        const domPatterns = [
            /(?:id=["'](?:download|btn_download)["'][^>]*href=["'](https?:\/\/[^"']+)["'])/gi,
            /(?:href=["'](https?:\/\/(?:[a-z0-9]+\.)?turbobit\.net[^"']*\/download\/[^"']+)["'])/gi,
            /(?:href=["'](https?:\/\/(?:[a-z0-9]+\.)?turb\.to[^"']*\/download\/[^"']+)["'])/gi,
            /(?:var|const|let)\s+(?:download_url|file_url|direct_url)\s*=\s*["'](https?:\/\/[^"']+)["']/gi,
            /<a[^>]+class=["'][^"']*download[^"']*["'][^>]*href=["'](https?:\/\/[^"']+)["']/gi
        ];
        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern.source, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!directCandidates.some(c => c.url === url)) {
                    directCandidates.push({
                        url, fileId,
                        host: 'turbobit.net',
                        type: 'file',
                        sourceLayer: 'resurrection_turbobit_dom',
                        confidence: 0.92
                    });
                }
            }
        });
        return directCandidates;
    },

    _inferType(filename) {
        return 'file';
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TurbobitExtractor;
}
