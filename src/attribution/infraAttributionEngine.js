/**
 * InfraAttributionEngine.js (Phase 92)
 * Generates explainable infrastructure attributions. 
 * MUST emit reasons, confidence arrays, and alternate hypotheses.
 */
class InfraAttributionEngine {
    constructor() { }

    /**
     * Evaluates context items sequentially to attribute infrastructure operation chains.
     * @param {Object} context Example: {cdn: 'cloudfront', token_pattern: 'jwt', ttl: 300, fingerprint: 'shaka'}
     */
    attribute(context = {}) {
        const reasons = [];
        let provider = "unknown";
        let confidence = 0.0;
        let alternatives = [];

        if (!context || Object.keys(context).length === 0) {
            return { provider, confidence, reasons, alternatives };
        }

        // 1. Check for AWS Family Delivery
        if (context.cdn === "cloudfront" || (context.dns && context.dns.includes("awsdns"))) {
            if (context.token_pattern === "jwt") {
                provider = "aws_delivery_family";
                confidence = 0.88;
                reasons.push("Primary delivery inferred by CloudFront presence");
                reasons.push("JWT token structure matches known AWS auth-edge patterns");
                alternatives.push({ provider: "generic_cloud_delivery", confidence: 0.30 });
            } else {
                provider = "aws_delivery_family";
                confidence = 0.65;
                reasons.push("Primary delivery inferred by CloudFront presence");
                reasons.push("Lacking confirmatory auth signature");
                alternatives.push({ provider: "akamai_edge_routing", confidence: 0.25 });
            }
        }
        // 2. Check for Bulletproof / High-Risk Hosting
        else if (context.dns && (context.dns.includes('floki') || context.dns.includes('hostinger'))) {
            provider = "high_risk_hosting";
            confidence = 0.92;
            reasons.push(`DNS points to known bulletproof/high-risk ASN (${context.dns})`);
            if (context.ttl && context.ttl < 30) {
                reasons.push("Extremely low DNS TTL strongly indicates flux network behavior");
                confidence += 0.05;
            }
            alternatives.push({ provider: "misconfigured_cdn", confidence: 0.1 });
        }
        // 3. Generic CDN
        else if (context.cdn) {
            provider = `generic_${context.cdn}_delivery`;
            confidence = 0.50;
            reasons.push(`CDN headers confirm ${context.cdn}`);
            alternatives.push({ provider: "cloud_proxy", confidence: 0.4 });
        }

        return {
            id: `attr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            provider,
            confidence,
            reasons,
            alternatives,
            assessedAt: new Date().toISOString()
        };
    }
}

module.exports = InfraAttributionEngine;
