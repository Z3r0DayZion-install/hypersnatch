/**
 * SmartDecode 2.0 - Hotlink.cc Extractor
 */

const HotlinkExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?hotlink\.cc\/([a-zA-Z0-9]+)/i
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
                        host: 'hotlink.cc',
                        type: 'file',
                        sourceLayer: 'host_hotlink',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HotlinkExtractor;
}
