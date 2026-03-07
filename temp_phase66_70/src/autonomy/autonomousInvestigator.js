class AutonomousInvestigator {

  run(bundle, engines) {

    const patterns = engines.patternDiscovery.discover([bundle])
    const insights = engines.insightGenerator.generate(patterns)

    return {
      patterns,
      insights
    }
  }

}

module.exports = AutonomousInvestigator
