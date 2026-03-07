/**
 * TopologyMapper.js (Phase 67)
 * Maps streaming delivery infrastructure into a relational graph.
 */
class TopologyMapper {
    constructor() {
        this.topologies = new Map();
    }

    /**
     * Map a single bundle's delivery infrastructure into a topology graph.
     */
    map(bundle) {
        const nodes = [];
        const edges = [];
        const bid = bundle.path || bundle.id || 'unknown';

        // Origin node
        nodes.push({ id: `origin:${bundle.origin || 'UNKNOWN'}`, type: 'ORIGIN', label: bundle.origin || 'Unknown Origin' });

        // CDN edge node
        if (bundle.cdn) {
            nodes.push({ id: `cdn:${bundle.cdn}`, type: 'CDN_EDGE', label: bundle.cdn });
            edges.push({ from: `origin:${bundle.origin || 'UNKNOWN'}`, to: `cdn:${bundle.cdn}`, relation: 'ROUTES_THROUGH' });
        }

        // Manifest endpoint
        if (bundle.manifestURL) {
            const manifestHost = this._extractHost(bundle.manifestURL);
            nodes.push({ id: `manifest:${manifestHost}`, type: 'MANIFEST_ENDPOINT', label: manifestHost });
            edges.push({ from: `cdn:${bundle.cdn || 'UNKNOWN'}`, to: `manifest:${manifestHost}`, relation: 'SERVES_MANIFEST' });
        }

        // Segment endpoint
        if (bundle.segmentHost) {
            nodes.push({ id: `segment:${bundle.segmentHost}`, type: 'SEGMENT_ENDPOINT', label: bundle.segmentHost });
            edges.push({ from: `cdn:${bundle.cdn || 'UNKNOWN'}`, to: `segment:${bundle.segmentHost}`, relation: 'DELIVERS_SEGMENTS' });
        }

        // Token service
        if (bundle.tokenService) {
            nodes.push({ id: `token:${bundle.tokenService}`, type: 'TOKEN_SERVICE', label: bundle.tokenService });
            edges.push({ from: `origin:${bundle.origin || 'UNKNOWN'}`, to: `token:${bundle.tokenService}`, relation: 'AUTHENTICATES_VIA' });
        }

        const topology = { bundleId: bid, nodes, edges, nodeCount: nodes.length, edgeCount: edges.length };
        this.topologies.set(bid, topology);
        return topology;
    }

    /**
     * Map all bundles in a case and merge into a unified topology.
     */
    mapCase(bundles) {
        const allNodes = new Map();
        const allEdges = [];

        bundles.forEach(b => {
            const topo = this.map(b);
            topo.nodes.forEach(n => allNodes.set(n.id, n));
            allEdges.push(...topo.edges);
        });

        return {
            nodes: Array.from(allNodes.values()),
            edges: allEdges,
            totalNodes: allNodes.size,
            totalEdges: allEdges.length
        };
    }

    _extractHost(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    getStats() {
        return {
            mappedBundles: this.topologies.size,
            totalTopologies: this.topologies.size
        };
    }
}

module.exports = TopologyMapper;
