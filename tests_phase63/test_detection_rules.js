const DetectionRuleEngine = require('../src/rules/detectionRuleEngine');

async function runDetectionTests() {
    console.log("--- Phase 63: Detection Rule Engine Test Suite ---");

    const engine = new DetectionRuleEngine();

    // 1. Legacy CID Detection
    console.log("[TEST] Legacy CID Detection...");
    const bundle1 = { token: 'session=xyz&cid=abcdef1234567890abcdef1234567890' };
    const alerts1 = engine.evaluate(bundle1);
    if (alerts1.length !== 1 || alerts1[0].ruleId !== 'RULE_LEGACY_CID') throw new Error("Legacy CID detection failed");
    console.log("   OK: Regex-based pattern matching verified.");

    // 2. Critical Protocol Detection
    console.log("[TEST] Critical Protocol Detection...");
    const bundle2 = { protocol: 'WEBRTC_LEAK_V1' };
    const alerts2 = engine.evaluate(bundle2);
    if (alerts2.length !== 1 || alerts2[0].severity !== 'CRITICAL') throw new Error("Critical protocol detection failed");
    console.log("   OK: High-severity protocol alerting verified.");

    // 3. Infrastructure Mismatch detection
    console.log("[TEST] CDN Mismatch Detection...");
    const bundle3 = { cdn: 'Cloudflare', path: '/cases/akamai_investigation/B1.hyper' };
    const alerts3 = engine.evaluate(bundle3);
    if (alerts3.length !== 1 || alerts3[0].ruleId !== 'RULE_CDN_MISMATCH') throw new Error("CDN mismatch detection failed");
    console.log("   OK: Cross-field infrastructure mismatch verified.");

    // 4. Clean Bundle
    console.log("[TEST] Clean Bundle Scanning...");
    const bundle4 = { token: 'modern-v2-auth', protocol: 'HLS_AES', cdn: 'Akamai', path: 'case/B.hyper' };
    const alerts4 = engine.evaluate(bundle4);
    if (alerts4.length !== 0) throw new Error("False positive detected on clean bundle");
    console.log("   OK: No false positives on clean evidence.");

    console.log("\n[SUCCESS] Phase 63 Detection Rule Engine verified.");
}

runDetectionTests().catch(err => {
    console.error("\n[FAILURE] Detection Test Error:", err);
    process.exit(1);
});
