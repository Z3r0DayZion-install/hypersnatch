class CaseIntelligenceAssistant {

  suggestSimilar(bundle, graph) {
    return graph.getEdgesForNode(bundle.id)
  }

}

module.exports = CaseIntelligenceAssistant
