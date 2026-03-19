/**
 * HyperSnatch Intelligence: Token Classifier
 * Rule-based classification of DRM and authentication tokens.
 */

module.exports = {
    name: "Token Classifier",
    description: "Categorizes security tokens and DRM signatures.",

    analyze(bundle) {
        const results = {
            tokens: [],
            drmType: "none",
            authScheme: "unknown"
        };

        const har = bundle.evidence ? bundle.evidence.network_har : null;
        if (!har || !har.log || !har.log.entries) return { artifact: "token_rules.json", data: results };

        const entries = har.log.entries;

        entries.forEach(entry => {
            const url = entry.request.url;
            if (url.includes("hdnts=")) {
                results.tokens.push({ type: "Akamai", value: "hdnts_token_detected" });
                results.authScheme = "Akamai HMAC";
            }
            if (url.includes("/license") || url.includes("/widevine")) {
                results.drmType = "Widevine";
            }
        });

        return {
            artifact: "token_rules.json",
            data: results
        }
    }
}
