/**
 * Sovereign Audit Chain
 * Creates tamper-proof .tear bundles for forensic verification.
 */

"use strict";

const crypto = require('crypto');

const AuditChain = {
    /**
     * Calculates a deterministic Merkle root for evidence items.
     * @param {Array} items 
     * @returns {string} Hash root
     */
    calculateMerkleRoot(items) {
        if (!items || items.length === 0) return crypto.createHash('sha256').update('empty').digest('hex');

        // Deterministic sort by URL to ensure stable root
        const sorted = [...items].sort((a, b) => (a.url || "").localeCompare(b.url || ""));
        const hashes = sorted.map(item =>
            crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex')
        );

        // Simple binary merge (Iterative)
        let currentLevel = hashes;
        while (currentLevel.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = currentLevel[i + 1] || left; // Duplicate last if odd
                nextLevel.push(crypto.createHash('sha256').update(left + right).digest('hex'));
            }
            currentLevel = nextLevel;
        }

        return currentLevel[0];
    },

    /**
     * Generates a signed analysis bundle with session-based Forward Secrecy.
     * @param {Object} sessionState - current candidates, refusals, and telemetry
     * @param {Object} systemInfo - build ID and engine version
     * @returns {Object} Signed .tear manifest
     */
    async signSession(sessionState, systemInfo) {
        const timestamp = new Date().toISOString();
        const sessionId = crypto.randomUUID();

        const candidates = sessionState.candidates || [];
        const refusals = sessionState.refusals || [];
        const merkleRoot = this.calculateMerkleRoot([...candidates, ...refusals]);

        const payload = {
            header: {
                format: "TEAR-AUDIT-CHAIN",
                version: "3.2.0",
                sessionId,
                timestamp,
                buildId: systemInfo.buildId,
                engineVersion: systemInfo.engineVersion,
                merkleRoot
            },
            evidence: {
                candidates,
                refusals,
                rootHash: merkleRoot
            },
            telemetry: sessionState.telemetry || {}
        };

        const canonicalPayload = JSON.stringify(payload);

        // --- Forward Secrecy (PFS) Implementation ---
        // We derive a temporary session key from the Root Key + Session ID
        // This ensures if one session is compromised, others remain secure.
        const rootKey = 'SOVEREIGN_ROOT_KEY_2026';
        const sessionKey = crypto.createHmac('sha256', rootKey)
            .update(sessionId)
            .digest();

        const signature = crypto
            .createHmac('sha256', sessionKey)
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
