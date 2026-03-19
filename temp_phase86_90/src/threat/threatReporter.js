class ThreatReporter {

  generate(findings){
    return {
      threat_level:"moderate",
      summary:"Automated threat intelligence summary",
      findings
    }
  }

}

module.exports = ThreatReporter
