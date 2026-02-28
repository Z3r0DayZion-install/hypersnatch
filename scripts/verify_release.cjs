"use strict";

const { execSync, execFileSync } = require("child_process");
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
    // Builds Electron artifacts; predist also prepares hs-core and (optionally) pre-signs build/hs-core.exe
    { cmd: "npm run dist", name: "Electron Dist Build" },
    // Optional standalone CLI binary (can be signed post-build)
    { cmd: "npm run build:exe", name: "CLI EXE Build (optional)" },
    // Optional post-signing for CLI exe (no-op unless HYPERSNATCH_SIGN=1)
    { cmd: "node scripts/sign_windows.cjs --post", name: "Optional CLI Signing" },
    // Must run last so hashes reflect final signed binaries
    { cmd: "node scripts/generate_manifest.cjs", name: "Manifest & Hash Generation" },
];

for (const check of checks) {
    console.log(`\n=== ${check.name} ===`);
    if (!run(check.cmd)) {
        process.exit(1);
    }
}


// 3b. Electron App Smoke Test (packaged)
console.log("\n▶️ RUNNING: Electron App Smoke Test (--version)");
if (process.platform === "win32") {
    const { spawnSync } = require("child_process");
    const unpackedExe = path.join(__dirname, "../dist/win-unpacked/HyperSnatch.exe");
    if (!fs.existsSync(unpackedExe)) {
        console.error(`❌ Unpacked EXE not found: ${unpackedExe}`);
        process.exit(1);
    }

    // hs-core must be shipped as an extra resource for the Rust engine option.
    const requireHsCore = process.env.HS_CORE_REQUIRED !== "0";
    const hsCoreExe = path.join(__dirname, "../dist/win-unpacked/resources/hs-core.exe");
    const hsCoreBin = path.join(__dirname, "../dist/win-unpacked/resources/hs-core");
    const hsCorePresent = fs.existsSync(hsCoreExe) || fs.existsSync(hsCoreBin);
    if (!hsCorePresent) {
        const msg = "hs-core resource missing (expected " + hsCoreExe + ")";
        if (requireHsCore) {
            console.error("❌ " + msg);
            console.error("Set HS_CORE_REQUIRED=0 to allow release builds without the Rust core.");
            process.exit(1);
        } else {
            console.warn("⚠️ " + msg);
        }
    } else {
        console.log("✅ hs-core resource present in win-unpacked/resources");
    }
    const r = spawnSync(unpackedExe, ["--version"], { timeout: 10000, encoding: "utf8" });
    if (r.error) {
        console.error(`❌ Failed to run packaged EXE: ${r.error.message}`);
        process.exit(1);
    }
    if (r.status !== 0) {
        console.error("❌ Packaged EXE returned non-zero exit code", { code: r.status, stderr: r.stderr });
        process.exit(1);
    }
    const out = (r.stdout || "").trim();
    if (!out.startsWith("HyperSnatch")) {
        console.error("❌ Packaged EXE --version output unexpected:", out);
        process.exit(1);
    }
    console.log(`✅ Packaged EXE OK: ${out}`);
} else {
    console.log("ℹ️ Skipped (non-Windows platform)");
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


console.log("\n▶️ RUNNING: Authenticode Signature Validation (optional)");
const enforceSigning = process.env.HYPERSNATCH_ENFORCE_SIGNING === "1";
const enforceTimestamp = process.env.HYPERSNATCH_ENFORCE_TIMESTAMP === "1";

if (process.platform !== "win32") {
    console.log("ℹ️ Skipped (non-Windows platform)");
} else {
    const exeCandidates = new Set();
    const distRoot = path.join(__dirname, "../dist");

    exeCandidates.add(path.join(distRoot, "hypersnatch.exe"));
    exeCandidates.add(path.join(distRoot, "win-unpacked", "HyperSnatch.exe"));
    exeCandidates.add(path.join(distRoot, "win-unpacked", "resources", "hs-core.exe"));

    const expectedSetup = ("HyperSnatch-Setup-" + versionPkg.version + ".exe").toLowerCase();

    if (fs.existsSync(distRoot)) {
        for (const name of fs.readdirSync(distRoot)) {
            if (name.toLowerCase() === expectedSetup) {
                exeCandidates.add(path.join(distRoot, name));
            }
        }
    }

    const exes = Array.from(exeCandidates).filter((p) => fs.existsSync(p));
    if (exes.length === 0) {
        console.log("ℹ️ No EXEs found for Authenticode validation.");
    } else {
        for (const exe of exes) {
            try {
                const psExe = fs.existsSync("C:\\Program Files\\PowerShell\\7\\pwsh.exe")
                    ? "C:\\Program Files\\PowerShell\\7\\pwsh.exe"
                    : "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
                const psScript = "& { param([string]$p) $ErrorActionPreference='Stop'; $sig=Get-AuthenticodeSignature -FilePath $p; $o=[pscustomobject]@{ status=$sig.Status.ToString(); hasSigner=[bool]$sig.SignerCertificate; hasTimestamp=[bool]$sig.TimeStamperCertificate }; $o | ConvertTo-Json -Compress }";
                const out = execFileSync(psExe, ["-NoProfile", "-Command", psScript, exe], { encoding: "utf8" }).trim();
                const info = JSON.parse(out);

                if (info.hasSigner) {
                    if (info.status === "Valid") {
                        console.log(`✅ Signed (Valid): ${path.basename(exe)} (timestamp=${info.hasTimestamp})`);
                        if (!info.hasTimestamp && enforceTimestamp) {
                            console.error("❌ Missing RFC3161 timestamp");
                            process.exit(1);
                        }
                    } else {
                        const msg = `⚠️ Signed but not trusted: ${path.basename(exe)} (status=${info.status})`;
                        if (enforceSigning) {
                            console.error(msg);
                            process.exit(1);
                        }
                        console.log(msg);
                    }
                } else {
                    const msg = `⚠️ Not signed: ${path.basename(exe)} (status=${info.status})`;
                    if (enforceSigning) {
                        console.error(msg);
                        process.exit(1);
                    }
                    console.log(msg);
                }
            } catch (e) {
                const msg = `⚠️ Authenticode validation failed for ${exe}: ${e.message}`;
                if (enforceSigning) {
                    console.error(msg);
                    process.exit(1);
                }
                console.log(msg);
            }
        }
    }
}
console.log("\n🎉 ALL RELEASE GATES PASSED. READY TO SHIP. 🎉");
process.exit(0);



