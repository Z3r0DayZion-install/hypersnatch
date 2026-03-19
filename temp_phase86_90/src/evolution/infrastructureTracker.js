class InfrastructureTracker {

  record(node){
    return {
      node,
      first_seen: Date.now(),
      last_seen: Date.now()
    }
  }

}

module.exports = InfrastructureTracker
