/**
 * AdversaryFingerprintEngine.js (Phase 93)
 * Fingerprints repeated operational patterns and links them to adversary groups.
 */
class AdversaryFingerprintEngine {
    constructor() {
        this.patterns = [];
    }

    fingerprint(observation = {}) {
        if (!observation || Object.keys(observation).length === 0) return null;

        // Build the structural label from keys
        const cdn = observation.cdn || "unk_cdn";
        const proto = observation.protocol || "unk_proto";
        const auth = observation.token_pattern || "unk_auth";

        const label = `${cdn}_${proto}_${auth}`.toUpperCase();

        let confidence = 0.50;
        const evidence = [];

        if (observation.cdn) { confidence += 0.15; evidence.push(`CDN: ${observation.cdn}`); }
        if (observation.protocol) { confidence += 0.10; evidence.push(`Protocol: ${observation.protocol}`); }
        if (observation.token_pattern) { confidence += 0.20; evidence.push(`Auth: ${observation.token_pattern}`); }

        const fp = {
            id: `advfp_${Date.now()}`,
            label,
            confidence: Math.min(confidence, 0.99),
            evidence,
            createdAt: new Date().toISOString()
        };

        this.patterns.push(fp);
        return fp;
    }

    compare(fp1_label, fp2_label) {
        if (fp1_label === fp2_label) return 1.0;

        const p1 = fp1_label.split('_');
        const p2 = fp2_label.split('_');

        let matches = 0;
        for (let i = 0; i < p1.length; i++) {
            if (p1[i] === p2[i]) matches++;
        }
        return matches / Math.max(p1.length, p2.length);
    }

    groupPatterns() {
        const groups = new Map();
        for (const p of this.patterns) {
            if (!groups.has(p.label)) {
                groups.set(p.label, []);
            }
            groups.get(p.label).push(p);
        }

        const result = [];
        for (const [label, array] of groups.entries()) {
            if (array.length > 1) {
                result.push({ group_label: label, count: array.length, group_confidence: array[0].confidence });
            }
        }
        return result;
    }
}

module.exports = AdversaryFingerprintEngine;
