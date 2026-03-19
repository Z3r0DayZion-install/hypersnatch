const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * AuditLogger.js
 * Record forensic analyst actions in a tamper-resistant format.
 * Part of HyperSnatch Phase 58.
 */
class AuditLogger {
    constructor(storagePath) {
        this.logPath = path.join(storagePath, 'audit.log');
        this.integrityPath = path.join(storagePath, 'audit_integrity.json');

        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
    }

    /**
     * Log an action with automatic timestamping and integrity chaining.
     * @param {string} type Action type (e.g., 'CASE_CREATE', 'BUNDLE_ATTACH')
     * @param {Object} data Contextual data for the action
     * @param {string} analystId ID of the analyst performing the action
     */
    log(type, data, analystId = 'SYSTEM') {
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            type,
            analyst: analystId,
            data,
            prevHash: this._getLastHash()
        };

        const rawEntry = JSON.stringify(entry);
        const entryHash = crypto.createHash('sha256').update(rawEntry).digest('hex');

        // Append to log file
        fs.appendFileSync(this.logPath, rawEntry + '\n', 'utf8');

        // Update integrity manifest
        this._updateIntegrity(entryHash);
    }

    /**
     * Get the hash of the last entry for chaining
     * @private
     */
    _getLastHash() {
        if (!fs.existsSync(this.integrityPath)) return "GENESIS";
        try {
            const manifest = JSON.parse(fs.readFileSync(this.integrityPath, 'utf8'));
            return manifest.lastHash || "GENESIS";
        } catch (e) {
            return "GENESIS";
        }
    }

    /**
     * Update the integrity manifest with the latest hash
     * @private
     * @param {string} hash 
     */
    _updateIntegrity(hash) {
        const manifest = {
            lastHash: hash,
            updatedAt: new Date().toISOString(),
            version: "V1"
        };
        fs.writeFileSync(this.integrityPath, JSON.stringify(manifest, null, 2), 'utf8');
    }

    /**
     * Read all audit logs
     * @returns {Array} List of audit entries
     */
    getLogs() {
        if (!fs.existsSync(this.logPath)) return [];
        const content = fs.readFileSync(this.logPath, 'utf8');
        return content.trim().split('\n').map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        }).filter(l => l !== null);
    }
}

module.exports = AuditLogger;
