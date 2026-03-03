#!/usr/bin/env node
/**
 * HyperSnatch Vanguard Headless CLI (v1.2)
 * High-performance forensic artifact analyzer for SOAR/SOC integration.
 * 
 * Usage: hypersnatch-cli <input_file> [options]
 */

"use strict";

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const SovereignAuth = require('../core/security/sovereign_auth');

const APP_VERSION = "1.2.0";

function printHelp() {
    console.log(`
HyperSnatch Vanguard CLI v${APP_VERSION}
Deterministic Forensic Artifact Analyzer

USAGE:
  hypersnatch-cli <input_file> [options]

OPTIONS:
  -o, --out <path>      Output results to a JSON file.
  -f, --format <type>   Output format: json (default), csv, table.
  -s, --split           Enable large-payload chunking (memory optimized).
  -i, --intel <path>    Path to custom forensic_intelligence.json.
  -v, --version         Show version information.
  -h, --help            Show this help message.

EXAMPLES:
  hypersnatch-cli artifact.html --format table
  hypersnatch-cli evidence.har --out results.json
    `);
}

// Native HWID matching main.js logic
function getHardwareFingerprint() {
    const os = require('os');
    const crypto = require('crypto');
    const cpuId = os.cpus()[0].model.replace(/\s+/g, '_');
    const baseboardId = `${os.hostname()}_${os.userInfo().username}`;
    return crypto.createHash('sha256').update(`HS-HWID-${cpuId}-${baseboardId}`).digest('hex');
}

async function run() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
        printHelp();
        return;
    }

    if (args.includes('-v') || args.includes('--version')) {
        console.log(`HyperSnatch Vanguard CLI v${APP_VERSION}`);
        return;
    }

    // --- Institutional License Verification ---
    const hwid = getHardwareFingerprint();

    // Search for license in multiple locations
    const licensePaths = [
        path.join(__dirname, '..', '..', 'license.json'),                          // project root
        path.join(process.env.APPDATA || '', 'HyperSnatch', 'runtime', 'config', 'license.json'), // user data
        path.join(process.env.HOME || process.env.USERPROFILE || '', '.hypersnatch', 'license.json') // home dir
    ];

    let licenseData = null;
    let foundPath = null;
    for (const lp of licensePaths) {
        if (lp && fs.existsSync(lp)) {
            try {
                licenseData = JSON.parse(fs.readFileSync(lp, 'utf8'));
                foundPath = lp;
                break;
            } catch (e) { /* skip corrupt */ }
        }
    }

    if (!licenseData) {
        console.error("❌ LICENSE ERROR: Headless CLI execution requires an active Institutional License.");
        console.error("   Place a valid 'license.json' in the project root or AppData/HyperSnatch/runtime/config/");
        process.exit(1);
    }

    const verification = SovereignAuth.verifyLicense(licenseData, hwid);
    if (!verification.valid) {
        console.error(`❌ LICENSE ERROR: ${verification.reason}`);
        process.exit(1);
    }

    if (!SovereignAuth.meetsMinimumTier(verification.tier || verification.edition, 'INSTITUTIONAL')) {
        console.error("❌ LICENSE ERROR: The Headless CLI is restricted to the Institutional Tier ($499).");
        console.error(`   Current Tier: ${verification.tier || verification.edition}. Please upgrade.`);
        process.exit(1);
    }
    // ---------------------------------------

    const inputPath = args[0];
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ ERROR: Input file not found: ${inputPath}`);
        process.exit(1);
    }

    const outArgIdx = args.indexOf('--out') !== -1 ? args.indexOf('--out') : args.indexOf('-o');
    const outputPath = outArgIdx !== -1 ? args[outArgIdx + 1] : null;

    const intelArgIdx = args.indexOf('--intel') !== -1 ? args.indexOf('--intel') : args.indexOf('-i');
    const intelPath = intelArgIdx !== -1 ? args[intelArgIdx + 1] : null;

    const formatArgIdx = args.indexOf('--format') !== -1 ? args.indexOf('--format') : args.indexOf('-f');
    const format = formatArgIdx !== -1 ? args[formatArgIdx + 1] : 'json';

    const split = args.includes('--split') || args.includes('-s');

    // 1. Locate Rust Core
    const binName = process.platform === 'win32' ? 'hs-core.exe' : 'hs-core';
    let binPath = path.join(__dirname, '..', '..', 'build', binName);

    if (!fs.existsSync(binPath)) {
        // Fallback for packaged env
        binPath = path.join(__dirname, '..', 'resources', binName);
    }

    if (!fs.existsSync(binPath)) {
        console.error("❌ ERROR: HyperSnatch Forensic Core not found. Run 'npm run hs-core:prepare' first.");
        process.exit(1);
    }

    // 2. Prepare Payload
    const input = fs.readFileSync(inputPath, 'utf8');
    const request = {
        input,
        splitSegments: split,
        intelligencePath: intelPath ? path.resolve(intelPath) : null
    };

    // 3. Spawn Core
    const child = spawn(binPath, ['smartdecode', '--json'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on('data', data => stdout += data);
    child.stderr.on('data', data => stderr += data);

    child.on('close', code => {
        if (code !== 0) {
            console.error(`❌ ERROR: Forensic core failed (exit ${code}): ${stderr}`);
            process.exit(1);
        }

        try {
            const results = JSON.parse(stdout);

            if (outputPath) {
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
                console.log(`✅ ANALYSIS COMPLETE: Results saved to ${outputPath}`);
            } else {
                displayResults(results, format);
            }
        } catch (e) {
            console.error("❌ ERROR: Failed to parse forensic core output.");
            process.exit(1);
        }
    });

    child.stdin.write(JSON.stringify(request));
    child.stdin.end();
}

function displayResults(results, format) {
    if (format === 'json') {
        console.log(JSON.stringify(results, null, 2));
    } else if (format === 'table') {
        console.log(`
--- HyperSnatch Forensic Analysis Results ---`);
        console.log(`Engine: ${results.version} // Total Artifacts: ${results.candidates.length}
`);

        if (results.candidates.length === 0) {
            console.log("No artifacts found.");
        } else {
            console.table(results.candidates.map(c => ({
                Type: c.type,
                Tier: c.certaintyTier || 'Low',
                Confidence: `${(c.finalScore * 100).toFixed(0)}%`,
                URL: c.url.substring(0, 80) + (c.url.length > 80 ? '...' : '')
            })));
        }

        if (results.refusals.length > 0) {
            console.log(`
--- Policy Refusals (${results.refusals.length}) ---`);
            results.refusals.forEach(r => console.log(`[${r.host}] ${r.reason}`));
        }
    } else {
        console.log(stdout); // Raw fallback
    }
}

run().catch(err => {
    console.error(`❌ FATAL: ${err.message}`);
    process.exit(1);
});
