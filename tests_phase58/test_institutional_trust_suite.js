const AuditLogger = require('../src/audit/auditLogger');
const CustodyChain = require('../src/audit/custodyChain');
const BundleSigner = require('../src/audit/bundleSigner');
const SignatureVerifier = require('../src/audit/signatureVerifier');
const ExportSeal = require('../src/audit/exportSeal');
const fs = require('fs');
const path = require('path');

async function runInstitutionalTests() {
    console.log("--- Phase 58: Institutional Trust Layer Test Suite ---");
    const testDir = path.join(__dirname, 'test_storage_institutional');
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });

    const auditDir = path.join(testDir, 'audit');
    const keysDir = path.join(testDir, 'keys');
    const exportDir = path.join(testDir, 'exports');

    const logger = new AuditLogger(auditDir);
    const custody = new CustodyChain(auditDir);
    const signer = new BundleSigner(keysDir);
    const verifier = SignatureVerifier;
    const sealer = new ExportSeal(signer, verifier);

    // 1. Audit Logging with Integrity Chain
    console.log("[TEST] Audit Logging & Chaining...");
    logger.log('START_TEST', { msg: 'First event' });
    logger.log('NEXT_EVENT', { msg: 'Second event' });
    const logs = logger.getLogs();
    if (logs.length !== 2) throw new Error("Logs not recorded");
    if (logs[1].prevHash === "GENESIS") throw new Error("Chaining failed");
    console.log("   OK: Audit trail chained successfully.");

    // 2. ECDSA Identity & Signing
    console.log("[TEST] ECDSA Identity & Signing...");
    const pubKey = signer.ensureKeyPair();
    const testData = { caseId: "INST-001", finding: "Critical Delta" };
    const { signature, publicKey } = signer.signData(testData);
    const isValid = verifier.verifyData(testData, signature, publicKey);
    if (!isValid) throw new Error("Signature verification failed");
    console.log("   OK: Secp256k1 signature verified.");

    // 3. Custody Chain (Lineage)
    console.log("[TEST] Custody Chain Lineage...");
    custody.recordEvent('bundle-abc-123', 'ACQUISITION', { machine: 'WORKSTATION-A' });
    custody.recordEvent('bundle-abc-123', 'SIGNING', { analyst: 'ANALYST-01' });
    const chain = custody.getChain('bundle-abc-123');
    if (chain.length !== 2) throw new Error("Custody chain incomplete");
    console.log("   OK: Evidence lineage tracked accurately.");

    // 4. Sealed Export Packaging
    console.log("[TEST] Sealed Export Packaging...");
    const mockCase = {
        case_id: "CASE-ALPHA",
        bundles: [] // Empty bundles for mock test
    };
    const sealResult = sealer.sealCase(mockCase, exportDir, { auditLogs: logs });
    if (!sealResult.success) throw new Error("Sealing failed");
    const envelopePath = path.join(sealResult.packagePath, 'SEALED_ENVELOPE.json');
    if (!fs.existsSync(envelopePath)) throw new Error("Envelope missing");

    const envelope = JSON.parse(fs.readFileSync(envelopePath, 'utf8'));
    const isEnvelopeValid = verifier.verifyData(envelope.data, envelope.signature, envelope.publicKey);
    if (!isEnvelopeValid) throw new Error("Sealed envelope signature invalid");
    console.log("   OK: Sealed Evidence Package generated and verified.");

    console.log("\n[SUCCESS] Phase 58 Institutional Trust Layer verified.");
}

runInstitutionalTests().catch(err => {
    console.error("\n[FAILURE] Institutional Test Error:", err);
    process.exit(1);
});
