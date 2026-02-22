/**
 * SmartDecode 2.0 - Streamwish.to Extractor
 */

const StreamwishExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?(?:streamwish\.to|awish\.pro|wishembed\.com|dwish\.pro|strwish\.com)\/e\/([a-zA-Z0-9]+)/i,
        /https?:\/\/(?:www\.)?(?:streamwish\.to|awish\.pro)\/([a-zA-Z0-9]+)/i
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
                        host: 'streamwish.to',
                        type: 'video',
                        sourceLayer: 'host_streamwish',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamwishExtractor;
}
