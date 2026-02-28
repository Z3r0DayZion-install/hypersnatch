/**
 * SmartDecode 2.0 - Iframe Extraction Module
 * Extracts nested HTML from inline iframes (srcdoc or data: URIs) and recurses.
 */

const IframeExtractor = {
    // Regex for finding inline iframes
    PATTERNS: {
        SRCDOC: /<iframe\b[^>]+srcdoc=["']([\s\S]+?)["']/gi,
        DATA_SRC: /<iframe\b[^>]+src=["']data:text\/html;base64,([A-Za-z0-9+/=]+)["']/gi
    },

    MAX_DEPTH: 3,

    /**
     * Scan input for inline iframes and recurse
     * @param {string} input 
     * @param {Object} masterPipeline Reference to index.js run function
     * @param {number} depth Current recursion depth
     * @returns {Array} List of candidate objects
     */
    async extract(input, masterPipeline, depth = 0) {
        if (!input || typeof input !== 'string' || depth >= this.MAX_DEPTH) return [];

        const candidates = new Map();

        // 1. Process srcdoc iframes
        const srcdocRegex = new RegExp(this.PATTERNS.SRCDOC.source, 'gi');
        let srcdocMatch;
        while ((srcdocMatch = srcdocRegex.exec(input)) !== null) {
            const html = this._unescapeHtml(srcdocMatch[1]);
            if (html) {
                const found = await masterPipeline(html, depth + 1);
                this._mergeCandidates(candidates, found, 'iframe_srcdoc');
            }
        }

        // 2. Process data-URI iframes
        const dataRegex = new RegExp(this.PATTERNS.DATA_SRC.source, 'gi');
        let dataMatch;
        while ((dataMatch = dataRegex.exec(input)) !== null) {
            const b64 = dataMatch[1];
            const html = this._decodeBase64(b64);
            if (html) {
                const found = await masterPipeline(html, depth + 1);
                this._mergeCandidates(candidates, found, 'iframe_data_uri');
            }
        }

        return Array.from(candidates.values());
    },

    _mergeCandidates(map, found, source) {
        if (!found || !found.candidates) return;
        found.candidates.forEach(c => {
            const key = c.url;
            if (!map.has(key)) {
                map.set(key, {
                    ...c,
                    sourceLayer: `${source} > ${c.sourceLayer}`,
                    confidence: c.confidence * 0.85 // Lower confidence due to nesting
                });
            }
        });
    },

    _unescapeHtml(str) {
        return str
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
    },

    _decodeBase64(str) {
        try {
            if (typeof atob === 'function') return atob(str);
            if (typeof Buffer !== 'undefined') return Buffer.from(str, 'base64').toString('binary');
        } catch (e) {
            return null;
        }
        return null;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IframeExtractor;
}
