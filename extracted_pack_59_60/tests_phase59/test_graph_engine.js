const assert = require('assert')

function testGraphCreation() {
  const graph = {nodes:[],edges:[]}
  graph.nodes.push("bundle1")
  assert(graph.nodes.length === 1)
}

module.exports = { testGraphCreation }
