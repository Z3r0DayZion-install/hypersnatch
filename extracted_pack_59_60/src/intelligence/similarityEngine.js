function similarityScore(a,b) {
  let score = 0
  if(a.player === b.player) score += 30
  if(a.protocol === b.protocol) score += 20
  if(a.cdn === b.cdn) score += 20
  if(a.token_pattern === b.token_pattern) score += 20
  if(a.topology_hash === b.topology_hash) score += 10
  return score
}

function findSimilar(target, list) {
  return list.map(b => ({
    bundle:b,
    score: similarityScore(target,b)
  })).sort((a,b)=>b.score-a.score)
}

module.exports = { findSimilar }
