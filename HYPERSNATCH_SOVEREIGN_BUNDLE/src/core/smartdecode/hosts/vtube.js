/**
 * SmartDecode 2.0 - VTube.to Extractor
 */

const VTubeExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?(?:vtube\.to|vtube\.cc)\/([a-zA-Z0-9]+)/i,
        /https?:\/\/(?:www\.)?(?:vtube\.to|vtube\.cc)\/embed-([a-zA-Z0-9]+)\.html/i
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
                        host: 'vtube.to',
                        type: 'video',
                        sourceLayer: 'host_vtube',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VTubeExtractor;
}
