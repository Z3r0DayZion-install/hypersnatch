class AuditLogger {

  constructor() {
    this.events = []
  }

  log(eventType, data) {
    this.events.push({
      timestamp: new Date().toISOString(),
      type: eventType,
      data: data
    })
  }

}

module.exports = AuditLogger
