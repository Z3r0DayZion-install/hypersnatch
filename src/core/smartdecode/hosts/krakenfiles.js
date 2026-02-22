/**
 * SmartDecode 2.0 - Krakenfiles.com Extractor
 */

const KrakenfilesExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?krakenfiles\.com\/view\/([a-zA-Z0-9]+)\/file\.html/i
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
                        host: 'krakenfiles.com',
                        type: 'file',
                        sourceLayer: 'host_krakenfiles',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = KrakenfilesExtractor;
}
