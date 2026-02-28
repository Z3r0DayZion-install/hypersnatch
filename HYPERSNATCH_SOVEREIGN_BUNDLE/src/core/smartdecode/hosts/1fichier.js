/**
 * SmartDecode 2.0 - 1fichier.com Extractor
 */

const OneFichierExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?1fichier\.com\/\?([a-zA-Z0-9]+)/i,
        /https?:\/\/([a-zA-Z0-9]+)\.1fichier\.com/i
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
                        host: '1fichier.com',
                        type: 'file',
                        sourceLayer: 'host_1fichier',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OneFichierExtractor;
}
