/**
 * HyperSnatch Elite Licensing Module
 * ECDSA-based license verification with hardware-bound keys.
 */

"use strict";

const Licensing = {
    // Public key for verifying licenses (embedded in build)
    // This matches the private key used by the license issuer
    issuerKey: null,

    // Current active license
    license: null,

    /**
     * Initialize licensing with issuer public key
     */
    async init(publicKeyJwk) {
        try {
            this.issuerKey = await crypto.subtle.importKey(
                'jwk',
                publicKeyJwk,
                { name: 'ECDSA', namedCurve: 'P-256' },
                true,
                ['verify']
            );
            console.log('🛡️ Licensing engine initialized');
        } catch (err) {
            console.error('❌ Failed to init licensing:', err);
        }
    },

    /**
     * Verify a license payload
     * @param {Object} payload { license: string, signature: string, metadata: Object }
     */
    async verifyLicense(payload) {
        if (!this.issuerKey) throw new Error('Licensing not initialized');

        try {
            const data = new TextEncoder().encode(JSON.stringify(payload.license));
            const sig = Uint8Array.from(atob(payload.signature), c => c.charCodeAt(0));

            const isValid = await crypto.subtle.verify(
                { name: 'ECDSA', hash: { name: 'SHA-256' } },
                this.issuerKey,
                sig,
                data
            );

            if (isValid) {
                this.license = payload.license;
                console.log('✅ License verified for:', this.license.user);
                return true;
            }
            return false;
        } catch (err) {
            console.error('❌ Verification error:', err);
            return false;
        }
    },

    /**
     * Check if license is bound to current hardware
     * @param {string} hwId Hardware ID (MAC or CPU hash)
     */
    isHardwareBound(hwId) {
        if (!this.license) return false;
        return this.license.hwId === hwId;
    },

    /**
     * Simple mock activation for local testing
     */
    async activateWithKey(key) {
        // In production, this would call the Hub for verification
        if (key === 'hyperfounder-2026') {
            const mockLicense = {
                user: 'Founder',
                tier: 'elite',
                expiry: '2027-01-01',
                features: ['*']
            };
            this.license = mockLicense;
            return true;
        }
        return false;
    }
};

if (typeof window !== 'undefined') {
    window.Licensing = Licensing;
}

if (typeof module !== 'undefined') {
    module.exports = Licensing;
}
