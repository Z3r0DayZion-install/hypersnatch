class TimelineEngine {

  reconstruct(events){
    return events.sort((a,b)=>a.ts-b.ts)
  }

}

module.exports = TimelineEngine
