/**
 * TrustRegistry.js (Phase 77)
 * Explicit, signed federation with trust source management, exchange receipts, and audit trails.
 * No silent sync — all exchange is explicit and auditable.
 */
class TrustRegistry {
    constructor() {
        this.sources = new Map();
        this.exchangeLog = [];
    }

    addSource(source) {
        const record = {
            id: source.id || `trust_${Date.now()}`,
            name: source.name,
            fingerprint: source.fingerprint,
            publicKey: source.publicKey || null,
            addedAt: new Date().toISOString(),
            trustLevel: source.trustLevel || 'pending',
            verified: false
        };
        this.sources.set(record.id, record);
        return record;
    }

    findByFingerprint(fp) {
        return Array.from(this.sources.values()).find(s => s.fingerprint === fp) || null;
    }

    verifySource(sourceId) {
        const src = this.sources.get(sourceId);
        if (src) {
            src.verified = true;
            src.trustLevel = 'verified';
            src.verifiedAt = new Date().toISOString();
        }
        return src;
    }

    logExchange(exchangeData) {
        const receipt = {
            id: `exch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            sourceId: exchangeData.sourceId,
            direction: exchangeData.direction || 'import',
            bundleCount: exchangeData.bundleCount || 0,
            timestamp: new Date().toISOString(),
            verified: exchangeData.verified || false,
            signatureValid: exchangeData.signatureValid || false,
            auditReason: exchangeData.reason || 'explicit_exchange'
        };
        this.exchangeLog.push(receipt);
        return receipt;
    }

    getExchangeAudit() {
        return this.exchangeLog;
    }

    listSources() {
        return Array.from(this.sources.values());
    }

    getStats() {
        const sources = Array.from(this.sources.values());
        return {
            totalSources: sources.length,
            verified: sources.filter(s => s.verified).length,
            pending: sources.filter(s => s.trustLevel === 'pending').length,
            totalExchanges: this.exchangeLog.length
        };
    }
}

module.exports = TrustRegistry;
