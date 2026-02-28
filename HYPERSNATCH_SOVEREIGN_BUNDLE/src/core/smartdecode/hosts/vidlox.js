/**
 * SmartDecode 2.0 - Vidlox.me Extractor
 */

const VidloxExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?vidlox\.me\/(?:embed-)?([a-zA-Z0-9]+)(?:\.html)?/i,
        /https?:\/\/(?:www\.)?vidlox\.tv\/(?:embed-)?([a-zA-Z0-9]+)(?:\.html)?/i
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
                        host: 'vidlox.me',
                        type: 'video',
                        sourceLayer: 'host_vidlox',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VidloxExtractor;
}
