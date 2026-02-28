/**
 * SmartDecode 2.0 - Kshared.com Extractor
 * Specialized patterns for Kshared hosting service.
 */

const KsharedExtractor = {
    // Patterns derived from documentation and legacy logic
    PATTERNS: [
        /https?:\/\/(?:www\.)?kshared\.com\/file\/([a-zA-Z0-9_-]+)\/([^\/\?\s"']+)/i,
        /https?:\/\/(?:www\.)?kshared\.com\/file\/([a-zA-Z0-9_-]+)(?:[\/\?\s"']|$)/i,
        /https?:\/\/(?:www\.)?kshared\.com\/f\/([a-zA-Z0-9_-]+)/i
    ],

    /**
     * Extract Kshared candidates from raw string
     * @param {string} input 
     * @returns {Array} List of candidate objects
     */
    extract(input) {
        if (!input || typeof input !== 'string') return [];

        const candidates = new Map();

        this.PATTERNS.forEach(regex => {
            let match;
            const localRegex = new RegExp(regex, 'gi');
            while ((match = localRegex.exec(input)) !== null) {
                // match[0] may include a trailing delimiter char from the lookahead — strip it
                const rawUrl = match[0];
                const url = rawUrl.replace(/[\s"'\/]$/, '');
                const fileId = match[1];
                const filename = match[2] || 'unknown';

                if (!candidates.has(url)) {
                    candidates.set(url, {
                        url,
                        fileId,
                        filename,
                        host: 'kshared.com',
                        type: this._inferType(filename),
                        sourceLayer: 'host_kshared',
                        confidence: 0.95
                    });
                }
            }
        });

        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct download links from HTML context or heuristic transformation
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId, filename } = hostCandidate;

        // 1. DOM Offline Recreation
        const domPatterns = [
            /(?:var|const|let)\s+(?:dl_link|content_url)\s*=\s*["'](https?:\/\/[^"']+)["']/gi,
            /["'](https?:\/\/dl\.kshared\.com\/content\/[^"']+)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                directCandidates.push({
                    url,
                    filename,
                    fileId,
                    host: 'kshared.com',
                    type: this._inferType(filename),
                    sourceLayer: 'resurrection_kshared_dom',
                    confidence: 0.98
                });
            }
        });

        // 2. Heuristic Reconstruction
        if (fileId) {
            const reconstructedUrl = `https://dl.kshared.com/content/${fileId}`;
            directCandidates.push({
                url: reconstructedUrl,
                filename,
                fileId,
                host: 'kshared.com',
                type: this._inferType(filename),
                sourceLayer: 'resurrection_kshared_heuristic',
                confidence: 0.85
            });
        }

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
    module.exports = KsharedExtractor;
}
