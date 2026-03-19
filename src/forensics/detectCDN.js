/**
 * Heuristically identifies the Content Delivery Network (CDN) based on the request hostnames.
 */
function detectCDN(timelineEvents) {
    const cdnSignatures = {
        'akamai.net': 'Akamai CDN',
        'akamaized.net': 'Akamai CDN',
        'cloudfront.net': 'AWS CloudFront',
        'fastly.net': 'Fastly',
        'fastly.com': 'Fastly',
        'edgecastcdn.net': 'Verizon Edgecast',
        'cloudflare.com': 'Cloudflare',
        'mux.dev': 'Mux Video',
        'mux.com': 'Mux Video'
    };

    let detected = {
        cdn: 'Unknown Origin',
        confidence: 0.0,
        evidenceHost: null
    };

    if (!timelineEvents || !Array.isArray(timelineEvents) || timelineEvents.length === 0) {
        return detected;
    }

    // Tally host occurrences
    let hostCounts = {};
    timelineEvents.forEach(e => {
        try {
            const host = new URL(e.url).hostname;
            hostCounts[host] = (hostCounts[host] || 0) + 1;
        } catch (err) { }
    });

    // Find the most frequently requested host (likely the primary media delivery node)
    let primaryHost = null;
    let maxCount = 0;
    for (const [host, count] of Object.entries(hostCounts)) {
        if (count > maxCount) {
            maxCount = count;
            primaryHost = host;
        }
    }

    if (!primaryHost) return detected;

    detected.evidenceHost = primaryHost;

    // Check against signatures
    for (const [sig, name] of Object.entries(cdnSignatures)) {
        if (primaryHost.includes(sig)) {
            detected.cdn = name;
            // High confidence if it's the primary host match
            detected.confidence = 0.95;
            break;
        }
    }

    return detected;
}

module.exports = detectCDN;
