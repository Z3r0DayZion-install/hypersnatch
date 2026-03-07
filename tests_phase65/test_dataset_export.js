const DatasetExporter = require('../src/export/datasetExporter');
const fs = require('fs');
const path = require('path');

async function runExportTests() {
    console.log("--- Phase 65: Dataset Export System Test Suite ---");

    const exporter = new DatasetExporter();
    const mockCase = {
        id: 'CASE_999',
        title: 'Akamai Investigation',
        bundles: [
            { path: 'B1.hyper', cdn: 'Akamai', protocol: 'HLS', playerSignature: 'Shaka' },
            { path: 'B2.hyper', cdn: 'Akamai', protocol: 'DASH', playerSignature: 'VideoJS' }
        ]
    };

    const exportDir = path.join(__dirname, 'test_exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    // 1. JSON Export
    console.log("[TEST] JSON Export...");
    const jsonPath = path.join(exportDir, 'case.json');
    await exporter.exportCase(mockCase, 'json', jsonPath);
    if (!fs.existsSync(jsonPath)) throw new Error("JSON export failed");
    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (jsonContent.id !== 'CASE_999') throw new Error("JSON content integrity failed");
    console.log("   OK: Full-case JSON serialization verified.");

    // 2. CSV Export
    console.log("[TEST] CSV Export...");
    const csvPath = path.join(exportDir, 'case.csv');
    await exporter.exportCase(mockCase, 'csv', csvPath);
    if (!fs.existsSync(csvPath)) throw new Error("CSV export failed");
    const csvLines = fs.readFileSync(csvPath, 'utf8').split('\n');
    if (csvLines.length < 3) throw new Error("CSV row count incorrect");
    if (!csvLines[1].includes('B1.hyper,Akamai,HLS,Shaka')) throw new Error("CSV data integrity failed");
    console.log("   OK: Forensic CSV formatting verified.");

    // 3. Relational Export
    console.log("[TEST] Relational Graph Export...");
    const relPath = path.join(exportDir, 'case_graph.json');
    await exporter.exportCase(mockCase, 'relational', relPath);
    if (!fs.existsSync(relPath)) throw new Error("Relational export failed");
    const relContent = JSON.parse(fs.readFileSync(relPath, 'utf8'));
    if (!relContent.nodes || !relContent.edges) throw new Error("Relational structure missing");
    if (relContent.nodes.length < 4) throw new Error("Relational node count incorrect");
    console.log("   OK: Graph-relational export verified.");

    console.log("\n[SUCCESS] Phase 65 Dataset Export System verified.");
}

runExportTests().catch(err => {
    console.error("\n[FAILURE] Export Test Error:", err);
    process.exit(1);
});
