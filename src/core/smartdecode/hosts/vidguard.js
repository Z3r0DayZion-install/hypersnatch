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
            const localRegex = new RegExp(regex.source, 'gi');
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
    },

    /**
     * Resurrect direct stream links from vidguard.to page source
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
            /["'](https?:\/\/[a-z0-9]+\.(?:vidguard\\.to)[^"']+\.(?:m3u8|mp4)[^"']*)["']/gi
        ];

        domPatterns.forEach(pattern => {
            let match;
            const localRegex = new RegExp(pattern.source, 'gi');
            while ((match = localRegex.exec(html)) !== null) {
                const url = match[1];
                if (!directCandidates.some(c => c.url === url)) {
                    directCandidates.push({
                        url, fileId,
                        host: 'vidguard.to',
                        type: 'video',
                        sourceLayer: 'resurrection_vidguard_dom',
                        confidence: 0.94
                    });
                }
            }
        });

        return directCandidates;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VidguardExtractor;
}
