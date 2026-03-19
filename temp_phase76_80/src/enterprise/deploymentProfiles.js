class DeploymentProfiles {
  constructor() {
    this.profiles = {
      sovereign_airgap: { remote_exchange: false, plugins: "restricted", network: "disabled" },
      enterprise_offline: { remote_exchange: "manual_only", plugins: "approved_only", network: "disabled" },
      research_lab: { remote_exchange: "manual_only", plugins: "sandboxed", network: "limited" }
    }
  }

  getProfile(name) {
    return this.profiles[name] || null
  }
}

module.exports = DeploymentProfiles
