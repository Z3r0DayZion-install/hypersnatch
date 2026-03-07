const assert = require('assert')

function testPatternDiscovery() {
  const patterns = {"cloudfront_shaka_dash":[1,2,3]}
  assert(patterns["cloudfront_shaka_dash"].length === 3)
}

module.exports = { testPatternDiscovery }
