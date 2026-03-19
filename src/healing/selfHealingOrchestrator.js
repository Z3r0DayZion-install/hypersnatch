/**
 * SelfHealingOrchestrator.js (Phase 94)
 * Allows the system to recover from pipeline failures in a logged, traceable way.
 * Handles retries, fallback selection, and degraded-mode execution.
 */
class SelfHealingOrchestrator {
    constructor() {
        this.auditLog = [];
    }

    recover(failureContext = {}) {
        if (!failureContext.stage || !failureContext.error) {
            throw new Error("Invalid failure context. Must include 'stage' and 'error'.");
        }

        const { stage, error, bundleId } = failureContext;

        const plan = {
            id: `heal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            targetBundle: bundleId || 'unknown',
            original_failure: failureContext,
            action: 'unknown',
            review_state: 'required',
            success_probability: 0.0,
            degraded: false,
            timestamp: new Date().toISOString()
        };

        // Healing Strategies
        if (stage === 'smart_decode') {
            if (error.includes("timeout") || error.includes("504")) {
                plan.action = 'retry_with_exponential_backoff';
                plan.success_probability = 0.85;
            } else if (error.includes("parser_rejected")) {
                plan.action = 'fallback_generic_parser';
                plan.success_probability = 0.60;
                plan.degraded = true;
            } else {
                plan.action = 'halt_for_analyst';
                plan.success_probability = 0;
            }
        }
        else if (stage === 'intelligence_graph') {
            if (error.includes("deadlock")) {
                plan.action = 'retry_with_jitter';
                plan.success_probability = 0.90;
            } else if (error.includes("malformed_node")) {
                plan.action = 'drop_malformed_node_and_continue';
                plan.success_probability = 1.0;
                plan.degraded = true;
            }
        }
        else {
            plan.action = 'retry_with_fallback';
            plan.success_probability = 0.50;
        }

        this.auditLog.push(plan);
        return plan;
    }

    getAuditLog() {
        return this.auditLog;
    }

    getStats() {
        return {
            totalRecoveriesAttempted: this.auditLog.length,
            degradedExecutions: this.auditLog.filter(x => x.degraded).length,
            haltingFailures: this.auditLog.filter(x => x.action === 'halt_for_analyst').length
        };
    }
}

module.exports = SelfHealingOrchestrator;
