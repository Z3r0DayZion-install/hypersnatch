/**
 * SmartDecode 2.0 - Vidguard.to Extractor
 */

const VidguardExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?(?:vidguard\.to|vpower\.pro|vgstream\.xyz|vidguard\.xyz)\/[ev]\/([a-zA-Z0-9]+)/i
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
                        host: 'vidguard.to',
                        type: 'video',
                        sourceLayer: 'host_vidguard',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VidguardExtractor;
}
