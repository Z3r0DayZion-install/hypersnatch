/**
 * SmartDecode 2.0 - Vidmoly.to Extractor
 */

const VidmolyExtractor = {
    PATTERNS: [
        /https?:\/\/(?:www\.)?vidmoly\.(?:to|me|net|org)\/(?:embed-)?([a-zA-Z0-9]+)(?:\.html)?/i
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
                        host: 'vidmoly.to',
                        type: 'video',
                        sourceLayer: 'host_vidmoly',
                        confidence: 0.95
                    });
                }
            }
        });
        return Array.from(candidates.values());
    },

    /**
     * Resurrect direct stream links from vidmoly.to page source
     */
    resurrect(html, hostCandidate) {
        const directCandidates = [];
        const { fileId } = hostCandidate;

        const domPatterns = [
            // jwplayer / video.js source configs
            /(?:file|src|source)\s*[:=]\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
            /(?:file|src|source)\s*[:=]\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
            // HTML5 video source tags
            /<source\s+[^>]*src=["'](https?:\/\/[^"']+)["']/gi,
            /<video\s+[^>]*src=["'](https?:\/\/[^"']+)["']/gi,
            // Packed/obfuscated player URLs
            /(?:sources|playlist)\s*[:=]\s*\[\s*\{[^}]*["'](?:file|src)["']\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
            // Direct CDN stream URLs
            /["'](https?:\/\/[a-z0-9]+\.(?:vidmoly\\.to)[^"']+\.(?:m3u8|mp4)[^"']*)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern.source, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!directCandidates.some(c => c.url === url)) {
                    directCandidates.push({
                        url, fileId,
                        host: 'vidmoly.to',
                        type: 'video',
                        sourceLayer: 'resurrection_vidmoly_dom',
                        confidence: 0.94
                    });
                }
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VidmolyExtractor;
}
