/**
 * DataProvenanceSystem.js (Expansion)
 * Attaches metadata (source, processing step, origin dataset) to signals
 * to ensure auditability and forensic traceability.
 */
class DataProvenanceSystem {
    constructor() {
        this.registry = new Map();
    }

    tagSignal(signalId, source, dataset = 'unknown') {
        if (!signalId || !source) throw new Error("signalId and source are required");

        const tag = {
            signalId,
            source,
            dataset,
            processingChain: [],
            ingestedAt: new Date().toISOString()
        };

        this.registry.set(signalId, tag);
        return tag;
    }

    appendStep(signalId, stepName, confidenceWeight = 1.0) {
        if (!this.registry.has(signalId)) {
            throw new Error(`Signal ${signalId} not found in provenance registry`);
        }
        const tag = this.registry.get(signalId);
        tag.processingChain.push({
            step: stepName,
            timestamp: new Date().toISOString(),
            weight: confidenceWeight
        });
        return tag;
    }

    getTrace(signalId) {
        return this.registry.get(signalId);
    }
}

module.exports = DataProvenanceSystem;
