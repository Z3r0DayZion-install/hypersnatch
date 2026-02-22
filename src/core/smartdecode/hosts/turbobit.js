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
            const localRegex = new RegExp(regex, 'gi');
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

    _inferType(filename) {
        return 'file';
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TurbobitExtractor;
}
