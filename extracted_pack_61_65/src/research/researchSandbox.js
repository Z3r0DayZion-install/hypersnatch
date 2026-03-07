class ResearchSandbox {

  runExperiment(experimentFn, context) {
    try {
      return experimentFn(context)
    } catch(e) {
      return {error:e.message}
    }
  }

}

module.exports = ResearchSandbox
