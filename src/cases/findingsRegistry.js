/**
 * FindingsRegistry.js
 * Tracks critical observations and findings within a forensic case.
 */
const FindingsRegistry = {
    /**
     * Add a finding to a case
     * @param {Object} caseData 
     * @param {Object} findingData { bundle_id, title, severity, tags, notes }
     * @returns {Object} Updated case object
     */
    addFinding(caseData, findingData) {
        if (!findingData.title || !findingData.bundle_id) {
            throw new Error("Finding requires at least a title and a bundle_id");
        }

        const finding = {
            id: `finding-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            bundle_id: findingData.bundle_id,
            title: findingData.title,
            severity: findingData.severity || "info",
            tags: Array.isArray(findingData.tags) ? findingData.tags : [],
            notes: findingData.notes || "",
            timestamp: Date.now()
        };

        caseData.findings.push(finding);
        return caseData;
    },

    /**
     * Update an existing finding
     * @param {Object} caseData 
     * @param {string} findingId 
     * @param {Object} updates 
     * @returns {Object} Updated case object
     */
    updateFinding(caseData, findingId, updates) {
        const idx = caseData.findings.findIndex(f => f.id === findingId);
        if (idx === -1) throw new Error("Finding not found");

        caseData.findings[idx] = {
            ...caseData.findings[idx],
            ...updates,
            timestamp: Date.now() // Update modification time
        };

        return caseData;
    }
};

module.exports = FindingsRegistry;
