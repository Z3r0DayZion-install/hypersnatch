class ReplayMutationEngine {

  mutateManifest(manifest, options) {
    if(options.replaceHost) {
      manifest.host = options.replaceHost
    }
    return manifest
  }

}

module.exports = ReplayMutationEngine
