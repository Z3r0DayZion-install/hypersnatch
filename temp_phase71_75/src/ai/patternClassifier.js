class PatternClassifier {
  classify(bundleFeatures = {}) {
    const reasons = []
    let label = "UNKNOWN_PATTERN"
    let confidence = 0.0

    if (bundleFeatures.player === "shaka" && bundleFeatures.cdn === "cloudfront" && bundleFeatures.protocol === "dash") {
      label = "SHAKA_CLOUDFRONT_DASH"
      confidence = 0.92
      reasons.push("player=shaka", "cdn=cloudfront", "protocol=dash")
    }

    return {
      label,
      confidence,
      reasons,
      features_used: Object.keys(bundleFeatures)
    }
  }
}

module.exports = PatternClassifier
