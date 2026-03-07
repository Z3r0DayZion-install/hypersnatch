class TrustRegistry {
  constructor() {
    this.sources = []
  }

  addSource(source) {
    this.sources.push(source)
    return source
  }

  findByFingerprint(fp) {
    return this.sources.find(s => s.fingerprint === fp)
  }
}

module.exports = TrustRegistry
