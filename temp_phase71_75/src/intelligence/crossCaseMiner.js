class CrossCaseMiner {
  mine(cases = []) {
    const shared = {}
    cases.forEach(c => {
      (c.bundles || []).forEach(b => {
        const key = `${b.cdn || "unknown"}_${b.player || "unknown"}_${b.protocol || "unknown"}`
        if (!shared[key]) shared[key] = []
        shared[key].push({case_id: c.id, bundle_id: b.id})
      })
    })
    return shared
  }
}

module.exports = CrossCaseMiner
