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
            const localRegex = new RegExp(regex.source, 'gi');
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
    },

    /**
     * Resurrect direct stream/download links from StreamWish page HTML
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        const domPatterns = [
            // jwplayer source file
            /(?:file|src)\s*[:=]\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
            /(?:file|src)\s*[:=]\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
            // direct source in video tags
            /<source\s+[^>]*src=["'](https?:\/\/[^"']+)["']/gi,
            // CDN URLs in scripts
            /["'](https?:\/\/[a-z0-9]+\.(?:swdns|swhb|wishembed)\.[^"']+\.m3u8[^"']*)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern.source, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                directCandidates.push({
                    url, fileId,
                    host: 'streamwish.to',
                    type: 'video',
                    sourceLayer: 'resurrection_streamwish_dom',
                    confidence: 0.96
                });
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamwishExtractor;
}
