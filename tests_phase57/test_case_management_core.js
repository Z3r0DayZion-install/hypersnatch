const CaseStore = require('../src/cases/caseStore');
const BundleAttachment = require('../src/cases/bundleAttachment');
const CaseNotes = require('../src/cases/caseNotes');
const FindingsRegistry = require('../src/cases/findingsRegistry');
const CaseComparator = require('../src/cases/caseComparator');
const fs = require('fs');
const path = require('path');

async function runTests() {
    console.log("--- Phase 57: Case Management System Test Suite ---");
    const testDir = path.join(__dirname, 'test_storage');
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });

    const store = new CaseStore(testDir);

    // 1. Case Creation
    console.log("[TEST] Case Creation...");
    const c = store.createCase("Test Investigation");
    if (c.title !== "Test Investigation") throw new Error("Case title mismatch");
    console.log("   OK: Case created with ID", c.case_id);

    // 2. Note Addition
    console.log("[TEST] Note Addition...");
    const withNote = CaseNotes.addNote(c, "Initial observation: possible CDN mismatch.");
    if (withNote.notes.length !== 1) throw new Error("Note not added");
    console.log("   OK: Note successfully attached.");

    // 3. Bundle Attachment (Mocking a bundle file)
    console.log("[TEST] Bundle Attachment...");
    const bundlePath = path.join(testDir, 'test.hyper');
    fs.writeFileSync(bundlePath, JSON.stringify({
        version: "1.0.0",
        fingerprint: "abc123456789",
        host: "test-host.com",
        url: "https://test-host.com/stream.m3u8"
    }));
    const withBundle = BundleAttachment.attachBundle(withNote, bundlePath);
    if (withBundle.bundles.length !== 1) throw new Error("Bundle not attached");
    console.log("   OK: .hyper bundle reference securely linked.");

    // 4. Finding Registration
    console.log("[TEST] Finding Registration...");
    const withFinding = FindingsRegistry.addFinding(withBundle, {
        title: "Malicious Stream Pattern",
        severity: "bad",
        bundle_id: "abc123456789",
        tags: ["malware", "obfuscation"]
    });
    if (withFinding.findings.length !== 1) throw new Error("Finding not added");
    console.log("   OK: Analyst finding registered with 'bad' severity.");

    // 5. Comparison
    console.log("[TEST] Bundle Comparison...");
    const bundlePathB = path.join(testDir, 'test_diff.hyper');
    fs.writeFileSync(bundlePathB, JSON.stringify({
        version: "1.0.0",
        fingerprint: "diff987654321",
        host: "diff-host.com",
        url: "https://diff-host.com/stream.m3u8",
        cdnProvider: "Cloudflare"
    }));
    const comparison = CaseComparator.compare(bundlePath, bundlePathB);
    if (comparison.deltas.cdn.match === true) throw new Error("Comparison failed to detect CDN delta");
    console.log("   OK: Comparison engine correctly identified infrastructure deltas.");

    console.log("\n[SUCCESS] Phase 57 Core logic verified.");
}

runTests().catch(err => {
    console.error("\n[FAILURE] Test Suite Error:", err);
    process.exit(1);
});
