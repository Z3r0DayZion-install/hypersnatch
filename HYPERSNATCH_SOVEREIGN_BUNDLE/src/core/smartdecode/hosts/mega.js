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
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MegaExtractor;
}
