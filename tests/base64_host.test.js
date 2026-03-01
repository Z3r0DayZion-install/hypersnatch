const assert = require('assert');
const SmartDecode = require('../src/core/smartdecode/index');

async function test() {
    console.log("Running Base64 + Host Decoder Test...");
    
    // https://kshared.com/file/a23b9bbf/leaked_documents.pdf
    const b64 = "aHR0cHM6Ly9rc2hhcmVkLmNvbS9maWxlL2EyM2I5YmJmL2xlYWtlZF9kb2N1bWVudHMucGRm";
    const html = `<script>var data = "${b64}";</script>`;

    const result = await SmartDecode.run(html, { engine: 'js' });
    
    const ksharedFound = result.candidates.some(c => c.url.includes('kshared.com'));
    
    console.log(`- Kshared found: ${ksharedFound}`);
    
    assert.ok(ksharedFound, "Should have found kshared link inside base64 even with .pdf extension");
    
    console.log("✅ Test Passed!");
}

test().catch(err => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
});
