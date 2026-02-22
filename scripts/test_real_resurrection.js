/**
 * test_real_resurrection.js
 * Direct verification of resurrection engine on user provided links.
 * Run: node scripts/test_real_resurrection.js
 */

const KsharedExtractor = require('../src/core/smartdecode/hosts/kshared');
const EmloadExtractor = require('../src/core/smartdecode/hosts/emload');

const links = [
    'https://www.kshared.com/file/2e3l4YoD34',
    'https://www.kshared.com/file/4aqDvOD7Lk',
    'https://www.emload.com/v2/file/L2QzYzEyWUtxZzUzV2dzUGw5Y296Zz09/pss.txt'
];

function testLink(url) {
    console.log('\n' + '='.repeat(60));
    console.log('INPUT:  ', url);

    // Determine extractor
    const isKshared = url.includes('kshared.com');
    const isEmload = url.includes('emload.com');
    const extractor = isKshared ? KsharedExtractor : isEmload ? EmloadExtractor : null;

    if (!extractor) {
        console.log('RESULT: No extractor found for this host.');
        return;
    }

    // Step 1: Extract the landing page candidate
    const extracted = extractor.extract(url);
    if (!extracted || extracted.length === 0) {
        console.log('RESULT: Extractor found no candidates from URL.');
        return;
    }

    const landing = extracted[0];
    console.log('LANDING:');
    console.log('  URL:       ', landing.url);
    console.log('  fileId:    ', landing.fileId);
    console.log('  filename:  ', landing.filename);
    console.log('  confidence:', landing.confidence);

    // Step 2: Resurrect a direct CDN link (pass empty HTML — uses heuristic path)
    const resurrected = extractor.resurrect('', landing);
    if (!resurrected || resurrected.length === 0) {
        console.log('RESURRECTED: No direct links produced.');
        return;
    }

    console.log('\nRESURRECTED DIRECT LINKS:');
    resurrected.forEach((c, i) => {
        console.log(`  [${i + 1}] ${c.url}`);
        console.log(`      method: ${c.sourceLayer}  confidence: ${c.confidence}`);
    });

    // Best candidate
    const best = resurrected[0];
    console.log('\nBEST CANDIDATE:');
    console.log('  URL:    ', best.url);
    console.log('  Method: ', best.sourceLayer);
    console.log('  Status: ', best.confidence >= 0.85 ? 'VALIDATED ✅' : 'LOW CONFIDENCE ⚠️');
}

console.log('HyperSnatch Resurrection Verification');
console.log('Testing', links.length, 'real-world landing page URLs...');

links.forEach(testLink);

console.log('\n' + '='.repeat(60));
console.log('All tests complete.');
