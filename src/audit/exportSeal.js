const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * ExportSeal.js
 * Creates forensic-grade sealed evidence packages.
 */
class ExportSeal {
    constructor(signer, verifier) {
        this.signer = signer;
        this.verifier = verifier;
    }

    /**
     * Create a sealed package for a case.
     * @param {Object} caseData The case object
     * @param {string} destinationDir Target directory for the package
     * @param {Object} context { custodyChain, auditLogs }
     */
    sealCase(caseData, destinationDir, context = {}) {
        if (!fs.existsSync(destinationDir)) {
            fs.mkdirSync(destinationDir, { recursive: true });
        }

        const packageDir = path.join(destinationDir, `SEALED_${caseData.case_id}_${Date.now()}`);
        fs.mkdirSync(packageDir);

        // 1. Copy Bundles and Generate Manifest
        const artifactsDir = path.join(packageDir, 'artifacts');
        fs.mkdirSync(artifactsDir);

        const attachedPaths = caseData.bundles.map(b => b.path);
        const manifest = this.signer.createManifest(attachedPaths);

        // Copy files
        attachedPaths.forEach(fp => {
            if (fs.existsSync(fp)) {
                fs.copyFileSync(fp, path.join(artifactsDir, path.basename(fp)));
            }
        });

        // 2. Export Case Data and Context
        const dataDir = path.join(packageDir, 'metadata');
        fs.mkdirSync(dataDir);

        fs.writeFileSync(path.join(dataDir, 'case_data.json'), JSON.stringify(caseData, null, 2));
        if (context.custodyChain) {
            fs.writeFileSync(path.join(dataDir, 'custody_chain.json'), JSON.stringify(context.custodyChain, null, 2));
        }
        if (context.auditLogs) {
            fs.writeFileSync(path.join(dataDir, 'audit_trail.json'), JSON.stringify(context.auditLogs, null, 2));
        }

        // 3. Generate and Sign Final Manifest
        const finalManifest = {
            version: "Vanguards-1.0",
            case_id: caseData.case_id,
            timestamp: new Date().toISOString(),
            manifest,
            integrity: {
                case_hash: crypto.createHash('sha256').update(JSON.stringify(caseData)).digest('hex')
            }
        };

        const { signature, publicKey } = this.signer.signData(finalManifest);

        const sealedEnvelope = {
            envelope_version: "1.0",
            sealed_at: finalManifest.timestamp,
            data: finalManifest,
            signature,
            publicKey
        };

        fs.writeFileSync(path.join(packageDir, 'SEALED_ENVELOPE.json'), JSON.stringify(sealedEnvelope, null, 2));

        return {
            success: true,
            packagePath: packageDir,
            signature
        };
    }
}

module.exports = ExportSeal;
