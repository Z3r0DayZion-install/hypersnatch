class InfraAttributionEngine {
  attribute(context = {}) {
    const reasons = []
    let provider = "unknown"
    let confidence = 0.0
    const alternatives = []

    if (context.cdn === "cloudfront" && context.token_pattern === "jwt") {
      provider = "aws_delivery_family"
      confidence = 0.84
      reasons.push("cdn=cloudfront", "token_pattern=jwt")
      alternatives.push({ provider: "generic_cloud_delivery", confidence: 0.42 })
    }

    return { provider, confidence, reasons, alternatives }
  }
}

module.exports = InfraAttributionEngine
