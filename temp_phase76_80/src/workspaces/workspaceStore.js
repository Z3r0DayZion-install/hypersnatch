class WorkspaceStore {
  constructor() {
    this.workspaces = []
  }

  createWorkspace(name, options = {}) {
    const ws = {
      id: "ws-" + Date.now(),
      name,
      created_at: new Date().toISOString(),
      settings: options,
      cases: []
    }
    this.workspaces.push(ws)
    return ws
  }

  list() {
    return this.workspaces
  }
}

module.exports = WorkspaceStore
