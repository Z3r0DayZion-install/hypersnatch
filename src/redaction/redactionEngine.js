/**
 * RedactionEngine.js (Phase 82)
 * Protects sensitive evidence before export or sharing.
 * Supports token masking, URL masking, domain masking, analyst identity redaction.
 * Tracks all redactions for audit.
 */
class RedactionEngine {
    constructor() {
        this.rules = [
            { name: 'token_param', pattern: /token=[A-Za-z0-9_\-.]+/gi, replacement: 'token=[REDACTED]' },
            { name: 'auth_header', pattern: /Bearer\s+[A-Za-z0-9_\-.]+/gi, replacement: 'Bearer [REDACTED]' },
            { name: 'jwt_token', pattern: /eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, replacement: '[JWT_REDACTED]' },
            { name: 'url', pattern: /https?:\/\/[^\s"'<>]+/gi, replacement: '[URL_REDACTED]' },
            { name: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, replacement: '[EMAIL_REDACTED]' },
            { name: 'ip_address', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_REDACTED]' }
        ];
        this.auditLog = [];
    }

    /**
     * Redact sensitive content from text using all rules.
     */
    redact(text, options = {}) {
        const appliedRules = options.rules || this.rules.map(r => r.name);
        let redacted = text;
        const applied = [];

        for (const rule of this.rules) {
            if (appliedRules.includes(rule.name)) {
                const matches = redacted.match(rule.pattern);
                if (matches && matches.length > 0) {
                    redacted = redacted.replace(rule.pattern, rule.replacement);
                    applied.push({ rule: rule.name, count: matches.length });
                }
            }
        }

        const record = {
            timestamp: new Date().toISOString(),
            rulesApplied: applied,
            totalRedactions: applied.reduce((s, a) => s + a.count, 0),
            originalLength: text.length,
            redactedLength: redacted.length
        };
        this.auditLog.push(record);

        return { text: redacted, audit: record };
    }

    /**
     * Redact a bundle object (deep redaction of string values).
     */
    redactBundle(bundle) {
        const redacted = {};
        for (const [key, value] of Object.entries(bundle)) {
            if (typeof value === 'string') {
                redacted[key] = this.redact(value).text;
            } else if (typeof value === 'object' && value !== null) {
                redacted[key] = this.redactBundle(value);
            } else {
                redacted[key] = value;
            }
        }
        return redacted;
    }

    addRule(name, pattern, replacement) {
        this.rules.push({ name, pattern, replacement });
    }

    getAuditLog() { return this.auditLog; }

    getStats() {
        return {
            totalRules: this.rules.length,
            totalRedactions: this.auditLog.reduce((s, a) => s + a.totalRedactions, 0),
            operations: this.auditLog.length
        };
    }
}

module.exports = RedactionEngine;
