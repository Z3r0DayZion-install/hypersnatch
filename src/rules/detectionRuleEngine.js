/**
 * DetectionRuleEngine.js
 * Evaluates forensic detection rules against bundles and infrastructure patterns.
 */
class DetectionRuleEngine {
    constructor() {
        this.rules = [
            {
                id: 'RULE_LEGACY_CID',
                name: 'Legacy CID Pattern Detected',
                severity: 'HIGH',
                condition: (bundle) => bundle.token && /cid=[a-f0-9]{32}/i.test(bundle.token)
            },
            {
                id: 'RULE_KNOWN_EXPLOIT_PROTO',
                name: 'Exploitative Protocol Header',
                severity: 'CRITICAL',
                condition: (bundle) => bundle.protocol === 'WEBRTC_LEAK_V1'
            },
            {
                id: 'RULE_CDN_MISMATCH',
                name: 'CDN Infrastructure Mismatch',
                severity: 'MEDIUM',
                condition: (bundle) => bundle.cdn === 'Cloudflare' && bundle.path.includes('akamai')
            }
        ];
    }

    /**
     * Evaluate all rules against a bundle.
     */
    evaluate(bundle) {
        const alerts = [];
        for (const rule of this.rules) {
            try {
                if (rule.condition(bundle)) {
                    alerts.push({
                        ruleId: rule.id,
                        name: rule.name,
                        severity: rule.severity,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (e) {
                console.error(`Rule evaluation error [${rule.id}]:`, e.message);
            }
        }
        return alerts;
    }

    addRule(rule) {
        this.rules.push(rule);
    }
}

module.exports = DetectionRuleEngine;
