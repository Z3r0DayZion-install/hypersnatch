class CentralityEngine {
  score(graph = { nodes: [], edges: [] }) {
    const degree = {}
    graph.edges.forEach(e => {
      degree[e.source] = (degree[e.source] || 0) + 1
      degree[e.target] = (degree[e.target] || 0) + 1
    })
    return Object.keys(degree).map(id => ({
      node_id: id,
      centrality: degree[id],
      metric: "degree"
    })).sort((a,b) => b.centrality - a.centrality)
  }
}

module.exports = CentralityEngine
