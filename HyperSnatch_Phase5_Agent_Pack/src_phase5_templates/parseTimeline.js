export function parseTimeline(har){
 return har.requests.map((r,i)=>({
   index:i,
   url:r.url,
   status:r.status,
   classification:r.classification
 }));
}
