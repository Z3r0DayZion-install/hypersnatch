const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * CaseStore.js
 * Handles CRUD for forensic investigation cases.
 * Persistent storage logic for HyperSnatch Phase 57.
 */
class CaseStore {
    constructor(storagePath) {
        this.storagePath = storagePath;
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }
    }

    /**
     * Create a new case
     * @param {string} title 
     * @returns {Object} The created case
     */
    createCase(title) {
        const caseId = `case-${crypto.randomBytes(4).toString('hex')}`;
        const newCase = {
            case_id: caseId,
            title: title || "New Investigation",
            created: Date.now(),
            modified: Date.now(),
            bundles: [],
            notes: [],
            findings: []
        };

        this.saveCase(newCase);
        return newCase;
    }

    /**
     * Save/Update a case to disk
     * @param {Object} caseData 
     */
    saveCase(caseData) {
        if (!caseData || !caseData.case_id) {
            throw new Error("Invalid case data: Missing case_id");
        }
        caseData.modified = Date.now();
        const filePath = path.join(this.storagePath, `${caseData.case_id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(caseData, null, 2), 'utf8');
    }

    /**
     * Load a case from disk
     * @param {string} caseId 
     * @returns {Object|null}
     */
    loadCase(caseId) {
        const filePath = path.join(this.storagePath, `${caseId}.json`);
        if (!fs.existsSync(filePath)) return null;

        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error(`Error loading case ${caseId}:`, err);
            return null;
        }
    }

    /**
     * List all cases available in storage
     * @returns {Array} List of case metadata
     */
    listCases() {
        try {
            const files = fs.readdirSync(this.storagePath);
            return files
                .filter(f => f.endsWith('.json'))
                .map(f => {
                    try {
                        const data = JSON.parse(fs.readFileSync(path.join(this.storagePath, f), 'utf8'));
                        return {
                            case_id: data.case_id,
                            title: data.title,
                            created: data.created,
                            modified: data.modified,
                            bundleCount: data.bundles ? data.bundles.length : 0
                        };
                    } catch (e) {
                        return null;
                    }
                })
                .filter(c => c !== null)
                .sort((a, b) => b.modified - a.modified);
        } catch (err) {
            console.error("Error listing cases:", err);
            return [];
        }
    }

    /**
     * Delete a case from disk
     * @param {string} caseId 
     * @returns {boolean}
     */
    deleteCase(caseId) {
        const filePath = path.join(this.storagePath, `${caseId}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }
}

module.exports = CaseStore;
