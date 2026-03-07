class ForensicSimulator {

  simulate(bundle){
    return {
      result:"simulation_complete",
      tested:bundle.id
    }
  }

}

module.exports = ForensicSimulator
