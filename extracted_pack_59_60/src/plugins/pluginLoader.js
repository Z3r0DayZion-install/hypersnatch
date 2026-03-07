const fs = require('fs')

function loadPlugin(path) {
  const manifest = JSON.parse(fs.readFileSync(path+'/plugin_manifest.json'))
  const plugin = require(path+'/'+manifest.entry)
  return {manifest,plugin}
}

module.exports = { loadPlugin }
