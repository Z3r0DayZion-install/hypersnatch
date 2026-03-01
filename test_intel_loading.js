const SmartDecode = require('./src/core/smartdecode/index');
const fs = require('fs');
const path = require('path');

async function testIntelligence() {
    console.log("--- HyperSnatch Intelligence Logic Test ---");
    
    const testHtml = `
        <html>
            <body>
                <a href="https://evidence.org/case_123">Direct Link</a>
                <script>
                    var b64 = "aHR0cHM6Ly9raGFyZWQuY29tL2ZpbGUvYTJiY2QvcmVwb3J0LnBkZg==";
                </script>
            </body>
        </html>
    `;

    console.log("Executing SmartDecode with External Intelligence...");
    // Ensure we point to the newly written config
    const intelPath = path.join(__dirname, 'config', 'forensic_intelligence.json');
    const result = await SmartDecode.run(testHtml, { intelligencePath: intelPath });
    
    console.log(`Found ${result.candidates.length} candidates.`);
    result.candidates.forEach(c => {
        console.log(`- ${c.url} (Layer: ${c.sourceLayer}, Type: ${c.type})`);
    });

    const hasIntelLink = result.candidates.some(c => c.sourceLayer === 'intel_generic_link');
    const hasIntelHost = result.candidates.some(c => c.sourceLayer === 'base64_host_decoded'); // Host extractor takes over after base64 decode

    if (hasIntelLink) {
        console.log("✅ SUCCESS: External Intelligence Patterns applied.");
    } else {
        console.log("❌ FAILURE: External Intelligence patterns not matched.");
        process.exit(1);
    }
}

testIntelligence().catch(console.error);
