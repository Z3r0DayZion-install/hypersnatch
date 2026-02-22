/**
 * Verification script for SmartDecode 2.0 Generic Resurrection
 */

const SmartDecode = require('../src/core/smartdecode/index');

const mockTurbobitHtml = `
<html>
<head><title>Turbobit Download</title></head>
<body>
    <div class="download-section">
        <p>File: turbobit_file.zip</p>
        <script>
            // Generic pattern match: file: "..." or link: "..."
            var download_config = {
                file: "https://turbobit.net/download/file/abcd12345efg.zip",
                preview: false
            };
        </script>
        <a href="https://turbobit.net/abcd12345efg.html">Landing Page</a>
    </div>
</body>
</html>
`;

console.log('--- Testing Generic Resurrection (Turbobit) ---');
const result = SmartDecode.run(mockTurbobitHtml);

console.log('Candidates found:', result.candidates.length);
result.candidates.forEach((c, i) => {
    console.log(`[${i}] URL: ${c.url}`);
    console.log(`    Layer: ${c.sourceLayer}`);
    console.log(`    Confidence: ${(c.confidence * 100).toFixed(0)}%`);
});

const hasGenericResurrection = result.candidates.some(c => c.sourceLayer.includes('resurrection_generic'));

if (hasGenericResurrection) {
    console.log('\n✅ Verification PASSED: Generic resurrection found the direct link.');
} else {
    console.log('\n❌ Verification FAILED: Generic resurrection did not trigger.');
    process.exit(1);
}
