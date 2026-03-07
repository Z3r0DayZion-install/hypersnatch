class AdversaryFingerprintEngine {
  fingerprint(observation = {}) {
    const label = [
      observation.cdn || "unknowncdn",
      observation.protocol || "unknownproto",
      observation.token_pattern || "unknowntoken"
    ].join("_")

    return {
      label,
      confidence: 0.78,
      evidence: Object.keys(observation)
    }
  }
}

module.exports = AdversaryFingerprintEngine
