/**
 * Verification script for SmartDecode 2.0 Resurrection Layer
 */

const SmartDecode = require('../src/core/smartdecode/index');

const mockEmloadHtml = `
<html>
<head><title>Emload Download</title></head>
<body>
    <div id="content">
        <h1>344VIP2955309137.mp4</h1>
        <p>File size: 1.2 GB</p>
        <script>
            var stream_url = "https://cdn.emload.com/stream/SEdNZUZ3aFlIamdpOTF2bk9XdHRjUT09/344VIP2955309137.mp4";
            var some_other_var = "random";
        </script>
        <a href="https://www.emload.com/v2/file/SEdNZUZ3aFlIamdpOTF2bk9XdHRjUT09/344VIP2955309137.mp4">Landing Page</a>
    </div>
</body>
</html>
`;

console.log('--- Testing Emload Resurrection ---');
const result = SmartDecode.run(mockEmloadHtml);

console.log('Candidates found:', result.candidates.length);
result.candidates.forEach((c, i) => {
    console.log(`[${i}] URL: ${c.url}`);
    console.log(`    Layer: ${c.sourceLayer}`);
    console.log(`    Confidence: ${(c.confidence * 100).toFixed(0)}%`);
});

const best = result.best;
if (best) {
    console.log('\n🌟 BEST CANDIDATE:');
    console.log(`URL: ${best.url}`);
    console.log(`Layer: ${best.sourceLayer}`);
} else {
    console.log('\n❌ No best candidate found.');
}

// Check if resurrection worked
const hasResurrected = result.candidates.some(c => c.sourceLayer.includes('resurrection'));
if (hasResurrected) {
    console.log('\n✅ Verification PASSED: Resurrection layer successfully extracted the direct link.');
} else {
    console.log('\n❌ Verification FAILED: Resurrection layer did not trigger.');
    process.exit(1);
}
