class FindingsRegistry {

  addFinding(caseObj, finding) {
    caseObj.findings.push({
      id: "finding-" + Date.now(),
      bundle_id: finding.bundle_id,
      title: finding.title,
      severity: finding.severity,
      tags: finding.tags || [],
      notes: finding.notes || ""
    })
  }

}

module.exports = FindingsRegistry
