function exportDataset(bundles, type) {

  return bundles.map(b => ({
    player:b.playerSignature,
    cdn:b.cdn,
    protocol:b.protocol
  }))

}

module.exports = { exportDataset }
