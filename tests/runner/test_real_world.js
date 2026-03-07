"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const TargetRunner = require('./target_runner');
const EngineCore = require('../../core/engine_core');

async function runTestMatrix() {
    console.log("=== HyperSnatch Real-World Extraction Test Matrix ===");

    const targetsPath = path.join(__dirname, '../fixtures/real_targets.json');
    if (!fs.existsSync(targetsPath)) {
        console.error("No real_targets.json found!");
        process.exit(1);
    }

    const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
    console.log(`Loaded ${targets.length} targets for execution...`);

    const runner = new TargetRunner();
    await EngineCore.initialize();

    let successCount = 0;

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        console.log(`\n[${i + 1}/${targets.length}] Testing: ${target.url} (${target.type})`);

        const context = await runner.capture(target.url);
        if (!context) {
            console.log("  -> Capture failed. Skipping.");
            continue;
        }

        const mockHar = {
            log: {
                version: "1.2",
                entries: context.domContext.networkLogs.map(req => ({
                    request: { url: req.url, method: req.method },
                    response: {}
                }))
            }
        };

        // Dump artifacts for Forensic GUI
        const targetDir = path.join(__dirname, '../evidence', `target_${i}_${target.type}`);
        fs.mkdirSync(targetDir, { recursive: true });

        const evidence = {
            'network.har': JSON.stringify(mockHar, null, 2),
            'dom_snapshot.html': context.domContext.dom,
            'player_config.json': JSON.stringify(context.domContext.window.players || {}, null, 2),
            'stream_trace.json': JSON.stringify(context.domContext.window.trace || [], null, 2)
        };

        const hashes = {};
        for (const [filename, content] of Object.entries(evidence)) {
            fs.writeFileSync(path.join(targetDir, filename), content);
            hashes[filename] = crypto.createHash('sha256').update(content).digest('hex');
        }

        let eventMapStr = "[]";
        // Memory Forensics Export
        const mseBuffers = context.domContext.window.mseBuffers || [];
        if (mseBuffers.length > 0) {
            console.log(`  -> Memory Forensics: Captured ${mseBuffers.length} raw MSE buffers.`);
            const segDir = path.join(targetDir, 'captured_segments');
            fs.mkdirSync(segDir, { recursive: true });

            const eventMap = [];
            mseBuffers.forEach((buf, bIdx) => {
                const ext = buf.mime && buf.mime.includes('audio') ? 'm4a' : 'm4s';
                const filename = `segment_${String(bIdx).padStart(3, '0')}.${ext}`;
                const filepath = path.join(segDir, filename);

                // Decode base64 to binary buffer
                const binaryData = Buffer.from(buf.payload, 'base64');
                fs.writeFileSync(filepath, binaryData);
                const segHash = crypto.createHash('sha256').update(binaryData).digest('hex');
                hashes[`captured_segments/${filename}`] = segHash;

                eventMap.push({
                    index: bIdx,
                    filename,
                    hash: segHash,
                    mseId: buf.mseId,
                    sbId: buf.sbId,
                    mime: buf.mime,
                    byteLength: buf.byteLength,
                    timestamp: buf.timestamp
                });
            });
            eventMapStr = JSON.stringify(eventMap, null, 2);
            fs.writeFileSync(path.join(targetDir, 'mse_events.json'), eventMapStr);
            hashes['mse_events.json'] = crypto.createHash('sha256').update(eventMapStr).digest('hex');
        }

        // Seal Manifest
        const seal = {
            target: target.url,
            processedAt: new Date().toISOString(),
            integrityEngine: 'SHA-256',
            hashes
        };
        fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(seal, null, 2));

        // Inject HarContext into domContext for the scorer
        context.domContext.harContext = mockHar;

        // Feed to the EngineCore pipeline (which incorporates SmartDecode and AIAnalyzer and Scorer)
        // Feed URL first
        let result = await EngineCore.process({
            sourceType: "URL",
            rawInput: target.url,
            harContext: mockHar,
            domContext: context.domContext
        }, { policyState: 'relaxed' });

        // If URL fails, feed HAR (Network Logs)
        if (result.candidates.length === 0 && context.domContext.networkLogs.length > 0) {
            result = await EngineCore.process({
                sourceType: "HAR",
                rawInput: JSON.stringify(mockHar),
                harContext: mockHar,
                domContext: context.domContext
            }, { policyState: 'relaxed' });
        }

        // If HAR fails, feed HTML
        if (result.candidates.length === 0) {
            result = await EngineCore.process({
                sourceType: "HTML",
                rawInput: context.domContext.dom,
                harContext: mockHar,
                domContext: context.domContext
            }, { policyState: 'relaxed' });
        }

        if (result.candidates.length > 0) {
            console.log(`  -> SUCCESS! Found ${result.candidates.length} candidates.`);
            const top = result.candidates[0];
            console.log(`  -> Best Rule/URL: ${top.url || top}`);
            successCount++;
        } else {
            console.log(`  -> FAILED: No candidates extracted.`);
        }

        // --- Phase 3: Final Integrations & Document Output ---
        const { ReportGenerator } = require('../../src/core/report_generator');

        const outputArtifacts = {
            'har_classified.json': JSON.stringify(result.harAnalysis || {}, null, 2),
            'player_profile.json': JSON.stringify(result.fingerprint || {}, null, 2),
            'stream_candidates.json': JSON.stringify(result.candidates || [], null, 2),
            'report.md': ReportGenerator.generateMarkdown(result)
        };

        for (const [filename, content] of Object.entries(outputArtifacts)) {
            fs.writeFileSync(path.join(targetDir, filename), content);
            // Append to our existing hashes map to seal them
            hashes[filename] = crypto.createHash('sha256').update(content).digest('hex');
        }

        // Seal Manifest (Rewriting with full hashes array including Phase 3 artifacts)
        const finalSeal = {
            target: target.url,
            processedAt: new Date().toISOString(),
            integrityEngine: 'SHA-256',
            hashes
        };
        fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(finalSeal, null, 2));

    }

    await runner.close();

    console.log("\n=== Final Scorecard ===");
    console.log(`Success: ${successCount} / ${targets.length}`);
    console.log("===============================");
}

runTestMatrix().catch(console.error);
