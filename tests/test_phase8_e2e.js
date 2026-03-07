/**
 * HyperSnatch Phase 8: E2E Verification Test
 */

const schemaValidator = require('../src/core/schemaValidator');
const caseManager = require('../src/ops/caseManager');
const auditLogger = require('../src/ops/auditLogger');
const reportExporter = require('../src/ops/reportExporter');

async function runE2E() {
    console.log("🚀 Starting Phase 8 E2E Verification...");

    const analyst = "AGENT_007";
    auditLogger.logAction(analyst, "LOGIN", "Analyst started session");

    // 1. Create Case
    const myCase = caseManager.createCase("HS-2026-X1", { priority: "high" });
    auditLogger.logAction(analyst, "CREATE_CASE", "HS-2026-X1");

    // 2. Mock Artifact Validation
    const mockSiteProfile = {
        site_domain: "elite-stream.com",
        player: "Video.js",
        confidence: 0.98,
        additional_info: "Phase 7 compliant"
    };

    const validation = schemaValidator.validate("site_profile.json", mockSiteProfile);
    if (validation.valid) {
        console.log("✅ Schema Validation: PASS (site_profile.json)");
    } else {
        console.error("❌ Schema Validation: FAIL", validation.errors);
        process.exit(1);
    }

    // 3. Add Evidence & Observation
    caseManager.addBundleToCase("HS-2026-X1", "/mnt/evidence/capture_001.hyper");
    myCase.observations.push("Detected Widevine DRM signatures with Akamai pathing.");
    auditLogger.logAction(analyst, "ADD_OBSERVATION", "DRM signatures identified");

    // 4. Export Report
    const exportResult = reportExporter.exportReport(myCase, "./reports");
    console.log(`✅ Report Exported: ${exportResult.md}`);

    console.log("\n📊 Phase 8 E2E: ALL SYSTEMS NOMINAL");
}

runE2E().catch(console.error);
