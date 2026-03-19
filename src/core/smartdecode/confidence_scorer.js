/**
 * Confidence Scorer
 * Implements the 0-100 deterministic scoring model from CONFIDENCE_SCORING.md.
 */

class ConfidenceScorer {
    /**
     * Score a candidate based on its extracted features and context.
     * @param {Object} candidate The stream candidate object (url, type, etc)
     * @param {Object} context Context containing { harAnalysis, fingerprintResult, playerConfig, streamTrace }
     * @returns {Object} Score details: { score, certaintyTier, breakdown }
     */
    score(candidate, context = {}) {
        let score = 0;
        const breakdown = [];

        const url = candidate.url || "";
        const type = candidate.type || "";

        // Parse Context
        const har = context.harAnalysis || { manifests: [], segments: [], flags: {} };
        const fp = context.fingerprintResult || { confidence: 0 };
        const configStr = (typeof context.playerConfig === 'string') ? context.playerConfig : JSON.stringify(context.playerConfig || {});
        const traces = context.streamTrace || [];

        // --- High Confidence ---

        // (+40) Explicit manifest detected in HAR 
        if (har.manifests.some(m => m.url === url || url.includes(m.url))) {
            score += 40;
            breakdown.push('+40: Explicit manifest match in HAR');
        } else if (har.manifests.length > 0 && (type === 'hls' || type === 'm3u8' || type === 'dash')) {
            // It's a manifest type, and HAR *has* manifests, but exact URL match failed. Still high confidence.
            score += 20;
            breakdown.push('+20: Manifest type with HAR presence (fuzzy match)');
        }

        // (+25) Candidate appears in player config
        if (configStr.includes(url) && url.length > 10) {
            score += 25;
            breakdown.push('+25: Candidate URL found in player config');
        }

        // (+15) Segment pattern confirmed in HAR
        if (har.flags.mseStreamDetected && har.segments.length > 0) {
            score += 15;
            breakdown.push('+15: MSE Segment pattern confirmed in HAR');
        }

        // (+10) Player fingerprint match
        if (fp.confidence >= 0.85) {
            score += 10;
            breakdown.push(`+10: High Player Fingerprint confidence (${fp.player})`);
        }

        // --- Medium Confidence ---

        // (+15) Discovered via JS Trace
        const inTrace = traces.some(t => t.url && t.url.includes(url));
        if (inTrace) {
            score += 15;
            breakdown.push('+15: Candidate discovered via JS Trace (XHR/Fetch)');
        }

        // (+10) Known media CDN pattern (heuristic)
        if (url.includes('cdn') || url.includes('video') || url.includes('media') || url.includes('stream')) {
            score += 10;
            breakdown.push('+10: Host/CDN matches standard media pattern');
        }

        // --- Penalties ---

        // (-30) Blob URL without MSE capture artifacts
        if (url.startsWith('blob:') && !har.flags.mseStreamDetected && (!context.mseBuffers || context.mseBuffers.length === 0)) {
            score -= 30;
            breakdown.push('-30: Blob URL with no MSE interception data');
        }

        // (-25) Token expired / rejected
        if (har.flags.accessTokenRejected) {
            score -= 25;
            breakdown.push('-25: Access token 401/403 rejection detected in HAR');
        }

        // (-50) DRM detected
        if (har.flags.drmDetected) {
            score -= 50;
            breakdown.push('-50: DRM/EME Key request detected in HAR');
        }

        // --- Normalize & Categorize ---
        score = Math.max(0, Math.min(100, score));

        let tier = 'Low';
        if (score >= 90) tier = 'High';
        else if (score >= 70) tier = 'Moderate';
        else if (score >= 40) tier = 'Partial';

        return {
            score,
            certaintyTier: tier,
            breakdown
        };
    }
}

module.exports = { ConfidenceScorer };
