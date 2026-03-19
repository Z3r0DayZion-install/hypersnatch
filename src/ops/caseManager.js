const fs = require("fs");
const path = require("path");

/**
 * HyperSnatch Operations: Case Manager
 * Manages persistent forensic investigation cases.
 */

class CaseManager {
    constructor(storageDir = "./cases") {
        this.storageDir = storageDir;
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    /**
     * createCase(caseId, metadata)
     */
    createCase(caseId, metadata) {
        const casePath = path.join(this.storageDir, `${caseId}.json`);
        const caseData = {
            id: caseId,
            status: "open",
            createdAt: new Date(),
            bundles: [],
            observations: [],
            ...metadata
        };

        fs.writeFileSync(casePath, JSON.stringify(caseData, null, 2));
        console.log(`[CaseManager] Created case: ${caseId}`);
        return caseData;
    }

    /**
     * addBundleToCase(caseId, bundlePath)
     */
    addBundleToCase(caseId, bundlePath) {
        const casePath = path.join(this.storageDir, `${caseId}.json`);
        if (!fs.existsSync(casePath)) throw new Error("Case not found");

        const caseData = JSON.parse(fs.readFileSync(casePath, "utf8"));
        caseData.bundles.push({
            path: bundlePath,
            addedAt: new Date()
        });

        fs.writeFileSync(casePath, JSON.stringify(caseData, null, 2));
        return caseData;
    }
}

module.exports = new CaseManager();
