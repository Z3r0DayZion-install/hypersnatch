class GlobalGraph {
  constructor() {
    this.nodes = new Map()
    this.edges = []
  }

  addNode(id, type, data = {}) {
    this.nodes.set(id, { id, type, data })
  }

  addEdge(source, target, relation, data = {}) {
    this.edges.push({ source, target, relation, data })
  }

  summary() {
    return {
      node_count: this.nodes.size,
      edge_count: this.edges.length
    }
  }
}

module.exports = GlobalGraph
