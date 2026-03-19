const fs = require('fs');
const path = require('path');

/**
 * CustodyChain.js
 * Tracks the forensic lineage of media artifacts and bundles.
 */
class CustodyChain {
    constructor(storagePath) {
        this.custodyDir = path.join(storagePath, 'custody');
        if (!fs.existsSync(this.custodyDir)) {
            fs.mkdirSync(this.custodyDir, { recursive: true });
        }
    }

    /**
     * Records a new event in the custody chain of a specific bundle.
     * @param {string} bundleFingerprint The fingerprint of the .hyper bundle
     * @param {string} action Description of the action (e.g., 'ACQUISITION', 'TRANSFER', 'ANALYSIS')
     * @param {Object} details Contextual details (e.g., source machine, target folder)
     */
    recordEvent(bundleFingerprint, action, details = {}) {
        const filePath = path.join(this.custodyDir, `${bundleFingerprint}.json`);
        let history = [];

        if (fs.existsSync(filePath)) {
            try {
                history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
                history = [];
            }
        }

        const event = {
            timestamp: new Date().toISOString(),
            action,
            details,
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                arch: process.arch
            }
        };

        history.push(event);
        fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf8');
    }

    /**
     * Get the complete custody chain for a bundle.
     * @param {string} bundleFingerprint 
     * @returns {Array} List of custody events
     */
    getChain(bundleFingerprint) {
        const filePath = path.join(this.custodyDir, `${bundleFingerprint}.json`);
        if (!fs.existsSync(filePath)) return [];
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            return [];
        }
    }
}

module.exports = CustodyChain;
