class FingerprintLibrary {
  constructor() {
    this.entries = []
  }

  add(entry) {
    this.entries.push(entry)
    return entry
  }

  findByLabel(label) {
    return this.entries.filter(e => e.label === label)
  }

  findSimilar(features = {}) {
    return this.entries.filter(e => {
      return Object.keys(features).every(key => e[key] === features[key])
    })
  }
}

module.exports = FingerprintLibrary
