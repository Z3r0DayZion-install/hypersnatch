/**
 * SmartDecode 2.0 - LuluStream.com Extractor
 */

const LuluStreamExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?lulustream\.com\/[ev]\/([a-zA-Z0-9]+)/i,
        /https?:\/\/(?:www\.)?lulu\.to\/[ev]\/([a-zA-Z0-9]+)/i
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
                        host: 'lulustream.com',
                        type: 'video',
                        sourceLayer: 'host_lulustream',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LuluStreamExtractor;
}
