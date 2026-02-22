/**
 * SmartDecode 2.0 - Hexupload.net Extractor
 */

const HexuploadExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?hexupload\.net\/([a-zA-Z0-9]+)/i
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
                        host: 'hexupload.net',
                        type: 'file',
                        sourceLayer: 'host_hexupload',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HexuploadExtractor;
}
