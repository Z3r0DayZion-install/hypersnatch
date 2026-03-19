const path = require('path');
const fs = require('fs');
const EvidenceLoader = require('../src/bundle/loadEvidenceBundle');
const ParsedBundleStore = require('../src/state/parsedBundleStore');

console.log("=========================================");
console.log("  PHASE 4: VANGUARD ACCEPTANCE MATRIX    ");
console.log("=========================================\n");

async function runAcceptanceGates() {
    const store = ParsedBundleStore;
    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            console.log(`  [PASS] ${message}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${message}`);
            failed++;
        }
    };

    console.log("--- UNIT GATES ---");
    // Test 1: Empty Load
    console.log("1. Validating empty directory load behavior...");
    const emptyResult = EvidenceLoader.load(path.resolve(__dirname, '..', 'datasets'));
    assert(emptyResult.sourcePath.includes('datasets'), "Loader returns correct source path for invalid dir");
    assert(emptyResult.isValid === false, "Loader flags invalid directory as false");
    assert(emptyResult.validationStatus === "FAIL", "Validation status is FAIL for empty dir");

    console.log("\n--- INTEGRATION GATES ---");
    // Test 2: Target 2 HLS
    const t2Path = path.resolve(__dirname, '..', 'tests', 'evidence', 'target_2_hls');
    console.log(`2. Loading Evidence Bundle: ${t2Path}...`);

    if (!fs.existsSync(t2Path)) {
        console.error(`  [SKIP] Test directory not found: ${t2Path}`);
        console.error(`  Make sure you have extracted the evidence_targets.zip from Phase 3 into datasets/evidence_targets`);
        return;
    }

    const t2Result = EvidenceLoader.load(t2Path);
    console.log(`   * Load Status: ${t2Result.validationStatus}`);

    // Inject into Store
    store.setActiveBundle(t2Result);
    const uiState = store.getNormalizedState();

    assert(uiState.isLoaded === true, "Store signifies bundle is loaded");
    assert(uiState.sourcePath === t2Path, "Store propagates source path correctly");
    assert(uiState.validation.status === t2Result.validationStatus, "Store normalizes validation status");

    // Artifact Mapping Checks
    assert(uiState.data.manifest !== null, "Manifest schema propagates to UI state");
    assert(uiState.data.player !== null, "Player Profile propagates to UI state");
    assert((uiState.data.candidates || []).length > 0, "Candidates array parsed and accessible");
    assert(uiState.data.targetUrl !== 'Unknown Target', "Target URL extracted from manifest");

    // The logic below mimics what the UI controllers would do to render
    console.log("\n--- UI RENDER GATES (MOCK) ---");
    console.log("3. Emulating Data Binding for Workstation Layout...");

    const sumTopProtocol = (uiState.data.candidates && uiState.data.candidates.length > 0) ? uiState.data.candidates[0].type.toUpperCase() : "N/A";
    assert(sumTopProtocol === 'URL' || sumTopProtocol === 'HLS' || sumTopProtocol === 'N/A', "UI logic correctly extracts protocol (HLS/URL) or handles empty");

    const intPlayer = uiState.data.player ? uiState.data.player.player_name : "UNKNOWN";
    assert(intPlayer !== 'UNKNOWN', `UI logic correctly extracts player name: ${intPlayer}`);

    const intDrm = uiState.data.player ? (uiState.data.player.drm_detected ? "DETECTED" : "CLEARTEXT") : "UNKNOWN";
    assert(intDrm === "CLEARTEXT" || intDrm === "DETECTED", `UI logic extracts DRM status: ${intDrm}`);

    console.log("\n=========================================");
    console.log(`  RESULTS: ${passed} Passed | ${failed} Failed`);
    console.log("=========================================\n");

    if (failed > 0) process.exit(1);
}

runAcceptanceGates().catch(console.error);
