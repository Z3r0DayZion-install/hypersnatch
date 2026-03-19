const assert = require("assert")

function testAuditLog() {
  const log = []
  log.push({event:"decode"})
  assert(log.length === 1)
}

module.exports = { testAuditLog }
