const path = require('path');
const Ranker = require(path.join(__dirname, '..', 'src', 'core', 'smartdecode', 'ranker'));

const candidates = [
    { url: 'https://cdn.emload.com/stream/video_1080p.mp4', type: 'mp4', confidence: 0.5, height: 1080 },
    { url: 'https://cdn.emload.com/dl/video_720p.mp4', type: 'mp4', confidence: 0.5, height: 720 },
    { url: 'https://cdn.emload.com/stream/master.m3u8', type: 'm3u8', confidence: 0.5 },
    { url: 'https://generic.example.com/vid.mp4', type: 'mp4', confidence: 0.5 },
    { url: 'https://rapidgator.net/download/abc123.mp4', type: 'mp4', confidence: 0.5 },
    { url: 'https://cdn.emload.com/vip/premium_1080p.mp4', type: 'mp4', confidence: 0.5, height: 1080 },
    { url: 'https://cdn.emload.com/stream/video_1080p.mp4', type: 'mp4', confidence: 0.8 }, // duplicate
];

const r = Ranker.rank(candidates, { sourceTagCount: 4 });

console.log('\n=== RANKER v2.4.0 LIVE DEMO ===\n');
r.candidates.forEach((c, i) => {
    const bar = '█'.repeat(Math.round(c.finalScore * 20));
    console.log(`  #${i + 1}  ${c.finalScore.toFixed(3)}  ${bar}  ${c.url}`);
});
console.log(`\n  🏆 BEST => ${r.best.url}`);
console.log(`  Score: ${r.best.finalScore.toFixed(3)}`);
console.log(`  Deduped: 7 input → ${r.candidates.length} unique`);
console.log(`  sourceTagCount: 4 (boost: +0.08)\n`);
