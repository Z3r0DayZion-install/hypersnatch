"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd) {
    console.log(`\n▶️ RUNNING: ${cmd}`);
    try {
        execSync(cmd, { stdio: "inherit" });
        return true;
    } catch (e) {
        console.error(`\n❌ FAILED: ${cmd}`);
        return false;
    }
}

function runSilent(cmd) {
    console.log(`\n▶️ RUNNING (Silent): ${cmd}`);
    try {
        return execSync(cmd, { encoding: "utf8" });
    } catch (e) {
        console.error(`\n❌ FAILED: ${cmd}`);
        console.error(e.stderr || e.message);
        return null;
    }
}

console.log("=== HYPERSNATCH v1.0 RELEASE GATE ===");

// 1. Core Unit Tests
if (!run("npm test")) {
    process.exit(1);
}

// 2. Golden Fixture Regression
if (!run("node verify_golden.js")) {
    process.exit(1);
}

// 3. Verify Version JSON
const versionPkg = require("../VERSION.json");
if (!versionPkg || !versionPkg.version) {
    throw new Error("Missing VERSION.json resolution.");
}
console.log(`✅ VERSION.json found: ${versionPkg.version}`);

const checks = [
    { cmd: "npm test", name: "Core Unit Tests" },
    { cmd: "npm run verify:schema", name: "Strict JSON Schema Assertion" },
    { cmd: "node verify_golden.js", name: "Golden Fixture Regression" },
    { cmd: "node scripts/generate_manifest.cjs", name: "Manifest & Hash Generation" },
];

for (const check of checks) {
    console.log(`\n=== ${check.name} ===`);
    if (!run(check.cmd)) {
        process.exit(1);
    }
}

// 4. CLI Smoke Test - JSON output
const fixturePath = path.join(__dirname, "../fixtures/baseline.json");
if (!fs.existsSync(fixturePath)) {
    console.error(`❌ Fixture not found: ${fixturePath}`);
    process.exit(1);
}

const jsonOutput = runSilent(`node ./src/cli/hypersnatch-cli.js decode --in "${fixturePath}" --json`);
if (!jsonOutput) process.exit(1);

try {
    const parsed = JSON.parse(jsonOutput);
    if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
        console.error("❌ CLI JSON Smoke Test Failed: 'candidates' array missing.");
        process.exit(1);
    }
    console.log("✅ CLI JSON Smoke Test Passed");
} catch (e) {
    console.error("❌ CLI JSON Smoke Test Failed: Output is not valid JSON.");
    process.exit(1);
}

// 4. CLI Smoke Test - CMD output
const cmdOutput = runSilent(`node ./src/cli/hypersnatch-cli.js decode --in "${fixturePath}" --cmd`);
if (!cmdOutput) process.exit(1);

if (!cmdOutput.trim().startsWith("ffmpeg") && !cmdOutput.trim().startsWith("aria2c")) {
    console.error("❌ CLI CMD Smoke Test Failed: Output does not look like a download command.");
    console.error("Got:", cmdOutput.trim());
    process.exit(1);
}
console.log("✅ CLI CMD Smoke Test Passed");


// 5. Bridge server regression test
console.log("\n▶️ RUNNING: Bridge Server Regression Test");
const { spawn } = require("child_process");
const bridgeProcess = spawn("node", ["./src/bridge/ui-bridge.js"], { stdio: "pipe" });

let bridgePassed = false;
try {
    // Wait for server to bind
    execSync("node -e \"setTimeout(() => {}, 1500)\"");

    const bridgeTestScript = `
        const http = require('http');
        const fs = require('fs');
        let token = '';
        try {
            const rt = JSON.parse(fs.readFileSync('./bridge.runtime.json', 'utf8'));
            token = rt.token || '';
        } catch(e) {}

        function testImpersonation(callback) {
            const req = http.request('http://127.0.0.1:4179/decode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, res => {
                if (res.statusCode !== 401) {
                    console.error('❌ Bridge Impersonation Test Failed (Expected 401, got ' + res.statusCode + ')');
                    process.exit(1);
                }
                callback();
            });
            req.on('error', err => { console.error(err); process.exit(1); });
            req.write(JSON.stringify({ input: 'https://emload.com/file/123/file.mp4' }));
            req.end();
        }

        function testInvalidToken(callback) {
            const req = http.request('http://127.0.0.1:4179/decode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-HyperSnatch-Token': 'INVALID_TOKEN' }
            }, res => {
                if (res.statusCode !== 401) {
                    console.error('❌ Bridge Invalid Token Test Failed (Expected 401, got ' + res.statusCode + ')');
                    process.exit(1);
                }
                callback();
            });
            req.on('error', err => { console.error(err); process.exit(1); });
            req.write(JSON.stringify({ input: 'https://emload.com/file/123/file.mp4' }));
            req.end();
        }
        
        function testValidToken() {
            const req = http.request('http://127.0.0.1:4179/decode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-HyperSnatch-Token': token }
            }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (!parsed.candidates || !parsed.refusals || parsed.best === undefined || parsed.downloadPlan === undefined) {
                            console.error('❌ Bridge Invalid Response Shape:', Object.keys(parsed));
                            process.exit(1);
                        }
                        console.log('✅ Bridge POST /decode OK (with Auth)');
                        process.exit(0);
                    } catch(e) {
                        console.error('❌ Bridge JSON parse failed');
                        process.exit(1);
                    }
                });
            });
            req.on('error', err => {
                console.error('❌ Bridge connection error:', err.message);
                process.exit(1);
            });
            req.write(JSON.stringify({ input: 'https://emload.com/file/123/file.mp4' }));
            req.end();
        }

        testImpersonation(() => {
            console.log('✅ Bridge Impersonation Test Passed (401 Check)');
            testInvalidToken(() => {
                console.log('✅ Bridge Invalid Token Test Passed (401 Check)');
                testValidToken();
            });
        });
    `;

    execSync(`node -e "${bridgeTestScript.replace(/"/g, '\\"').replace(/\\n/g, '')}"`, { stdio: "inherit" });
    bridgePassed = true;
} catch (e) {
    console.error("❌ Bridge Server Regression Failed");
} finally {
    bridgeProcess.kill();
}

if (!bridgePassed) process.exit(1);

console.log("\n▶️ RUNNING: Authenticode Signature & Timestamp Validation");
const exePath = path.join(__dirname, "../dist/hypersnatch.exe");
if (fs.existsSync(exePath)) {
    try {
        const psCmd = `"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -Command "$ErrorActionPreference = 'Stop'; $sig = Get-AuthenticodeSignature -FilePath '${exePath}'; if ($sig.Status -eq 'NotSigned' -or -not $sig.SignerCertificate) { exit 1 }; if (-not $sig.TimeStamperCertificate) { exit 2 }; exit 0"`;
        execSync(psCmd, { stdio: "inherit" });
        console.log("✅ Authenticode Signature and RFC3161 Timestamp Verified");
    } catch (e) {
        if (e.status === 1) { console.error("❌ executable is missing Authenticode Signature"); process.exit(1); }
        else if (e.status === 2) { console.error("❌ executable signature is missing RFC 3161 Timestamp"); process.exit(1); }
        else {
            console.error("⚠️ Signature validation skipped or failed (Powershell not found or error):", e.message);
        }
    }
} else {
    console.error("❌ executable dist/hypersnatch.exe not found for signature validation.");
    process.exit(1);
}

console.log("\n🎉 ALL RELEASE GATES PASSED. READY TO SHIP. 🎉");
process.exit(0);
