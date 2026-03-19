class ModelReporter {

  generate(caseData){
    return {
      summary: "Automated report generated",
      findings: caseData.findings || []
    }
  }

}

module.exports = ModelReporter
