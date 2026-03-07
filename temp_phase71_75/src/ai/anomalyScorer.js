class AnomalyScorer {
  score(observation = {}) {
    let score = 0
    const reasons = []

    if (observation.token_ttl_seconds !== undefined && observation.token_ttl_seconds < 60) {
      score += 35
      reasons.push("token_ttl_below_60")
    }
    if (observation.topology_rarity !== undefined && observation.topology_rarity > 0.8) {
      score += 30
      reasons.push("rare_topology")
    }
    if (observation.mutation_divergence !== undefined && observation.mutation_divergence > 0.7) {
      score += 25
      reasons.push("high_mutation_divergence")
    }

    return {
      anomaly_score: score,
      reasons,
      severity: score >= 70 ? "high" : score >= 40 ? "medium" : "low"
    }
  }
}

module.exports = AnomalyScorer
