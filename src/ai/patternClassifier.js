/**
 * PatternClassifier.js (Phase 71)
 * AI-driven pattern classification with explainable outputs.
 * Every classification includes: label, confidence, reasons[], features_used[].
 */
class PatternClassifier {
    constructor() {
        this.knownPatterns = [
            { label: 'SHAKA_CLOUDFRONT_DASH', rules: { player: 'shaka', cdn: 'cloudfront', protocol: 'dash' }, baseConfidence: 0.92 },
            { label: 'VIDEOJS_AKAMAI_HLS', rules: { player: 'videojs', cdn: 'akamai', protocol: 'hls' }, baseConfidence: 0.90 },
            { label: 'SHAKA_AKAMAI_HLS', rules: { player: 'shaka', cdn: 'akamai', protocol: 'hls' }, baseConfidence: 0.88 },
            { label: 'JWT_SHORT_TTL_PATTERN', rules: { tokenType: 'jwt', shortTTL: true }, baseConfidence: 0.85 },
            { label: 'MSE_BLOB_DELIVERY_CHAIN', rules: { delivery: 'mse', blobUrls: true }, baseConfidence: 0.80 },
            { label: 'NATIVE_FASTLY_WEBRTC', rules: { player: 'native', cdn: 'fastly', protocol: 'webrtc' }, baseConfidence: 0.75 }
        ];
        this.classifications = [];
    }

    /**
     * Classify a single bundle's features.
     */
    classify(bundleFeatures = {}) {
        const normalized = this._normalize(bundleFeatures);
        let bestMatch = { label: 'UNKNOWN_PATTERN', confidence: 0.0, reasons: ['No matching pattern found'], features_used: Object.keys(bundleFeatures) };

        for (const pattern of this.knownPatterns) {
            const { matched, matchedKeys, totalKeys } = this._matchRules(pattern.rules, normalized);
            if (matched) {
                const confidence = pattern.baseConfidence * (matchedKeys / Math.max(totalKeys, 1));
                if (confidence > bestMatch.confidence) {
                    bestMatch = {
                        label: pattern.label,
                        confidence: Math.round(confidence * 100) / 100,
                        reasons: Object.entries(pattern.rules).map(([k, v]) => `${k}=${v}`),
                        features_used: Object.keys(bundleFeatures)
                    };
                }
            }
        }

        this.classifications.push(bestMatch);
        return bestMatch;
    }

    /**
     * Classify all bundles in a case.
     */
    classifyBundles(bundles) {
        this.classifications = [];
        return bundles.map(b => {
            const features = {
                player: (b.playerSignature || '').toLowerCase(),
                cdn: (b.cdn || '').toLowerCase(),
                protocol: (b.protocol || '').toLowerCase()
            };
            const result = this.classify(features);
            result.bundleId = b.path || b.id || 'unknown';
            return result;
        });
    }

    _normalize(features) {
        const norm = {};
        for (const [k, v] of Object.entries(features)) {
            norm[k] = typeof v === 'string' ? v.toLowerCase() : v;
        }
        return norm;
    }

    _matchRules(rules, features) {
        let matchedKeys = 0;
        const totalKeys = Object.keys(rules).length;
        for (const [k, v] of Object.entries(rules)) {
            if (features[k] !== undefined && features[k] === v) matchedKeys++;
        }
        return { matched: matchedKeys === totalKeys, matchedKeys, totalKeys };
    }

    getStats() {
        const labels = {};
        this.classifications.forEach(c => { labels[c.label] = (labels[c.label] || 0) + 1; });
        return {
            totalClassified: this.classifications.length,
            uniqueLabels: Object.keys(labels).length,
            labelDistribution: labels
        };
    }
}

module.exports = PatternClassifier;
