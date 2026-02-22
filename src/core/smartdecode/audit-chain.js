/**
 * Sovereign Audit Chain
 * Creates tamper-proof .tear bundles for forensic verification.
 */

"use strict";

const crypto = require('crypto');

const AuditChain = {
    /**
     * Generates a signed analysis bundle.
     * @param {Object} sessionState - current candidates, refusals, and telemetry
     * @param {Object} systemInfo - build ID and engine version
     * @returns {Object} Signed .tear manifest
     */
    async signSession(sessionState, systemInfo) {
        const timestamp = new Date().toISOString();
        const payload = {
            header: {
                format: "TEAR-AUDIT-CHAIN",
                version: "1.0.0",
                timestamp,
                buildId: systemInfo.buildId,
                engineVersion: systemInfo.engineVersion
            },
            evidence: {
                candidates: sessionState.candidates,
                refusals: sessionState.refusals
            },
            telemetry: sessionState.telemetry || {}
        };

        const canonicalPayload = JSON.stringify(payload);
        const signature = crypto
            .createHmac('sha256', 'SOVEREIGN_ROOT_KEY_2026')
            .update(canonicalPayload)
            .digest('hex');

        return {
            ...payload,
            signature,
            fingerprint: crypto.createHash('sha256').update(canonicalPayload).digest('hex')
        };
    }
};

module.exports = AuditChain;
