class PatternDiscoveryEngine {

  discover(bundles) {
    const patterns = {}
    bundles.forEach(b => {
      const key = `${b.cdn}_${b.playerSignature}_${b.protocol}`
      if(!patterns[key]) patterns[key] = []
      patterns[key].push(b.id)
    })
    return patterns
  }

}

module.exports = PatternDiscoveryEngine
