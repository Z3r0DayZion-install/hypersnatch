class TopologyMapper {

  map(bundle) {
    return {
      origin: bundle.origin,
      cdn: bundle.cdn,
      manifest: bundle.manifestURL,
      segments: bundle.segmentHost
    }
  }

}

module.exports = TopologyMapper
