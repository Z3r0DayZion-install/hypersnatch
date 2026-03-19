/**
 * Scans candidate URLs for common DRM, Edge, or Session token patterns.
 */
function detectTokenPatterns(candidates) {
    let tokens = {
        detected: false,
        tokenTypes: [],
        sampleParameters: []
    };

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
        return tokens;
    }

    // Common query parameters used for video authorization & DRM
    const tokenSignatures = {
        'hdnts': 'Akamai Edge Authorization',
        'token': 'Generic Session Token',
        'sig': 'Signature Hash',
        'Policy': 'AWS CloudFront Policy',
        'Key-Pair-Id': 'AWS CloudFront Key',
        'Signature': 'AWS CloudFront Signature',
        'auth_token': 'Generic Auth Token',
        'ttl': 'Time-To-Live Parameter'
    };

    let foundTypes = new Set();
    let foundParams = new Set();

    candidates.forEach(candidate => {
        try {
            const urlObj = new URL(candidate.url);
            for (const [key, value] of urlObj.searchParams) {
                if (tokenSignatures[key]) {
                    foundTypes.add(tokenSignatures[key]);
                    // Store a redacted sample parameter for evidence
                    const redactedValue = value.length > 8 ? value.substring(0, 4) + '...' + value.substring(value.length - 4) : value;
                    foundParams.add(`${key}=${redactedValue}`);
                }
            }
        } catch (err) { }
    });

    if (foundTypes.size > 0) {
        tokens.detected = true;
        tokens.tokenTypes = Array.from(foundTypes);
        tokens.sampleParameters = Array.from(foundParams);
    }

    return tokens;
}

module.exports = detectTokenPatterns;
