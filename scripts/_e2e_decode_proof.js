/**
 * END-TO-END DECODE PROOF
 * Simulates: paste HTML → SmartDecode → get download URLs
 */
const path = require('path');
const SmartDecode = require(path.join(__dirname, '..', 'src', 'core', 'smartdecode', 'index'));
const fixtures = require(path.join(__dirname, '..', 'fixtures', 'html', 'emload', 'emload_fixtures'));

(async () => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  E2E DECODE PROOF — Real HTML → Real Download URLs');
    console.log('═══════════════════════════════════════════════════\n');

    // Test 1: Simple Emload page with video source
    const html1 = `<html><head><title>Watch Movie - Emload</title></head>
<body>
<div id="player">
  <video id="main-video" controls>
    <source src="https://cdn3.emload.com/stream/abc123def/movie_1080p.mp4" type="video/mp4">
    <source src="https://cdn3.emload.com/stream/abc123def/movie_720p.mp4" type="video/mp4">
  </video>
</div>
<script>var backup = "https://cdn3.emload.com/dl/abc123def/movie_backup.mp4";</script>
</body></html>`;

    console.log('TEST 1: Emload page with <video> sources + JS backup');
    console.log('─'.repeat(50));
    const r1 = await SmartDecode.run(html1);
    if (r1.candidates && r1.candidates.length > 0) {
        r1.candidates.forEach((c, i) => {
            console.log(`  ✅ #${i + 1} [${c.type || 'unknown'}] ${c.url}`);
            console.log(`     Score: ${(c.finalScore || c.confidence || 0).toFixed(3)} | Layer: ${c.sourceLayer || 'direct'}`);
        });
        console.log(`  🏆 BEST: ${r1.best?.url || 'none'}`);
    } else {
        console.log('  ❌ No candidates found');
    }

    // Test 2: Obfuscated page with base64-encoded URL
    const realUrl = 'https://cdn.kshared.com/dl/video123/premium_file.mp4';
    const encoded = Buffer.from(realUrl).toString('base64');
    const html2 = `<html><body>
<script>
var config = { stream: "${encoded}" };
var playerData = '{"sources":[{"file":"https://delivery.rapidgator.net/download/abc789/archive.zip"}]}';
</script>
</body></html>`;

    console.log('\nTEST 2: Base64-encoded URL + JSON-buried link');
    console.log('─'.repeat(50));
    const r2 = await SmartDecode.run(html2);
    if (r2.candidates && r2.candidates.length > 0) {
        r2.candidates.forEach((c, i) => {
            console.log(`  ✅ #${i + 1} [${c.type || 'unknown'}] ${c.url}`);
            console.log(`     Score: ${(c.finalScore || c.confidence || 0).toFixed(3)} | Layer: ${c.sourceLayer || 'direct'}`);
        });
        console.log(`  🏆 BEST: ${r2.best?.url || 'none'}`);
    } else {
        console.log('  ❌ No candidates found');
    }

    // Test 3: Fixture-based - multi-source Emload with 3 qualities
    const fixture = fixtures.find(f => f.id === 6);
    console.log(`\nTEST 3: Fixture "${fixture.name}" — ${fixture.description}`);
    console.log('─'.repeat(50));
    const r3 = await SmartDecode.run(fixture.html);
    if (r3.candidates && r3.candidates.length > 0) {
        r3.candidates.forEach((c, i) => {
            console.log(`  ✅ #${i + 1} [${c.type || 'unknown'}] ${c.url}`);
        });
        console.log(`  🏆 BEST: ${r3.best?.url || 'none'}`);
        const foundUrls = r3.candidates.map(c => c.url);
        const allExpected = fixture.expectedUrls.every(u => foundUrls.includes(u));
        console.log(`  ${allExpected ? '✅' : '❌'} All ${fixture.expectedUrls.length} expected URLs found: ${allExpected}`);
    } else {
        console.log('  ❌ No candidates found');
    }

    // Test 4: Auth boundary — should REFUSE signed/premium URLs
    const html4 = `<html><body>
<a href="https://premium.emload.com/stream/abc?token=xyz123&expires=9999999999&sig=deadbeef">Premium Download</a>
<div>Please upgrade to premium to download this file</div>
</body></html>`;

    console.log('\nTEST 4: Auth boundary — should REFUSE premium-gated content');
    console.log('─'.repeat(50));
    const r4 = await SmartDecode.run(html4);
    const hasRefusals = r4.refusals && r4.refusals.length > 0;
    console.log(`  ${hasRefusals ? '✅' : '⚠️'} Refusals detected: ${r4.refusals?.length || 0}`);
    if (r4.refusals) {
        r4.refusals.forEach(ref => {
            console.log(`     🚫 ${ref.reason || ref.type || 'refused'}: ${(ref.url || '').substring(0, 60)}...`);
        });
    }
    const r4Cands = r4.candidates?.length || 0;
    console.log(`  Candidates passed through: ${r4Cands}`);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Test 1 (video sources):  ${r1.candidates?.length > 0 ? '✅ PASS' : '❌ FAIL'} — ${r1.candidates?.length || 0} URLs extracted`);
    console.log(`  Test 2 (base64+JSON):    ${r2.candidates?.length > 0 ? '✅ PASS' : '❌ FAIL'} — ${r2.candidates?.length || 0} URLs extracted`);
    console.log(`  Test 3 (fixture multi):  ${r3.candidates?.length > 0 ? '✅ PASS' : '❌ FAIL'} — ${r3.candidates?.length || 0} URLs extracted`);
    console.log(`  Test 4 (auth boundary):  ${hasRefusals ? '✅ PASS' : '⚠️ WARN'} — ${r4.refusals?.length || 0} refused`);
    console.log();
})();
