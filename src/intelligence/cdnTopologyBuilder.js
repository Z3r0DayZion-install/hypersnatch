/**
 * HyperSnatch Intelligence: CDN Topology Builder
 * Aggregates hostnames and origins into a topological model.
 */

module.exports = {
    name: "CDN Topology Builder",
    description: "Maps the content distribution network nodes and origins.",

    analyze(bundle) {
        const results = {
            nodes: [],
            origins: [],
            relationships: []
        };

        const har = bundle.evidence ? bundle.evidence.network_har : null;
        if (!har || !har.log || !har.log.entries) return { artifact: "cdn_topology.json", data: results };

        const hostMap = new Map();
        har.log.entries.forEach(entry => {
            try {
                const url = new URL(entry.request.url);
                hostMap.set(url.hostname, (hostMap.get(url.hostname) || 0) + 1);
            } catch (e) { }
        });

        results.nodes = Array.from(hostMap.entries()).map(([host, count]) => ({
            hostname: host,
            requestCount: count
        }));

        return {
            artifact: "cdn_topology.json",
            data: results
        }
    }
}
