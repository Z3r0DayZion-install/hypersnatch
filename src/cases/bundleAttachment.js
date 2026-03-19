const fs = require('fs');
const path = require('path');

/**
 * BundleAttachment.js
 * Handles linking .hyper bundles to forensic cases.
 * Ensures bundles remain immutable by storing only references.
 */
const BundleAttachment = {
    /**
     * Attach a bundle reference to a case
     * @param {Object} caseData The case object from CaseStore
     * @param {string} bundlePath Path to the .hyper bundle file
     * @returns {Object} Updated case object
     */
    attachBundle(caseData, bundlePath) {
        if (!fs.existsSync(bundlePath)) {
            throw new Error(`Bundle file not found: ${bundlePath}`);
        }

        let bundleMetadata;
        try {
            const raw = fs.readFileSync(bundlePath, 'utf8');
            bundleMetadata = JSON.parse(raw);
        } catch (err) {
            throw new Error(`Invalid bundle format: ${err.message}`);
        }

        // Validate basic HyperSnatch bundle requirements
        if (!bundleMetadata.version || !bundleMetadata.fingerprint) {
            throw new Error("Invalid bundle: Missing version or fingerprint metadata");
        }

        // Check for duplicates
        const isDuplicate = caseData.bundles.some(b => b.path === bundlePath || b.fingerprint === bundleMetadata.fingerprint);
        if (isDuplicate) {
            throw new Error("Bundle is already attached to this case");
        }

        // Attach reference
        caseData.bundles.push({
            path: bundlePath,
            fingerprint: bundleMetadata.fingerprint,
            attachedAt: Date.now(),
            host: bundleMetadata.host || "unknown",
            sourceUrl: bundleMetadata.url || "unknown"
        });

        return caseData;
    }
};

module.exports = BundleAttachment;
