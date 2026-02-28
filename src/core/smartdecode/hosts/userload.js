/**
 * SmartDecode 2.0 - Userload.co Extractor
 */

const UserloadExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?userload\.co\/[ef]\/([a-zA-Z0-9]+)/i
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
                        host: 'userload.co',
                        type: 'video',
                        sourceLayer: 'host_userload',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct download links from userload.co page source
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId, filename } = hostCandidate;

        const domPatterns = [
            // Common download button patterns
            /(?:id=["'](?:download|btn_download|dl_btn)["'][^>]*href=["'](https?:\/\/[^"']+)["'])/gi,
            /(?:href=["'](https?:\/\/[^"']+)["'][^>]*id=["'](?:download|btn_download|dl_btn)["'])/gi,
            // Direct download CDN links
            /(?:href=["'](https?:\/\/(?:[a-z0-9]+\.)?userload\\.co[^"']*\/dl\/[^"']+)["'])/gi,
            /(?:href=["'](https?:\/\/(?:[a-z0-9]+\.)?userload\\.co[^"']*\/download\/[^"']+)["'])/gi,
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
                        host: 'userload.co',
                        type: 'file',
                        sourceLayer: 'resurrection_userload_dom',
                        confidence: 0.92
                    });
                }
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserloadExtractor;
}
