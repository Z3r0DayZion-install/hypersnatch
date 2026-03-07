class PolicyEngine {
  evaluate(context = {}, rules = []) {
    const decisions = []

    rules.forEach(rule => {
      if (rule.field && context[rule.field] === rule.equals) {
        decisions.push({
          policy: rule.name,
          action: rule.action,
          reasons: [rule.reason || "matched policy"]
        })
      }
    })

    return decisions
  }
}

module.exports = PolicyEngine
