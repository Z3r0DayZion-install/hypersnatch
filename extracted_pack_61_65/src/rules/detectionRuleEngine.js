class DetectionRuleEngine {

  evaluate(bundle, rules) {
    const findings = []
    rules.forEach(rule => {
      if(bundle.protocol === rule.protocol) {
        findings.push(rule.name)
      }
    })
    return findings
  }

}

module.exports = DetectionRuleEngine
