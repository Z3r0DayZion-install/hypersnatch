/**
 * URL Strategy Plugin
 * Detects and processes direct URLs
 */

class URLStrategy {
    constructor() {
        this.name = 'URL';
        this.version = '1.0.0';
    }
    
    /**
     * Detect URLs in input text
     * @param {string} input - Raw input text
     * @returns {Array} Array of detected URLs
     */
    async detect(input) {
        const urlPattern = /https?:\/\/[^\s<>"']+/gi;
        const matches = input.match(urlPattern) || [];
        return matches;
    }
    
    /**
     * Analyze URL structure and metadata
     * @param {string} url - URL to analyze
     * @returns {Object} Analysis result
     */
    async analyze(url) {
        try {
            const urlObj = new URL(url);
            return {
                domain: urlObj.hostname,
                path: urlObj.pathname,
                protocol: urlObj.protocol,
                search: urlObj.search,
                hash: urlObj.hash,
                port: urlObj.port,
                origin: urlObj.origin
            };
        } catch (e) {
            return {
                error: 'Invalid URL',
                input: url
            };
        }
    }
    
    /**
     * Score URL confidence based on various factors
     * @param {Object} candidate - Candidate object with URL and analysis
     * @returns {number} Confidence score (0-1)
     */
    async score(candidate) {
        let score = 0.5;
        
        // Boost for HTTPS
        if (candidate.url.startsWith('https://')) score += 0.2;
        
        // Boost for common media domains
        const mediaDomains = ['youtube.com', 'vimeo.com', 'imgur.com', 'flickr.com', 'instagram.com'];
        if (mediaDomains.some(domain => candidate.url.includes(domain))) score += 0.2;
        
        // Boost for direct file links
        if (/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(candidate.url)) score += 0.3;
        
        // Penalty for suspicious patterns
        if (/bit\.ly|tinyurl|t\.co|goo\.gl/i.test(candidate.url)) score -= 0.2;
        
        return Math.max(0, Math.min(score, 1.0));
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = URLStrategy;
} else if (typeof window !== 'undefined') {
    window.URLStrategy = URLStrategy;
}
