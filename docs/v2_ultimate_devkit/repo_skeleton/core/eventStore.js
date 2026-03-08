
class EventStore {
  constructor(){ this.events=[] }
  append(e){ this.events.push(e) }
  getAll(){ return this.events }
}
module.exports = EventStore
