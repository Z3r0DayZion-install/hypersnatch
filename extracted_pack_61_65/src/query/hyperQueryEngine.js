class HyperQueryEngine {

  constructor(indexes, graph) {
    this.indexes = indexes
    this.graph = graph
  }

  execute(queryAST) {
    // simple prototype executor
    if(queryAST.type === "cdn_lookup") {
      return this.indexes.cdn[queryAST.value] || []
    }
  }

}

module.exports = HyperQueryEngine
