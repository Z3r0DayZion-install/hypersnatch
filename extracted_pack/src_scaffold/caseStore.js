class CaseStore {
  constructor(storage) {
    this.storage = storage
  }

  createCase(title) {
    const caseObj = {
      id: "case-" + Date.now(),
      title: title,
      created: new Date().toISOString(),
      bundles: [],
      notes: [],
      findings: []
    }
    return caseObj
  }

  saveCase(caseObj) {
    return this.storage.save(caseObj.id, caseObj)
  }

  loadCase(id) {
    return this.storage.load(id)
  }
}

module.exports = CaseStore
