/**
 * SmartDecode 2.0 - Krakenfiles.com Extractor
 */

const KrakenfilesExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?krakenfiles\.com\/view\/([a-zA-Z0-9]+)\/file\.html/i
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
                        host: 'krakenfiles.com',
                        type: 'file',
                        sourceLayer: 'host_krakenfiles',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct download links from krakenfiles.com page source
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId, filename } = hostCandidate;

        const domPatterns = [
            // Common download button patterns
            /(?:id=["'](?:download|btn_download|dl_btn)["'][^>]*href=["'](https?:\/\/[^"']+)["'])/gi,
            /(?:href=["'](https?:\/\/[^"']+)["'][^>]*id=["'](?:download|btn_download|dl_btn)["'])/gi,
            // Direct download CDN links
            /(?:href=["'](https?:\/\/(?:[a-z0-9]+\.)?krakenfiles\\.com[^"']*\/dl\/[^"']+)["'])/gi,
            /(?:href=["'](https?:\/\/(?:[a-z0-9]+\.)?krakenfiles\\.com[^"']*\/download\/[^"']+)["'])/gi,
            // JS variable assignment for download URL
            /(?:var|const|let)\s+(?:download_url|file_url|direct_url|dl_link)\s*=\s*["'](https?:\/\/[^"']+)["']/gi,
            // Hidden inputs with download URLs
            /<input[^>]+(?:id|name)=["'](?:dl|download|direct)[^"']*["'][^>]*value=["'](https?:\/\/[^"']+)["']/gi,
            // Generic form action for downloads
            /<form[^>]+action=["'](https?:\/\/[^"']+\/(?:dl|download|get)\/[^"']+)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!directCandidates.some(c => c.url === url)) {
                    directCandidates.push({
                        url, filename: filename || 'unknown', fileId,
                        host: 'krakenfiles.com',
                        type: 'file',
                        sourceLayer: 'resurrection_krakenfiles_dom',
                        confidence: 0.92
                    });
                }
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = KrakenfilesExtractor;
}
