#!/usr/bin/env node

"use strict";

require("../utils/crash-logger").initCrashHandler();


const fs = require("fs");
const path = require("path");

const SmartDecode = require("../core/smartdecode/index");
const DownloadPlan = require("../core/download-plan");

/**
 * Minimal CLI Arg Parser
 * Returns an object with `command` and a `args` dictionary.
 */
function parseArgs(argv) {
    const raw = argv.slice(2);
    if (!raw.length) return { command: "help", args: {} };

    const command = raw[0].toLowerCase();
    const args = {};

    // Convert --key value into args[key] = value or args[key] = true
    for (let i = 1; i < raw.length; i++) {
        const token = raw[i];
        if (token.startsWith("--")) {
            const key = token.slice(2);
            // If the next token exists and is not a flag, it's the value
            if (i + 1 < raw.length && !raw[i + 1].startsWith("--")) {
                args[key] = raw[i + 1];
                i++; // Skip the value
            } else {
                args[key] = true;
            }
        }
    }

    return { command, args };
}

async function runCli() {
    const { command, args } = parseArgs(process.argv);

    if (args.version) {
        let pkgVer = "1.0.0";
        try {
            pkgVer = require("../../VERSION.json").version;
        } catch (e) { }
        console.log(`HyperSnatch v${pkgVer}`);
        process.exit(0);
    }

    if (command === "help" || args.help) {
        printHelp();
        process.exit(0);
    }

    try {
        if (command === "decode") {
            await handleDecode(args);
        } else if (command === "plan") {
            handlePlan(args);
        } else if (command === "export-golden") {
            await handleExportGolden(args);
        } else {
            console.error(`Unknown command: ${command}`);
            printHelp();
            process.exit(1);
        }
    } catch (err) {
        console.error("❌ CLI Error:", err.message);
        process.exit(1);
    }
}

async function handleDecode(args) {
    let inputStr = "";

    if (args.in) {
        const inPath = path.resolve(process.cwd(), args.in);
        if (!fs.existsSync(inPath)) throw new Error(`File not found: ${inPath}`);
        inputStr = fs.readFileSync(inPath, "utf8");
    } else if (args.stdin) {
        inputStr = await readStdin();
    } else {
        throw new Error("Missing input source. Provide --in <path> or --stdin.");
    }

    const results = await SmartDecode.run(inputStr);

    // Sort output deterministically
    const sortedCandidates = [...results.candidates].sort((a, b) => a.url.localeCompare(b.url));
    const sortedRefusals = [...results.refusals].sort((a, b) => (a.host + a.reason).localeCompare(b.host + b.reason)).map(r => ({ ...r, markers: r.markers || [] }));

    // Establish "selected" candidate based on best, fallback, or override
    let selectedCandidate = null;

    if (args.pick !== undefined) {
        const index = parseInt(args.pick, 10);
        if (sortedCandidates[index]) {
            selectedCandidate = sortedCandidates[index];
        } else {
            throw new Error(`Invalid candidate index for --pick: ${index}`);
        }
    } else {
        selectedCandidate = results.best || (sortedCandidates.length > 0 ? sortedCandidates[0] : null);
    }

    // Fail state: no accepted media found
    if (!selectedCandidate && sortedCandidates.length === 0) {
        const outObj = {
            status: "failed",
            reason: "No measurable candidate URLs extracted.",
            refusals: sortedRefusals
        };

        if (args.json) {
            outputResult(outObj, args.out);
        } else {
            console.error("❌ No candidates extracted.");
            console.error(`Blocked/Refused (${sortedRefusals.length}):`);
            sortedRefusals.forEach(r => console.error(` - [${r.host}] ${r.reason} (${r.url || ""})`));
        }
        process.exit(2);
    }

    // Build the download plan
    const plan = DownloadPlan.generate(selectedCandidate);

    if (args.cmd) {
        // Output just the bash command perfectly to stdout
        console.log(plan.command);
    } else if (args.json) {
        // Structured JSON for pipe tooling
        const outObj = {
            version: results.version,
            selected: selectedCandidate,
            candidates: sortedCandidates,
            refusals: sortedRefusals,
            downloadPlan: plan
        };
        outputResult(outObj, args.out);
    } else {
        // Human console
        console.log(`✅ Extracted ${sortedCandidates.length} candidate(s).`);
        console.log(`⭐ Best candidate: ${selectedCandidate.url}`);
        console.log(`📦 Type: ${selectedCandidate.type}, Confidence: ${selectedCandidate.confidence}`);
        console.log(`⬇️  Run: ${plan.command}`);
        if (sortedRefusals.length > 0) {
            console.log(`\n🛑 Also found ${sortedRefusals.length} refused gates. (use --json for details)`);
        }
    }
}

function handlePlan(args) {
    if (!args.url) {
        throw new Error("Missing --url for plan command.");
    }

    // Mock a candidate structure to force through the plan engine
    const candidateArg = {
        url: args.url,
        type: args.type || "unknown",
        host: args.host || "unknown"
    };

    const plan = DownloadPlan.generate(candidateArg);

    if (args.cmd) {
        console.log(plan.command);
    } else if (args.json) {
        outputResult({ downloadPlan: plan }, args.out);
    } else {
        console.log(`✅ Simulated Download Plan Generated.`);
        console.log(`⬇️  Run: ${plan.command}`);
        console.log(`Engine: ${plan.engine}`);
    }
}

async function handleExportGolden(args) {
    if (!args.in) {
        throw new Error("Missing --in <path> for export-golden.");
    }

    const inPath = path.resolve(process.cwd(), args.in);
    if (!fs.existsSync(inPath)) throw new Error(`File not found: ${inPath}`);
    const inputStr = fs.readFileSync(inPath, "utf8");

    const results = await SmartDecode.run(inputStr);

    // Use dynamic require so adapter doesn't leak into core runtime normally
    const { toGolden } = require("../core/smartdecode/golden-adapter");
    const goldenSchema = toGolden(results);

    outputResult(goldenSchema, args.out);
}

// ---- Utils ---- //

function outputResult(obj, outArg) {
    const raw = JSON.stringify(obj, null, 2);
    if (outArg) {
        const p = path.resolve(process.cwd(), outArg);
        fs.writeFileSync(p, raw, "utf8");
        console.log(`Results written to ${p}`);
    } else {
        console.log(raw);
    }
}

function readStdin() {
    return new Promise((resolve, reject) => {
        let data = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", chunk => { data += chunk; });
        process.stdin.on("end", () => resolve(data));
        process.stdin.on("error", reject);
    });
}

function printHelp() {
    console.log(`
HyperSnatch CLI (Offline-First Extraction Engine)

Usage:
  hypersnatch decode --in <path> [--json|--cmd] [--pick <index>] [--out <path>]
  hypersnatch decode --stdin [--json|--cmd] [--pick <index>] [--out <path>]
  hypersnatch plan --url "<url>" [--type <mimeOrExt>] [--cmd|--json]
  hypersnatch export-golden --in <path> [--out <path>]

Examples:
  hypersnatch decode --in ./test.html --cmd
    (Prints just 'aria2c ...' or 'ffmpeg ...')

  hypersnatch decode --in ./test.html --json --pick 1
    (Outputs full JSON profile for the 2nd valid candidate)

  Get a plan directly:
  hypersnatch plan --url "https://host/vid.m3u8" --type m3u8 --cmd
`);
}

runCli();
