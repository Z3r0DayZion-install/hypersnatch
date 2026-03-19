class InsightGenerator {

  generate(patterns) {
    const insights = []
    Object.keys(patterns).forEach(k => {
      if(patterns[k].length > 3) {
        insights.push({
          pattern:k,
          message:`Pattern ${k} appears ${patterns[k].length} times`
        })
      }
    })
    return insights
  }

}

module.exports = InsightGenerator
