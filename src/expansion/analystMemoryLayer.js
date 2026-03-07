/**
 * AnalystMemoryLayer.js (Expansion)
 * Stores review history, annotations, and accepted/rejected suggestions
 * to improve institutional learning across investigations.
 */
class AnalystMemoryLayer {
    constructor() {
        this.memory = new Map(); // caseId -> memory object
        this.globalAnnotations = [];
    }

    recordDecision(caseId, analystId, suggestionId, decision, notes = "") {
        let caseMemory = this.memory.get(caseId);
        if (!caseMemory) {
            caseMemory = { decisions: [], annotations: [] };
            this.memory.set(caseId, caseMemory);
        }

        const record = {
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            analystId,
            suggestionId,
            decision, // 'accepted', 'rejected', etc.
            notes,
            timestamp: new Date().toISOString()
        };

        caseMemory.decisions.push(record);
        return record;
    }

    annotate(caseId, analystId, targetId, text) {
        const annotation = {
            id: `ann_${Date.now()}`,
            caseId,
            analystId,
            targetId,
            text,
            timestamp: new Date().toISOString()
        };

        if (caseId) {
            let caseMemory = this.memory.get(caseId);
            if (!caseMemory) {
                caseMemory = { decisions: [], annotations: [] };
                this.memory.set(caseId, caseMemory);
            }
            caseMemory.annotations.push(annotation);
        } else {
            this.globalAnnotations.push(annotation);
        }

        return annotation;
    }

    getCaseMemory(caseId) {
        return this.memory.get(caseId) || null;
    }
}

module.exports = AnalystMemoryLayer;
