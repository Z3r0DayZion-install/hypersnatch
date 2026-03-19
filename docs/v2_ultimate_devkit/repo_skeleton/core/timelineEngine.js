
class TimelineEngine {
  reconstruct(events){
    return events.sort((a,b)=>a.timestamp-b.timestamp)
  }
}
module.exports = TimelineEngine
