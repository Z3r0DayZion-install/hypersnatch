function generateFingerprint(bundle) {
  return {
    player: bundle.playerSignature,
    protocol: bundle.protocol,
    cdn: bundle.cdn,
    token_pattern: bundle.tokenPattern,
    topology_hash: hashTopology(bundle)
  }
}

function hashTopology(bundle) {
  const data = bundle.playerSignature + bundle.protocol + bundle.cdn
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash<<5)-hash)+data.charCodeAt(i)
    hash |= 0
  }
  return hash.toString()
}

module.exports = { generateFingerprint }
