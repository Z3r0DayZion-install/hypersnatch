/**
 * Builds a Segment Waterfall visualization model from the timeline.
 * Groups contiguous media segment downloads (.ts, .m4s, etc) into sequential blocks.
 */
function buildWaterfall(timelineEvents) {
    let waterfall = {
        totalSegments: 0,
        clusters: []
    };

    if (!timelineEvents || !Array.isArray(timelineEvents)) return waterfall;

    // Filter only to segment downloads
    const segments = timelineEvents.filter(e => e.classification === 'segment' || e.url.includes('.ts') || e.url.includes('.m4s'));
    waterfall.totalSegments = segments.length;

    let currentCluster = null;

    segments.forEach((seg, idx) => {
        // Simple heuristic: Cluster by same host and primary tenant/routing path
        const urlObj = new URL(seg.url);
        const pathSegments = urlObj.pathname.split('/').filter(p => p.length > 0);
        // Take the first segment as the base path (e.g. 'x36xhzz' from '/x36xhzz/url_2/...')
        const basePath = pathSegments.length > 0 ? '/' + pathSegments[0] : '/';

        if (!currentCluster || currentCluster.basePath !== basePath || currentCluster.host !== urlObj.host) {
            if (currentCluster) {
                waterfall.clusters.push(currentCluster);
            }
            currentCluster = {
                clusterId: `cluster_${waterfall.clusters.length}`,
                basePath: basePath,
                host: urlObj.host,
                segmentCount: 1,
                firstSegment: seg.url,
                lastSegment: seg.url
            };
        } else {
            currentCluster.segmentCount++;
            currentCluster.lastSegment = seg.url;
        }
    });

    if (currentCluster) {
        waterfall.clusters.push(currentCluster);
    }

    return waterfall;
}

module.exports = buildWaterfall;
