/**
 * SmartDecode 2.0 - Mediafire.com Extractor
 */

const MediafireExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?mediafire\.com\/file\/([a-zA-Z0-9_-]+)\/([^\/\?\s"']+)/i,
        /https?:\/\/(?:www\.)?mediafire\.com\/\?([a-zA-Z0-9_-]+)/i
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
                const filename = match[2] || 'unknown';
                if (!candidates.has(url)) {
                    candidates.set(url, {
                        url, fileId, filename,
                        host: 'mediafire.com',
                        type: this._inferType(filename),
                        sourceLayer: 'host_mediafire',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    _inferType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['mp4', 'mkv', 'avi'].includes(ext)) return 'video';
        if (['rar', 'zip', '7z'].includes(ext)) return 'archive';
        return 'file';
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediafireExtractor;
}
