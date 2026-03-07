/**
 * PolicyEngine.js (Phase 79)
 * Deterministic policy evaluation with reason chains.
 * Every decision emits: policy matched, reasons[], evidence, timestamp, actor.
 */
class PolicyEngine {
    constructor() {
        this.policies = [];
        this.auditLog = [];
    }

    /**
     * Load a set of policy rules.
     */
    loadPolicies(rules) {
        this.policies = rules.map(r => ({
            id: r.id || `pol_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: r.name,
            field: r.field,
            operator: r.operator || 'equals',
            value: r.value || r.equals,
            action: r.action || 'deny',
            reason: r.reason || 'policy_matched',
            priority: r.priority || 0
        }));
        return this.policies;
    }

    /**
     * Evaluate context against all loaded policies.
     */
    evaluate(context = {}, actor = 'system') {
        const decisions = [];

        for (const policy of this.policies.sort((a, b) => b.priority - a.priority)) {
            const contextValue = context[policy.field];
            let matched = false;

            switch (policy.operator) {
                case 'equals': matched = contextValue === policy.value; break;
                case 'not_equals': matched = contextValue !== policy.value; break;
                case 'contains': matched = typeof contextValue === 'string' && contextValue.includes(policy.value); break;
                case 'greater_than': matched = contextValue > policy.value; break;
                case 'less_than': matched = contextValue < policy.value; break;
                default: matched = contextValue === policy.value;
            }

            if (matched) {
                const decision = {
                    policy: policy.name,
                    policyId: policy.id,
                    action: policy.action,
                    reasons: [policy.reason],
                    evidence: { field: policy.field, value: contextValue, expected: policy.value },
                    timestamp: new Date().toISOString(),
                    actor
                };
                decisions.push(decision);
                this.auditLog.push(decision);
            }
        }

        return decisions;
    }

    /**
     * Check if a specific action is allowed in the given context.
     */
    isAllowed(action, context, actor = 'system') {
        const decisions = this.evaluate(context, actor);
        const denials = decisions.filter(d => d.action === 'deny');
        return {
            allowed: denials.length === 0,
            decisions,
            denials
        };
    }

    getAuditLog() { return this.auditLog; }

    getStats() {
        return {
            totalPolicies: this.policies.length,
            totalDecisions: this.auditLog.length,
            denials: this.auditLog.filter(d => d.action === 'deny').length,
            allows: this.auditLog.filter(d => d.action === 'allow').length
        };
    }
}

module.exports = PolicyEngine;
