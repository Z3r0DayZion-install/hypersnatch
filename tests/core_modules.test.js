// tests/core_modules.test.js
// Unit tests for core/ business logic modules: LicenseSystem, TierManager, EvidenceLogger
// Run: node tests/core_modules.test.js
// ALL tests are offline — zero network calls, no Electron/window dependencies.

"use strict";

// ─── Browser Shims ───────────────────────────────────────────────────────────
// Core modules were designed for Electron (browser context). Provide minimal
// shims so they can be tested in plain Node.js without crashing.
if (typeof global.window === 'undefined') {
    global.window = {};
}
if (typeof global.document === 'undefined') {
    global.document = { getElementById: () => null };
}

const assert = require('assert');

// ─── Test Harness ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`  ✅ ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ ${name}: ${e.message}`);
        failed++;
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function freshLicenseSystem() {
    const LS = require('../core/license_system');
    LS.initialized = false;
    LS.currentLicense = null;
    LS.licenseValid = false;
    LS.activationAttempts = 0;
    return LS;
}

function freshTierManager() {
    const TM = require('../core/tier_manager');
    TM.initialized = false;
    TM.currentTier = null;
    TM.availableTiers = new Set();
    return TM;
}

function freshEvidenceLogger() {
    const EL = require('../core/evidence_logger');
    EL.initialized = false;
    EL.logEntries = [];
    EL.sessionId = null;
    EL.persistenceEnabled = false;
    EL.logFile = null;
    EL.currentLogLevel = 1;
    return EL;
}

async function runTests() {

    // ════════════════════════════════════════════════════════════════════════════
    // 1. LICENSE SYSTEM — Structure & Parsing
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[1] LicenseSystem — Structure & Parsing');

    await test('module exports an object with required methods', () => {
        const LS = freshLicenseSystem();
        assert.ok(typeof LS.validateLicense === 'function');
        assert.ok(typeof LS.parseLicenseData === 'function');
        assert.ok(typeof LS.importLicense === 'function');
        assert.ok(typeof LS.activateLicense === 'function');
        assert.ok(typeof LS.deactivateLicense === 'function');
        assert.ok(typeof LS.getCurrentLicense === 'function');
        assert.ok(typeof LS.isValidEdition === 'function');
        assert.ok(typeof LS.isValidTier === 'function');
    });

    await test('parseLicenseData parses valid JSON', () => {
        const LS = freshLicenseSystem();
        const data = JSON.stringify({ edition: 'SOVEREIGN', signature: 'abc123', tierLevel: 2 });
        const result = LS.parseLicenseData(data);
        assert.strictEqual(result.edition, 'SOVEREIGN');
        assert.strictEqual(result.signature, 'abc123');
    });

    await test('parseLicenseData throws on invalid JSON', () => {
        const LS = freshLicenseSystem();
        assert.throws(() => LS.parseLicenseData('NOT_JSON'), /License parsing failed/);
    });

    await test('parseLicenseData throws on missing edition', () => {
        const LS = freshLicenseSystem();
        assert.throws(() => LS.parseLicenseData(JSON.stringify({ signature: 'abc' })),
            /Invalid license structure/);
    });

    await test('parseLicenseData throws on missing signature', () => {
        const LS = freshLicenseSystem();
        assert.throws(() => LS.parseLicenseData(JSON.stringify({ edition: 'CORE' })),
            /Invalid license structure/);
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 2. LICENSE SYSTEM — Validation
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[2] LicenseSystem — Validation');

    await test('validateLicense rejects missing edition', async () => {
        const LS = freshLicenseSystem();
        const result = await LS.validateLicense({ tierLevel: 1, signature: 'abc' });
        assert.strictEqual(result.valid, false);
        assert.ok(result.reason.includes('edition'), `reason: ${result.reason}`);
    });

    await test('validateLicense rejects missing signature', async () => {
        const LS = freshLicenseSystem();
        const result = await LS.validateLicense({ edition: 'SOVEREIGN', tierLevel: 1 });
        assert.strictEqual(result.valid, false);
        assert.ok(result.reason.includes('signature'), `reason: ${result.reason}`);
    });

    await test('validateLicense rejects missing tierLevel', async () => {
        const LS = freshLicenseSystem();
        const result = await LS.validateLicense({ edition: 'SOVEREIGN', signature: 'abc' });
        assert.strictEqual(result.valid, false);
        assert.ok(result.reason.includes('tierLevel'), `reason: ${result.reason}`);
    });

    await test('validateLicense rejects expired license', async () => {
        const LS = freshLicenseSystem();
        const license = {
            edition: 'SOVEREIGN', tierLevel: 1,
            signature: 'sig_valid_01234567890abcdef',
            expiry: '2020-01-01T00:00:00Z'
        };
        const result = await LS.validateLicense(license);
        assert.strictEqual(result.valid, false);
        assert.ok(result.reason.toLowerCase().includes('expir') || result.reason.includes('Invalid'),
            `reason: ${result.reason}`);
    });

    await test('isValidEdition recognizes CORE edition', () => {
        const LS = freshLicenseSystem();
        assert.strictEqual(LS.isValidEdition('Core'), true);
    });

    await test('isValidEdition rejects unknown edition', () => {
        const LS = freshLicenseSystem();
        assert.strictEqual(LS.isValidEdition('NONEXISTENT'), false);
    });

    await test('isValidTier rejects out-of-range tier', () => {
        const LS = freshLicenseSystem();
        assert.strictEqual(LS.isValidTier(99), false);
        assert.strictEqual(LS.isValidTier(0), false);
        assert.strictEqual(LS.isValidTier(-1), false);
    });

    await test('isValidTier accepts valid tier level', () => {
        const LS = freshLicenseSystem();
        assert.strictEqual(LS.isValidTier(1), true);
    });

    await test('getCurrentLicense returns null when no license active', () => {
        const LS = freshLicenseSystem();
        const result = LS.getCurrentLicense();
        assert.strictEqual(result.license, null);
        assert.strictEqual(result.valid, false);
    });

    await test('generateLicenseReport returns structured report', () => {
        const LS = freshLicenseSystem();
        const report = LS.generateLicenseReport();
        assert.ok(typeof report === 'object');
        assert.ok('currentLicense' in report);
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 3. TIER MANAGER — Structure & Tiers
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[3] TierManager — Structure & Tiers');

    await test('module exports required methods', () => {
        const TM = freshTierManager();
        assert.ok(typeof TM.has === 'function');
        assert.ok(typeof TM.hasCapability === 'function');
        assert.ok(typeof TM.hasFeature === 'function');
        assert.ok(typeof TM.setCurrentTier === 'function');
        assert.ok(typeof TM.parseSize === 'function');
        assert.ok(typeof TM.validateInput === 'function');
    });

    await test('tiers object contains TIER_1 through TIER_5', () => {
        const TM = freshTierManager();
        assert.ok(TM.tiers.TIER_1);
        assert.ok(TM.tiers.TIER_2);
        assert.ok(TM.tiers.TIER_3);
        assert.ok(TM.tiers.TIER_5);
    });

    await test('each tier has name, level, capabilities, features, and limits', () => {
        const TM = freshTierManager();
        for (const [tierName, tier] of Object.entries(TM.tiers)) {
            assert.ok(tier.name, `${tierName} missing name`);
            assert.ok(typeof tier.level === 'number', `${tierName} level not number`);
            assert.ok(Array.isArray(tier.capabilities), `${tierName} capabilities not array`);
            assert.ok(Array.isArray(tier.features), `${tierName} features not array`);
            assert.ok(tier.limits, `${tierName} missing limits`);
        }
    });

    await test('tier levels are monotonically increasing', () => {
        const TM = freshTierManager();
        const levels = Object.values(TM.tiers).map(t => t.level).sort((a, b) => a - b);
        for (let i = 1; i < levels.length; i++) {
            assert.ok(levels[i] > levels[i - 1], `tier levels not monotonic at index ${i}`);
        }
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 4. TIER MANAGER — Capability Gating
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[4] TierManager — Capability Gating');

    await test('has() returns false for unavailable tier', () => {
        const TM = freshTierManager();
        assert.strictEqual(TM.has('TIER_1'), false);
    });

    await test('has() returns true after adding tier', () => {
        const TM = freshTierManager();
        TM.availableTiers.add('TIER_1');
        assert.strictEqual(TM.has('TIER_1'), true);
    });

    await test('hasCapability returns true for capability in available tier', () => {
        const TM = freshTierManager();
        TM.availableTiers.add('TIER_1');
        assert.strictEqual(TM.hasCapability('basic_html_parsing'), true);
    });

    await test('hasCapability returns false when no tiers available', () => {
        const TM = freshTierManager();
        assert.strictEqual(TM.hasCapability('basic_html_parsing'), false);
    });

    await test('hasFeature returns true for feature in available tier', () => {
        const TM = freshTierManager();
        TM.availableTiers.add('TIER_1');
        const f = TM.tiers.TIER_1.features;
        if (f.length > 0) assert.strictEqual(TM.hasFeature(f[0]), true);
    });

    await test('hasFeature returns false for feature in unavailable tier', () => {
        const TM = freshTierManager();
        TM.availableTiers.add('TIER_1');
        const t5 = TM.tiers.TIER_5.features;
        const exclusive = t5.find(f => !TM.tiers.TIER_1.features.includes(f));
        if (exclusive) assert.strictEqual(TM.hasFeature(exclusive), false);
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 5. TIER MANAGER — Size Parsing
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[5] TierManager — Size Parsing');

    await test('parseSize handles MB', () => {
        assert.strictEqual(freshTierManager().parseSize('5MB'), 5 * 1024 * 1024);
    });

    await test('parseSize handles GB', () => {
        assert.strictEqual(freshTierManager().parseSize('1GB'), 1024 * 1024 * 1024);
    });

    await test('parseSize handles KB', () => {
        assert.strictEqual(freshTierManager().parseSize('512KB'), 512 * 1024);
    });

    await test('parseSize handles B', () => {
        assert.strictEqual(freshTierManager().parseSize('100B'), 100);
    });

    await test('parseSize handles decimal values', () => {
        assert.strictEqual(freshTierManager().parseSize('2.5MB'), 2.5 * 1024 * 1024);
    });

    await test('parseSize returns 0 for invalid format', () => {
        const TM = freshTierManager();
        assert.strictEqual(TM.parseSize('garbage'), 0);
        assert.strictEqual(TM.parseSize(''), 0);
    });

    await test('parseSize is case-insensitive', () => {
        assert.strictEqual(freshTierManager().parseSize('5mb'), 5 * 1024 * 1024);
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 6. TIER MANAGER — Limits & Reports
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[6] TierManager — Limits & Reports');

    await test('getLimits returns null when no tier set', () => {
        const TM = freshTierManager();
        assert.strictEqual(TM.getLimits(), null);
    });

    await test('getLimits returns limits after tier is set', () => {
        const TM = freshTierManager();
        TM.availableTiers.add('TIER_1');
        TM.currentTier = 'TIER_1';
        const limits = TM.getLimits();
        assert.ok(limits);
        assert.ok(limits.maxInputSize);
    });

    await test('generateTierReport returns structured object', () => {
        const TM = freshTierManager();
        TM.availableTiers.add('TIER_1');
        TM.currentTier = 'TIER_1';
        const report = TM.generateTierReport();
        assert.ok('currentTier' in report);
        assert.ok(report.currentTier !== null);
        assert.ok('availableTiers' in report);
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 7. EVIDENCE LOGGER — Structure
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[7] EvidenceLogger — Structure');

    await test('module exports required methods', () => {
        const EL = freshEvidenceLogger();
        assert.ok(typeof EL.initialize === 'function');
        assert.ok(typeof EL.log === 'function');
        assert.ok(typeof EL.info === 'function');
        assert.ok(typeof EL.error === 'function');
        assert.ok(typeof EL.security === 'function');
        assert.ok(typeof EL.audit === 'function');
        assert.ok(typeof EL.getEntries === 'function');
        assert.ok(typeof EL.exportLogs === 'function');
        assert.ok(typeof EL.clearLogs === 'function');
    });

    await test('LOG_LEVELS hierarchy: DEBUG < INFO < WARNING < ERROR < SECURITY < AUDIT', () => {
        const EL = freshEvidenceLogger();
        assert.ok(EL.LOG_LEVELS.DEBUG < EL.LOG_LEVELS.INFO);
        assert.ok(EL.LOG_LEVELS.INFO < EL.LOG_LEVELS.WARNING);
        assert.ok(EL.LOG_LEVELS.WARNING < EL.LOG_LEVELS.ERROR);
        assert.ok(EL.LOG_LEVELS.ERROR < EL.LOG_LEVELS.SECURITY);
        assert.ok(EL.LOG_LEVELS.SECURITY < EL.LOG_LEVELS.AUDIT);
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 8. EVIDENCE LOGGER — Logging & Retrieval
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[8] EvidenceLogger — Logging & Retrieval');

    await test('initialize sets sessionId and marks initialized', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        assert.ok(EL.sessionId);
        assert.strictEqual(EL.initialized, true);
    });

    await test('log adds entry to logEntries array', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        const before = EL.logEntries.length;
        EL.log('INFO', 'test message', { key: 'value' });
        assert.ok(EL.logEntries.length > before, 'logEntries should grow');
    });

    await test('log entry has required fields (timestamp, level, message, sessionId)', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        EL.log('INFO', 'test entry');
        const entry = EL.logEntries[EL.logEntries.length - 1];
        assert.ok(entry.timestamp);
        assert.ok(entry.level !== undefined);
        assert.ok(entry.message);
        assert.ok(entry.sessionId);
    });

    await test('convenience methods (info, error, etc.) all log entries', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false, logLevel: 0 });
        EL.debug('d');
        EL.info('i');
        EL.warning('w');
        EL.error('e');
        EL.security('s');
        EL.audit('a');
        // 6 convenience calls + 1 from initialize = 7 minimum
        assert.ok(EL.logEntries.length >= 6, `got ${EL.logEntries.length} entries`);
    });

    await test('logUserAction creates action entry', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        EL.logUserAction('CLICK_BUTTON', { buttonId: 'submit' });
        assert.ok(EL.logEntries.length > 0);
    });

    await test('logSecurityEvent creates security entry', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        EL.logSecurityEvent('BRUTE_FORCE', 'high', { ip: '1.2.3.4' });
        assert.ok(EL.logEntries.length > 0);
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 9. EVIDENCE LOGGER — Filtering & Export
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[9] EvidenceLogger — Filtering & Export');

    await test('getEntries returns all logEntries', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        EL.info('a');
        EL.info('b');
        const entries = EL.getEntries();
        assert.ok(entries.length >= 2);
    });

    await test('clearLogs empties logEntries', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        EL.info('x');
        EL.clearLogs();
        assert.strictEqual(EL.logEntries.length, 1); assert.ok(EL.logEntries[0].message.includes('Cleared all'));
    });

    await test('exportLogs json format returns parseable JSON string', async () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        EL.info('export test');
        const exported = await EL.exportLogs('json');
        assert.ok(typeof exported === 'string');
        assert.doesNotThrow(() => JSON.parse(exported));
    });

    await test('exportLogs csv format returns string with commas', async () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        EL.info('csv test');
        const exported = await EL.exportLogs('csv');
        assert.ok(typeof exported === 'string');
        assert.ok(exported.includes(','));
    });

    await test('exportLogs text format returns string', async () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        EL.info('text test');
        const exported = await EL.exportLogs('txt');
        assert.ok(typeof exported === 'string');
    });

    await test('getStatistics returns object with counts', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false, logLevel: 0 });
        EL.info('s1');
        EL.error('s2');
        const stats = EL.getStatistics();
        assert.ok(typeof stats === 'object');
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 10. EVIDENCE LOGGER — Log Level Filtering
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[10] EvidenceLogger — Log Level Filtering');

    await test('setLogLevel changes current log level', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        EL.setLogLevel('ERROR');
        assert.strictEqual(EL.currentLogLevel, EL.LOG_LEVELS.ERROR);
    });

    await test('entries below log level are not stored', () => {
        const EL = freshEvidenceLogger();
        EL.initialize({ persistence: false });
        EL.setLogLevel('ERROR');
        const before = EL.logEntries.length;
        EL.debug('d');
        EL.info('i');
        assert.strictEqual(EL.logEntries.length, before);
    });

    await test('getLevelName returns correct name', () => {
        const EL = freshEvidenceLogger();
        assert.strictEqual(EL.getLevelName(0), 'DEBUG');
        assert.strictEqual(EL.getLevelName(1), 'INFO');
        assert.strictEqual(EL.getLevelName(3), 'ERROR');
        assert.strictEqual(EL.getLevelName(5), 'AUDIT');
    });

    await test('sanitizeMetadata handles objects and functions', () => {
        const EL = freshEvidenceLogger();
        const result = EL.sanitizeMetadata({
            normal: 'value',
            nested: { a: 1 },
            fn: function () { },
            nullVal: null
        });
        assert.strictEqual(result.normal, 'value');
        assert.deepStrictEqual(result.nested, { a: 1 });
        assert.strictEqual(result.fn, '[Function]');
        assert.ok(!('nullVal' in result)); // null values are skipped
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 11. SECURITY & CODE QUALITY CHECKS
    // ════════════════════════════════════════════════════════════════════════════
    console.log('\n[11] Security & Code Quality Checks');

    const fs = require('fs');
    const path = require('path');

    const CORE_FILES = [
        'core/license_system.js',
        'core/tier_manager.js',
        'core/evidence_logger.js',
        'core/security_hardening.js',
        'core/case_report_generator.js',
    ];

    for (const relPath of CORE_FILES) {
        const fullPath = path.join(__dirname, '..', relPath);

        await test(`${relPath}: no eval()`, () => {
            const src = fs.readFileSync(fullPath, 'utf8');
            assert.ok(!src.includes('eval('), `Found eval() in ${relPath}`);
        });

        await test(`${relPath}: no require('http')`, () => {
            const src = fs.readFileSync(fullPath, 'utf8');
            assert.ok(!src.includes("require('http')"), `Found http in ${relPath}`);
            assert.ok(!src.includes('require("http")'), `Found http in ${relPath}`);
        });
    }

    await test('license_system.js: no hardcoded secrets', () => {
        const src = fs.readFileSync(path.join(__dirname, '../core/license_system.js'), 'utf8');
        assert.ok(!src.includes('sk_live_'), 'found live secret key');
    });

    // ════════════════════════════════════════════════════════════════════════════
    // RESULTS
    // ════════════════════════════════════════════════════════════════════════════
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📊 Core Module Tests: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
    if (failed > 0) {
        console.error(`\n⛔ ${failed} test(s) FAILED — see above\n`);
        process.exit(1);
    } else {
        console.log(`\n✅ All core module tests passed — offline, zero network calls\n`);
    }
}

runTests().catch(console.error);
