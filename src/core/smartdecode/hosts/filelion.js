/**
 * SmartDecode 2.0 - Filelion Extractor
 */

const FilelionExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?(?:filelion\.(?:live|com|cc|xyz)|lion\.stream)\/v\/([a-zA-Z0-9]+)/i,
        /https?:\/\/(?:www\.)?(?:filelion\.(?:live|com|cc|xyz)|lion\.stream)\/d\/([a-zA-Z0-9]+)/i
    ],

    extract(input) {
        if (!input || typeof input !== 'string') return [];
        const candidates = new Map();
        this.PATTERNS.forEach(regex => {
            let match;
            const localRegex = new RegExp(regex.source, 'gi');
            while ((match = localRegex.exec(input)) !== null) {
                const url = match[0];
                const fileId = match[1];
                if (!candidates.has(url)) {
                    candidates.set(url, {
                        url, fileId, filename: 'unknown',
                        host: 'filelion.live',
                        type: 'video',
                        sourceLayer: 'host_filelion',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from FileLion HTML source
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        const domPatterns = [
            // jwplayer / video source
            /(?:file|src)\s*[:=]\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
            /(?:file|src)\s*[:=]\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
            /<source\s+[^>]*src=["'](https?:\/\/[^"']+)["']/gi,
            // FileLion CDN patterns
            /["'](https?:\/\/[a-z0-9]+\.filelions?\.[^"']+\.m3u8[^"']*)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern.source, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                directCandidates.push({
                    url, fileId,
                    host: 'filelion.live',
                    type: 'video',
                    sourceLayer: 'resurrection_filelion_dom',
                    confidence: 0.96
                });
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilelionExtractor;
}
