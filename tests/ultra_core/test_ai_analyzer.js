"use strict";

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const AIAnalyzer = require('../../src/core/smartdecode/ai_analyzer');
const IntelligenceManager = require('../../src/core/smartdecode/intelligence_manager');

function runTests() {
    console.log("--- Running AI Analyzer Tests ---");

    // 1. Simulate an unknown page with a custom global player object
    const mockContext = {
        url: 'https://unknown-streaming-site.com/video/12345',
        networkLogs: [
            { url: 'https://cdn.example.com/assets/player.js' },
            { url: 'https://streams.example.com/live/hidden-stream.m3u8?token=xyz' }
        ],
        dom: '<html><body><div id="player"></div></body></html>',
        window: {
            document: { querySelectorAll: () => [] },
            // A customized, obfuscated player config that holds the stream
            SitePlayerConfig: {
                media: {
                    sourceList: [
                        { file: 'https://streams.example.com/live/hidden-stream.m3u8?token=xyz' }
                    ]
                }
            }
        }
    };

    // 2. Run the Analyzer
    const extractedRule = AIAnalyzer.analyze(mockContext);

    assert.ok(extractedRule, "AI Analyzer should successfully generate a rule for the hidden stream");
    assert.strictEqual(extractedRule.strategy, "global_variable", "Rule should derive from the global variable strategy");
    assert.ok(extractedRule.scriptPattern.includes("['SitePlayerConfig']") || extractedRule.scriptPattern.includes(".SitePlayerConfig"), "Generated script should reference SitePlayerConfig");
    assert.strictEqual(extractedRule.sampleTarget, 'https://streams.example.com/live/hidden-stream.m3u8?token=xyz', "Target URL should match network log");

    console.log(`[Test] AI Generated script:\n${extractedRule.scriptPattern}\n`);

    // Verify 5-part filesystem artifact generation
    const pluginDir = path.join(__dirname, '../../src/core/smartdecode/generated_plugins', extractedRule.id);
    assert.ok(fs.existsSync(pluginDir), "Plugin directory was not created");
    assert.ok(fs.existsSync(path.join(pluginDir, 'detect.js')), "detect.js missing");
    assert.ok(fs.existsSync(path.join(pluginDir, 'extract.js')), "extract.js missing");
    assert.ok(fs.existsSync(path.join(pluginDir, 'resolve.js')), "resolve.js missing");
    assert.ok(fs.existsSync(path.join(pluginDir, 'explanation.md')), "explanation.md missing");
    assert.ok(fs.existsSync(path.join(pluginDir, 'confidence.json')), "confidence.json missing");
    console.log(`[Test] Autonomously generated plugin verified at: ${pluginDir}\n`);

    // 3. Test Rule Persistence to IntelligenceManager
    const intelPath = path.join(__dirname, 'test_intelligence.json');
    fs.writeFileSync(intelPath, JSON.stringify({ version: "1.2.0-ai-enhanced", patterns: {} }));

    // Ensure IntelligenceManager is reset
    IntelligenceManager.patterns.clear();
    IntelligenceManager.addDynamicRule(extractedRule.id, extractedRule, intelPath);

    assert.ok(IntelligenceManager.patterns.has(extractedRule.id), "Pattern should be stored in memory");

    const savedIntel = JSON.parse(fs.readFileSync(intelPath, 'utf8'));
    assert.ok(savedIntel.patterns[extractedRule.id], "Pattern should be persisted to disk");

    // Cleanup
    fs.unlinkSync(intelPath);

    console.log("AI Analyzer Tests Passed!\n");
}

runTests();
