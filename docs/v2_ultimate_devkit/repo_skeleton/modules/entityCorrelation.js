
class EntityCorrelation {
  correlate(events){
    const map = new Map()
    for(const e of events){
      if(!map.has(e.entity)) map.set(e.entity,[])
      map.get(e.entity).push(e)
    }
    return map
  }
}
module.exports = EntityCorrelation
