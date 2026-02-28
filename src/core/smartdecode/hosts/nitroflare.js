/**
 * SmartDecode 2.0 - Nitroflare.com Extractor
 */

const NitroflareExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?nitroflare\.com\/view\/([a-zA-Z0-9]+)\/([^\/\?\s"']+)/i
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
                const filename = match[2] || 'unknown';
                if (!candidates.has(url)) {
                    candidates.set(url, {
                        url, fileId, filename,
                        host: 'nitroflare.com',
                        type: this._inferType(filename),
                        sourceLayer: 'host_nitroflare',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId, filename } = hostCandidate;
        const domPatterns = [
            /(?:id=["'](?:download|btn_download)["'][^>]*href=["'](https?:\/\/[^"']+)["'])/gi,
            /(?:href=["'](https?:\/\/[^"']+)["'][^>]*id=["'](?:download|btn_download)["'])/gi,
            /(?:href=["'](https?:\/\/(?:[a-z0-9]+\.)?nitroflare\.com[^"']*\/dl\/[^"']+)["'])/gi,
            /(?:var|const|let)\s+(?:download_url|file_url|direct_url)\s*=\s*["'](https?:\/\/[^"']+)["']/gi,
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
                        host: 'nitroflare.com',
                        type: this._inferType(filename),
                        sourceLayer: 'resurrection_nitroflare_dom',
                        confidence: 0.92
                    });
                }
            }
        });
        return directCandidates;
    },

    _inferType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['mp4', 'mkv', 'avi'].includes(ext)) return 'video';
        if (['rar', 'zip', '7z'].includes(ext)) return 'archive';
        return 'file';
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NitroflareExtractor;
}
