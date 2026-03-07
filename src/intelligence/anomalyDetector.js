/**
 * AnomalyDetector.js (Phase 66)
 * Detects anomalous bundles that deviate from discovered infrastructure patterns.
 */
class AnomalyDetector {
    constructor() {
        this.anomalies = [];
    }

    /**
     * Detect anomalies by comparing bundles against discovered patterns.
     * A bundle is anomalous if its infrastructure combination appears only once (singleton).
     */
    detect(bundles, patterns) {
        this.anomalies = [];
        const patternKeys = new Set(
            patterns.filter(p => p.frequency >= 2).map(p => p.key)
        );

        bundles.forEach(b => {
            const cdn = (b.cdn || 'UNKNOWN').toUpperCase();
            const player = (b.playerSignature || 'UNKNOWN').toUpperCase();
            const protocol = (b.protocol || 'UNKNOWN').toUpperCase();
            const key = `${cdn}::${player}::${protocol}`;

            if (!patternKeys.has(key)) {
                this.anomalies.push({
                    bundleId: b.path || b.id || 'unknown',
                    key,
                    cdn, player, protocol,
                    reason: 'SINGLETON_PATTERN',
                    severity: this._calculateSeverity(b, patterns),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Check for mixed-CDN anomalies within same case
        const cdnBuckets = {};
        bundles.forEach(b => {
            const cdn = (b.cdn || 'UNKNOWN').toUpperCase();
            if (!cdnBuckets[cdn]) cdnBuckets[cdn] = 0;
            cdnBuckets[cdn]++;
        });

        const cdnCount = Object.keys(cdnBuckets).filter(k => k !== 'UNKNOWN').length;
        if (cdnCount > 2) {
            this.anomalies.push({
                bundleId: 'CASE_LEVEL',
                key: 'MULTI_CDN',
                reason: 'EXCESSIVE_CDN_DIVERSITY',
                severity: 'MEDIUM',
                detail: `${cdnCount} distinct CDNs detected across ${bundles.length} bundles`,
                timestamp: new Date().toISOString()
            });
        }

        return this.anomalies;
    }

    _calculateSeverity(bundle, patterns) {
        // Higher severity if the bundle's components don't match ANY known pattern partially
        const knownCdns = new Set(patterns.map(p => p.cdn));
        const knownProtos = new Set(patterns.map(p => p.protocol));
        const cdn = (bundle.cdn || 'UNKNOWN').toUpperCase();
        const proto = (bundle.protocol || 'UNKNOWN').toUpperCase();

        if (!knownCdns.has(cdn) && !knownProtos.has(proto)) return 'HIGH';
        if (!knownCdns.has(cdn) || !knownProtos.has(proto)) return 'MEDIUM';
        return 'LOW';
    }

    getAnomalies() {
        return this.anomalies;
    }

    getStats() {
        return {
            totalAnomalies: this.anomalies.length,
            high: this.anomalies.filter(a => a.severity === 'HIGH').length,
            medium: this.anomalies.filter(a => a.severity === 'MEDIUM').length,
            low: this.anomalies.filter(a => a.severity === 'LOW').length
        };
    }
}

module.exports = AnomalyDetector;
