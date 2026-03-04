/**
 * SmartDecode 2.0 - Emload.com Extractor
 * Specialized patterns for Emload hosting service.
 */

const EmloadExtractor = {
    // Patterns derived from test_emload_link.py and legacy code
    PATTERNS: [
        /https?:\/\/(?:www\.)?emload\.com\/v2\/file\/([a-zA-Z0-9_-]+)\/([^\/\?\s"']+)/i,
        /https?:\/\/(?:www\.)?emload\.com\/file\/([a-zA-Z0-9_-]+)\/([^\/\?\s"']+)/i,
        /https?:\/\/(?:www\.)?emload\.com\/file\/([a-zA-Z0-9_-]+)/i, // Support for IDs without filenames
        /https?:\/\/(?:www\.)?emload\.com\/[fe]\/([a-zA-Z0-9_-]+)/i
    ],

    /**
     * Extract Emload candidates from raw string
     * @param {string} input 
     * @returns {Array} List of candidate objects
     */
    extract(input) {
        if (!input || typeof input !== 'string') return [];

        const candidates = new Map();

        this.PATTERNS.forEach(regex => {
            let match;
            const localRegex = new RegExp(regex.source, 'gi');
            while ((match = localRegex.exec(input)) !== null) {
                const url = match[0];
                const fileId = match[1];
                const filename = match[2] || 'unknown';

                if (!candidates.has(url)) {
                    candidates.set(url, {
                        url,
                        fileId,
                        filename,
                        host: 'emload.com',
                        type: this._inferType(filename),
                        sourceLayer: 'host_emload',
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
     * @param {Object} hostCandidate The detected host link candidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId, filename } = hostCandidate;

        // 1. DOM Offline Recreation: Search for specific JS variables or hidden inputs
        // Common Emload patterns for direct links in page source
        const domPatterns = [
            /(?:var|const|let)\s+(?:stream_url|file_link|direct_url)\s*=\s*["'](https?:\/\/[^"']+)["']/gi,
            /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/[^"']+\/dl\/[^"']+)["']/gi,
            /<input\s+(?:[^>]*?\s+)?id=["']dl_link["']\s+value=["'](https?:\/\/[^"']+)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern.source, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                directCandidates.push({
                    url,
                    filename,
                    fileId,
                    host: 'emload.com',
                    type: this._inferType(filename),
                    sourceLayer: 'resurrection_emload_dom',
                    confidence: 0.98
                });
            }
        });

        // 2. Heuristic Reconstruction (from HyperSnatch Fused legacy logic)
        // If we have a fileId, we can predict the CDN stream URL
        if (fileId) {
            const reconstructedUrl = `https://cdn.emload.com/stream/${fileId}${filename !== 'unknown' ? '.' + filename.split('.').pop() : '.mp4'}`;
            directCandidates.push({
                url: reconstructedUrl,
                filename,
                fileId,
                host: 'emload.com',
                type: this._inferType(filename),
                sourceLayer: 'resurrection_emload_heuristic',
                confidence: 0.85 // Heuristics are slightly lower than DOM matches
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
    module.exports = EmloadExtractor;
}
