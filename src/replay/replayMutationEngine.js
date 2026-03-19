/**
 * ReplayMutationEngine.js
 * Logic to intercept and modify forensic replay payloads.
 */
class ReplayMutationEngine {
    constructor() {
        this.activeMutations = new Map(); // sessionId -> mutationConfig
    }

    /**
     * Register a mutation for a specific replay session.
     */
    setMutation(sessionId, config) {
        this.activeMutations.set(sessionId, config);
    }

    /**
     * Apply mutations to a request/response payload.
     */
    mutate(sessionId, type, data) {
        const config = this.activeMutations.get(sessionId);
        if (!config || !config.enabled) return data;

        let mutatedData = { ...data };

        if (type === 'request' && config.modifyHeaders) {
            mutatedData.headers = { ...mutatedData.headers, ...config.modifyHeaders };
        }

        if (type === 'request' && config.injectTokens) {
            // Simple token injection logic
            if (mutatedData.url && mutatedData.url.includes('?')) {
                mutatedData.url += '&' + config.injectTokens;
            } else {
                mutatedData.url += '?' + config.injectTokens;
            }
        }

        return mutatedData;
    }

    clearMutation(sessionId) {
        this.activeMutations.delete(sessionId);
    }
}

module.exports = ReplayMutationEngine;
