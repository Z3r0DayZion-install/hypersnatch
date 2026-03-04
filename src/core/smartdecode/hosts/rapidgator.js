/**
 * SmartDecode 2.0 - Rapidgator.net Extractor
 */

const RapidgatorExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?rapidgator\.net\/file\/([a-zA-Z0-9_-]+)\/([^\/\?\s"']+)/i,
        /https?:\/\/rg\.to\/file\/([a-zA-Z0-9_-]+)/i
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
                const filename = match[2] || 'unknown';
                if (!candidates.has(url)) {
                    candidates.set(url, {
                        url, fileId, filename,
                        host: 'rapidgator.net',
                        type: this._inferType(filename),
                        sourceLayer: 'host_rapidgator',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct download links for Rapidgator
     * @param {string} html 
     * @param {Object} hostCandidate
     * @returns {Array} List of resurrected direct candidates
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId, filename } = hostCandidate;

        // 1. Search for direct download links in script blocks
        const domPatterns = [
            /["'](https?:\/\/rapidgator\.net\/download\/[a-f0-9]+\/[^"']+)["']/gi
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
                    host: 'rapidgator.net',
                    type: this._inferType(filename),
                    sourceLayer: 'resurrection_rapidgator_dom',
                    confidence: 0.98
                });
            }
        });

        // 2. Heuristic Reconstruction
        if (fileId) {
            const reconstructedUrl = `https://rapidgator.net/download/${fileId}`;
            directCandidates.push({
                url: reconstructedUrl,
                filename,
                fileId,
                host: 'rapidgator.net',
                type: this._inferType(filename),
                sourceLayer: 'resurrection_rapidgator_heuristic',
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
    module.exports = RapidgatorExtractor;
}
