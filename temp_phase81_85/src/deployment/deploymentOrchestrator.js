class DeploymentOrchestrator {

  deploy(profile){
    return {
      profile,
      status:"started",
      ts:Date.now()
    }
  }

}

module.exports = DeploymentOrchestrator
