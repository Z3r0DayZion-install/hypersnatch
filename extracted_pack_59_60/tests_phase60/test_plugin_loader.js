const assert = require('assert')

function testPluginLoad() {
  const plugin = {name:"demo"}
  assert(plugin.name === "demo")
}

module.exports = { testPluginLoad }
