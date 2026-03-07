/**
 * HyperSnatch Intelligence: Site Fingerprint
 * Analyzes network artifacts to classify infrastructure.
 */

module.exports = {
    name: "Site Fingerprint",
    description: "Classifies the target infrastructure and deployment stack.",

    analyze(bundle) {
        const results = {
            classification: "unknown",
            confidence: 0,
            indicators: []
        };

        const har = bundle.evidence ? bundle.evidence.network_har : null;
        if (!har || !har.log || !har.log.entries) return { artifact: "site_profile.json", data: results };

        const entries = har.log.entries;

        // Simple heuristic for CMS detection
        const urlString = JSON.stringify(entries.map(e => e.request.url));
        if (urlString.includes("wp-content")) {
            results.classification = "WordPress";
            results.confidence = 0.95;
            results.indicators.push("wp-content path detected");
        } else if (urlString.includes("_next/static")) {
            results.classification = "Next.js";
            results.confidence = 0.9;
            results.indicators.push("Next.js static assets detected");
        }

        return {
            artifact: "site_profile.json",
            data: results
        }
    }
}
