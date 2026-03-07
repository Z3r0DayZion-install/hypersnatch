class IntelligenceGraph {
  constructor() {
    this.nodes = new Map()
    this.edges = []
  }

  addNode(type, id, data={}) {
    this.nodes.set(id, {type, data})
  }

  addEdge(source, target, relation) {
    this.edges.push({source, target, relation})
  }

  getNode(id) {
    return this.nodes.get(id)
  }

  getEdgesForNode(id) {
    return this.edges.filter(e => e.source === id || e.target === id)
  }
}

module.exports = IntelligenceGraph
