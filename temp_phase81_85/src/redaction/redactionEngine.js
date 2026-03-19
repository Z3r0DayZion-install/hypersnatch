class RedactionEngine {

  redact(text){
    return text
      .replace(/token=[A-Za-z0-9]+/g,"token=[REDACTED]")
      .replace(/https?:\/\/[^ ]+/g,"[URL_REDACTED]")
  }

}

module.exports = RedactionEngine
