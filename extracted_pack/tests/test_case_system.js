const assert = require("assert")

function testCreateCase() {
  const caseObj = {
    id: "case-1",
    bundles: []
  }

  assert(caseObj.id === "case-1")
}

module.exports = { testCreateCase }
