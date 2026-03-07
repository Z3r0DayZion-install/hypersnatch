class PredictiveAnomaly {

  predict(patternHistory){
    if(patternHistory.length > 3){
      return {risk:"elevated", reason:"pattern repetition"}
    }
    return {risk:"normal"}
  }

}

module.exports = PredictiveAnomaly
