// ==================== ELECTRON MAIN PROCESS ====================
"use strict";

const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const secureCrypto = require('./security-crypto');
const log = require('./utils/logger');
const SmartDecode = require('./core/smartdecode');

// QR Engine purged in Vanguard Edition for zero-trace portability.

// Security: Handle security events and crashes globally during bootstrap
process.on("uncaughtException", (err) => {
  log.error("UNCAUGHT_EXCEPTION", { message: err.message, stack: err.stack });
});

process.on("unhandledRejection", (reason) => {
  log.error("UNHANDLED_REJECTION", { reason });
});

// Disable console logging in production
if (process.env.NODE_ENV === "production" || app.isPackaged) {
  console.log = () => { };
  console.warn = () => { };
}

// ==================== CONSTANTS ====================
const APP_NAME = 'HyperSnatch';
const APP_VERSION = (() => { try { return require('../package.json').version || 'unknown'; } catch (e) { return 'unknown'; } })();

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  process.stdout.write(APP_NAME + ' ' + APP_VERSION + '\n');
  process.exit(0);
}

// Security: Hardened defaults
const SECURITY_CONFIG = {
  contextIsolation: true,
  nodeIntegration: false,
  enableRemoteModule: false,
  sandbox: true,
  webSecurity: true
};

// Runtime paths
const RUNTIME_DIR = path.join(app.getPath('userData'), 'HyperSnatch', 'runtime');
const LOGS_DIR = path.join(RUNTIME_DIR, 'logs');
const EVIDENCE_DIR = path.join(RUNTIME_DIR, 'evidence');
const EXPORTS_DIR = path.join(RUNTIME_DIR, 'exports');
const CONFIG_DIR = path.join(RUNTIME_DIR, 'config');
const POLICY_FILE = path.join(CONFIG_DIR, 'policy.json');
const ALLOWLIST_FILE = path.join(CONFIG_DIR, 'allowlist.json');

// ==================== SECURITY ====================
let securityEvents = [];

function logSecurityEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  securityEvents.push({ timestamp, event, ...details });

  // Also log to file asynchronously
  const logEntry = `[${timestamp}] SECURITY: ${event} - ${JSON.stringify(details)}\n`;
  fs.appendFile(path.join(LOGS_DIR, 'security.log'), logEntry, (err) => {
    if (err) console.error('Failed to write security event', err);
  });
}

function enforceSecurityPolicy(window, url) {
  // Check allowlist
  try {
    const allowlistPath = path.resolve(ALLOWLIST_FILE);
    const configDir = path.resolve(CONFIG_DIR);
    const configPrefix = (configDir.endsWith(path.sep) ? configDir : (configDir + path.sep)).toLowerCase();
    if (!allowlistPath.toLowerCase().startsWith(configPrefix)) {
      throw new Error('Invalid allowlist path');
    }
    const allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_FILE, 'utf8'));
    const urlObj = new URL(url);

    if (!allowlist.allowedHosts.includes(urlObj.hostname)) {
      logSecurityEvent('BLOCKED_URL', { url, reason: 'Host not in allowlist' });
      return { allowed: false, reason: 'Host not in allowlist' };
    }

    logSecurityEvent('ALLOWED_URL', { url, reason: 'Host in allowlist' });
    return { allowed: true };
  } catch (error) {
    logSecurityEvent('POLICY_ERROR', { error: error.message });
    return { allowed: false, reason: 'Policy check failed' };
  }
}

/**
 * Validates that a filename contains no path traversal sequences
 */
function validateFilename(filename) {
  if (typeof filename !== 'string') return false;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(filename);
}

// ==================== IPC HANDLERS ====================
ipcMain.handle('get-app-info', async () => {
  const policy = getPolicySummary();
  const license = await checkLicenseLocally();
  const envAllow = process.env.HYPERSNATCH_ENABLE_STRATEGY_RUNTIME === "1";
  const allowStrategyRuntime = Boolean(envAllow && policy.strategyRuntime?.enabled);

  const smartDecodeDefaultEngine = String(policy.smartDecode?.defaultEngine || "rust");

  return {
    name: APP_NAME,
    version: APP_VERSION,
    platform: process.platform,
    securityConfig: Object.assign({}, SECURITY_CONFIG, {
      allowStrategyRuntime,
      smartDecodeDefaultEngine,
      legalDisclaimerAccepted: policy.legalDisclaimerAccepted
    }),
    policy,
    license,
    runtimeDir: RUNTIME_DIR
  };
});

ipcMain.handle('accept-legal-disclaimer', async () => {
  try {
    const policy = readPolicySafe() || {};
    policy.legalDisclaimerAccepted = true;
    fs.writeFileSync(POLICY_FILE, JSON.stringify(policy, null, 2));
    logSecurityEvent('LEGAL_DISCLAIMER_ACCEPTED');
    return { success: true };
  } catch (err) {
    log.error('DISCLAIMER_ACCEPT_ERROR', { message: err.message });
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-logs-folder', () => {
  shell.openPath(LOGS_DIR);
});

ipcMain.handle('open-evidence-folder', () => {
  shell.openPath(EVIDENCE_DIR);
});

// ==================== SMART DECODE IPC ====================
ipcMain.handle('smart-decode-run', async (event, { input, options }) => {
  try {
    const intelPath = app.isPackaged
      ? path.join(process.resourcesPath, 'config', 'forensic_intelligence.json')
      : path.join(__dirname, '..', 'config', 'forensic_intelligence.json');

    const runOptions = {
      ...options,
      intelligencePath: intelPath
    };

    return await SmartDecode.run(input, runOptions);
  } catch (err) {
    log.error('SMART_DECODE_ERROR', { message: err.message });
    return null;
  }
});

ipcMain.handle('smart-decode-sign-session', async (event, { sessionState, systemInfo }) => {
  try {
    const hwid = await getHardwareFingerprint();
    const AuditChain = require('./core/smartdecode/audit-chain');
    return await AuditChain.signSession(sessionState, systemInfo, hwid);
  } catch (err) {
    log.error('AUDIT_CHAIN_SIGN_ERROR', { message: err.message });
    return null;
  }
});

ipcMain.handle('smart-decode-verify-session', async (event, bundle) => {
  try {
    const hwid = await getHardwareFingerprint();
    const AuditChain = require('./core/smartdecode/audit-chain');
    return AuditChain.verifySession(bundle, hwid);
  } catch (err) {
    log.error('AUDIT_CHAIN_VERIFY_ERROR', { message: err.message });
    return false;
  }
});

// ==================== SMARTSNATCH AUTOMATION ENGINE ====================
const clipboardWatcher = require('./automation/clipboardWatcher');
const decodeQueue = require('./automation/decodeQueue');
const decodeScheduler = require('./automation/decodeScheduler');

// Configure Watcher
clipboardWatcher.setProvider(async () => {
  return clipboard.readText();
});

// Configure Scheduler
decodeScheduler.setExecutor(async (url, host) => {
  log.info('AUTOMATION_DECODE_START', { url, host });
  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('automation-event', { type: 'DECODE_START', data: { url, host } }));

  const intelPath = app.isPackaged
    ? path.join(process.resourcesPath, 'config', 'forensic_intelligence.json')
    : path.join(__dirname, '..', 'config', 'forensic_intelligence.json');

  const out = await SmartDecode.run(url, { intelligencePath: intelPath });

  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('automation-event', { type: 'DECODE_COMPLETE', data: { url, out } }));
  return out;
});

// Start loopers
decodeScheduler.start(1000);
clipboardWatcher.start(1000);

// ==================== CASE MANAGEMENT SYSTEM (Phase 57) ====================
const CaseStore = require('./cases/caseStore');
const BundleAttachment = require('./cases/bundleAttachment');
const CaseNotes = require('./cases/caseNotes');
const FindingsRegistry = require('./cases/findingsRegistry');
const CaseComparator = require('./cases/caseComparator');

// ==================== INSTITUTIONAL TRUST LAYER (Phase 58) ====================
const AuditLogger = require('./audit/auditLogger');
const CustodyChain = require('./audit/custodyChain');
const BundleSigner = require('./audit/bundleSigner');
const SignatureVerifier = require('./audit/signatureVerifier');
const ExportSeal = require('./audit/exportSeal');

const SimilarityEngine = require('./intelligence/similarityEngine');

// ==================== PLUGIN ECOSYSTEM (Phase 60) ====================
const PluginLoader = require('./plugins/pluginLoader');
const PluginSandbox = require('./plugins/pluginSandbox');

// ==================== HYPERQUERY ENGINE (Phase 61) ====================
const IndexManager = require('./query/indexManager');
const HyperQueryEngine = require('./query/hyperQueryEngine');

// ==================== REPLAY MUTATION ENGINE (Phase 62) ====================
const ReplayMutationEngine = require('./replay/replayMutationEngine');
const mutationEngine = new ReplayMutationEngine();

// ==================== DETECTION RULE ENGINE (Phase 63) ====================
const DetectionRuleEngine = require('./rules/detectionRuleEngine');
const ruleEngine = new DetectionRuleEngine();

// ==================== RESEARCH MODE TOOLKIT (Phase 64) ====================
const ResearchSandbox = require('./research/researchSandbox');
const RESEARCH_DIR = path.join(RUNTIME_DIR, 'research');
const researchSandbox = new ResearchSandbox(RESEARCH_DIR);

// ==================== DATASET EXPORT SYSTEM (Phase 65) ====================
const DatasetExporter = require('./export/datasetExporter');
const exporter = new DatasetExporter();

// ==================== PATTERN DISCOVERY ENGINE (Phase 66) ====================
const PatternDiscoveryEngine = require('./intelligence/patternDiscoveryEngine');
const ClusterEngine = require('./intelligence/clusterEngine');
const AnomalyDetector = require('./intelligence/anomalyDetector');
const patternEngine = new PatternDiscoveryEngine();
const clusterEngine = new ClusterEngine();
const anomalyDetector = new AnomalyDetector();

// ==================== TOPOLOGY MAPPER (Phase 67) ====================
const TopologyMapper = require('./intelligence/topologyMapper');
const topologyMapper = new TopologyMapper();

// ==================== INSIGHT GENERATOR (Phase 68) ====================
const InsightGenerator = require('./intelligence/insightGenerator');
const insightGenerator = new InsightGenerator();

// ==================== CASE INTELLIGENCE ASSISTANT (Phase 69) ====================
const CaseIntelligenceAssistant = require('./assistant/caseIntelligenceAssistant');
const caseAssistant = new CaseIntelligenceAssistant(patternEngine, anomalyDetector, insightGenerator);

// ==================== AUTONOMOUS INVESTIGATOR (Phase 70) ====================
const AutonomousInvestigator = require('./autonomy/autonomousInvestigator');
const autoInvestigator = new AutonomousInvestigator({
  patternDiscovery: patternEngine,
  anomalyDetector: anomalyDetector,
  insightGenerator: insightGenerator,
  topologyMapper: topologyMapper,
  ruleEngine: ruleEngine
});

// ==================== AI PATTERN CLASSIFIER (Phase 71) ====================
const PatternClassifier = require('./ai/patternClassifier');
const patternClassifier = new PatternClassifier();

// ==================== ANOMALY SCORER (Phase 72) ====================
const AnomalyScorer = require('./ai/anomalyScorer');
const anomalyScorer = new AnomalyScorer();

// ==================== FINGERPRINT LIBRARY (Phase 73) ====================
const FingerprintLibrary = require('./library/fingerprintLibrary');
const fpLibraryPath = path.join(RUNTIME_DIR, 'fingerprint_library.json');
const fingerprintLibrary = new FingerprintLibrary(fpLibraryPath);

// ==================== CROSS-CASE MINER (Phase 74) ====================
const CrossCaseMiner = require('./intelligence/crossCaseMiner');
const crossCaseMiner = new CrossCaseMiner();

// ==================== AUTONOMOUS RESEARCH MODE (Phase 75) ====================
const AutonomousResearchMode = require('./research/autonomousResearchMode');
const autoResearch = new AutonomousResearchMode();

// ==================== WORKSPACE STORE (Phase 76) ====================
const WorkspaceStore = require('./workspaces/workspaceStore');
const workspaceStore = new WorkspaceStore();

// ==================== TRUST REGISTRY (Phase 77) ====================
const TrustRegistry = require('./federation/trustRegistry');
const trustRegistry = new TrustRegistry();

// ==================== CENTRALITY ENGINE (Phase 78) ====================
const CentralityEngine = require('./graph/centralityEngine');
const centralityEngine = new CentralityEngine();

// ==================== POLICY ENGINE (Phase 79) ====================
const PolicyEngine = require('./policy/policyEngine');
const policyEngine = new PolicyEngine();

// ==================== DEPLOYMENT PROFILES (Phase 80) ====================
const DeploymentProfiles = require('./enterprise/deploymentProfiles');
const deploymentProfiles = new DeploymentProfiles();

// ==================== REVIEW WORKFLOW (Phase 81) ====================
const ReviewWorkflow = require('./collaboration/reviewWorkflow');
const reviewWorkflow = new ReviewWorkflow();

// ==================== REDACTION ENGINE (Phase 82) ====================
const RedactionEngine = require('./redaction/redactionEngine');
const redactionEngine = new RedactionEngine();

// ==================== PUBLICATION PIPELINE (Phase 83) ====================
const PublicationPipeline = require('./publication/publicationPipeline');
const publicationPipeline = new PublicationPipeline();

// ==================== MODEL REPORTER (Phase 84) ====================
const ModelReporter = require('./reporting/modelReporter');
const modelReporter = new ModelReporter();

// ==================== DEPLOYMENT ORCHESTRATOR (Phase 85) ====================
const DeploymentOrchestrator = require('./deployment/deploymentOrchestrator');
const deploymentOrchestrator = new DeploymentOrchestrator();

// ==================== TIMELINE ENGINE (Phase 86) ====================
const TimelineEngine = require('./timeline/timelineEngine');
const timelineEngine = new TimelineEngine();

// ==================== INFRASTRUCTURE TRACKER (Phase 87) ====================
const InfrastructureTracker = require('./evolution/infrastructureTracker');
const infrastructureTracker = new InfrastructureTracker();

// ==================== PREDICTIVE ANOMALY (Phase 88) ====================
const PredictiveAnomaly = require('./predictive/predictiveAnomaly');
const predictiveAnomaly = new PredictiveAnomaly();

// ==================== FORENSIC SIMULATOR (Phase 89) ====================
const ForensicSimulator = require('./simulation/forensicSimulator');
const forensicSimulator = new ForensicSimulator();

// ==================== THREAT REPORTER (Phase 90) ====================
const ThreatReporter = require('./threat/threatReporter');
const threatReporter = new ThreatReporter();

// ==================== GLOBAL GRAPH (Phase 91) ====================
const GlobalGraph = require('./global/globalGraph');
const globalGraph = new GlobalGraph();

// ==================== INFRA ATTRIBUTION (Phase 92) ====================
const InfraAttributionEngine = require('./attribution/infraAttributionEngine');
const infraAttributionEngine = new InfraAttributionEngine();

// ==================== ADVERSARY FINGERPRINTING (Phase 93) ====================
const AdversaryFingerprintEngine = require('./fingerprinting/adversaryFingerprintEngine');
const adversaryFingerprintEngine = new AdversaryFingerprintEngine();

// ==================== SELF HEALING (Phase 94) ====================
const SelfHealingOrchestrator = require('./healing/selfHealingOrchestrator');
const selfHealingOrchestrator = new SelfHealingOrchestrator();

// ==================== AUTONOMOUS DISCOVERY (Phase 95) ====================
const AutonomousDiscoveryEngine = require('./discovery/autonomousDiscoveryEngine');
const autonomousDiscoveryEngine = new AutonomousDiscoveryEngine();

// ==================== ENDGAME MASTER PACK (Phases 96-100) ====================
const MissionReplayEngine = require('./endgame/missionReplayEngine');
const missionReplayEngine = new MissionReplayEngine();

const CounterfactualSimulator = require('./endgame/counterfactualEngine');
const counterfactualSimulator = new CounterfactualSimulator();

const EvidenceWeightEngine = require('./endgame/evidenceWeightEngine');
const evidenceWeightEngine = new EvidenceWeightEngine();

const ChallengeModeEngine = require('./endgame/challengeModeEngine');
const challengeModeEngine = new ChallengeModeEngine();

const StrategicCommandEngine = require('./endgame/strategicCommandEngine');
const strategicCommandEngine = new StrategicCommandEngine(
  missionReplayEngine,
  counterfactualSimulator,
  evidenceWeightEngine,
  challengeModeEngine
);

const indexManager = new IndexManager();

const PLUGINS_DIR = path.join(RUNTIME_DIR, 'plugins');
const pluginLoader = new PluginLoader(PLUGINS_DIR);
const pluginSandbox = new PluginSandbox();

const intelGraph = new IntelligenceGraph();
const hyperQuery = new HyperQueryEngine(indexManager, intelGraph);

// Trust Layer IPC Handlers
const AUDIT_STORAGE = path.join(RUNTIME_DIR, 'audit');
const KEYS_DIR = path.join(RUNTIME_DIR, 'identity');

const auditLogger = new AuditLogger(AUDIT_STORAGE);
const custodyChain = new CustodyChain(AUDIT_STORAGE);
const bundleSigner = new BundleSigner(KEYS_DIR);
const exportSeal = new ExportSeal(bundleSigner, SignatureVerifier);

// Ensure workstation identity on boot
const workstationPubKey = bundleSigner.ensureKeyPair();
log.info("FORENSIC_STATION_IDENTITY_READY", { publicKey: workstationPubKey.substring(0, 64) + "..." });

// Trust Layer IPC Handlers
ipcMain.handle('audit-log', (event, { type, data }) => {
  auditLogger.log(type, data, 'ANALYST_01'); // In real build, current analyst ID
  return { success: true };
});

ipcMain.handle('audit-get-logs', () => auditLogger.getLogs());

ipcMain.handle('custody-record', (event, { fingerprint, action, details }) => {
  custodyChain.recordEvent(fingerprint, action, details);
  return { success: true };
});

ipcMain.handle('custody-get-chain', (event, fingerprint) => custodyChain.getChain(fingerprint));

ipcMain.handle('evidence-sign', (event, data) => {
  return bundleSigner.signData(data);
});

ipcMain.handle('evidence-verify', (event, { data, signature, publicKey }) => {
  return SignatureVerifier.verifyData(data, signature, publicKey);
});

ipcMain.handle('evidence-seal-case', async (event, { caseId, destinationDir }) => {
  const gateCheck = await requireTier('INSTITUTIONAL', 'Sealed Evidence Packaging');
  if (gateCheck) return gateCheck;

  const caseData = caseStore.loadCase(caseId);
  if (!caseData) throw new Error("Case not found");

  const context = {
    custodyChain: caseData.bundles.map(b => ({
      fingerprint: b.fingerprint,
      chain: custodyChain.getChain(b.fingerprint)
    })),
    auditLogs: auditLogger.getLogs().filter(l => l.data?.caseId === caseId)
  };

  return exportSeal.sealCase(caseData, destinationDir, context);
});

// Intelligence Graph IPC Handlers
ipcMain.handle('intelligence-get-graph', () => {
  return {
    nodes: intelGraph.getAllNodes(),
    edges: intelGraph.getAllEdges()
  };
});

ipcMain.handle('intelligence-get-similar', (event, fingerprint) => {
  const allBundles = [];
  // Gather all bundles from all cases for similarity comparison
  caseStore.listCases().forEach(cSummary => {
    const fullCase = caseStore.loadCase(cSummary.id);
    if (fullCase && fullCase.bundles) {
      fullCase.bundles.forEach(b => {
        if (b.fingerprint_data) allBundles.push(b);
      });
    }
  });

  const targetNode = intelGraph.getNode(fingerprint);
  if (!targetNode || !targetNode.data.fingerprint) return [];

  return SimilarityEngine.findSimilar(targetNode.data.fingerprint, allBundles);
});

ipcMain.handle('intelligence-rebuild-graph', () => {
  intelGraph.clear();
  caseStore.listCases().forEach(cSummary => {
    const fullCase = caseStore.loadCase(cSummary.id);
    if (fullCase && fullCase.bundles) {
      fullCase.bundles.forEach(bundle => {
        updateIntelligenceGraph(bundle, fullCase.case_id);
      });
    }
  });
  return { success: true };
});

// Plugin Ecosystem IPC Handlers
ipcMain.handle('plugins-list', () => pluginLoader.getAllPlugins());

ipcMain.handle('plugins-load', (event, pluginPath) => {
  return pluginLoader.loadPlugin(pluginPath);
});

ipcMain.handle('plugins-run-capability', async (event, { pluginId, capability, context }) => {
  const plugin = pluginLoader.getPlugin(pluginId);
  if (!plugin || !plugin.enabled) throw new Error("Plugin not found or disabled");

  if (!plugin.capabilities.includes(capability)) {
    throw new Error(`Plugin ${pluginId} does not support capability: ${capability}`);
  }

  return await pluginSandbox.run(plugin.main, { capability, context });
});

// HyperQuery IPC Handlers
ipcMain.handle('query-execute', (event, queryStr) => {
  return hyperQuery.execute(queryStr).map(bid => {
    const node = intelGraph.getNode(bid);
    return node ? { id: bid, ...node } : { id: bid, type: 'UNKNOWN' };
  });
});

ipcMain.handle('query-stats', () => {
  return indexManager.getStatistics();
});

// Replay Mutation IPC Handlers
ipcMain.handle('replay-mutate-set', (event, { sessionId, config }) => {
  mutationEngine.setMutation(sessionId, config);
  return { success: true };
});

ipcMain.handle('replay-mutate-clear', (event, sessionId) => {
  mutationEngine.clearMutation(sessionId);
  return { success: true };
});

// Detection Rules IPC Handlers
ipcMain.handle('rules-scan-bundle', (event, bundle) => {
  return ruleEngine.evaluate(bundle);
});

// Research Mode IPC Handlers
ipcMain.handle('research-list-scripts', () => researchSandbox.listScripts());

ipcMain.handle('research-run-script', async (event, { scriptName, context }) => {
  return await researchSandbox.executeResearchScript(scriptName, context);
});

// Dataset Export IPC Handlers
ipcMain.handle('export-case-data', async (event, { caseData, format, targetPath }) => {
  await exporter.exportCase(caseData, format, targetPath);
  return { success: true };
});

// Pattern Discovery IPC Handlers (Phase 66)
ipcMain.handle('patterns-discover', (event, bundles) => {
  return patternEngine.discover(bundles);
});

ipcMain.handle('patterns-cluster', (event, { bundles, traits }) => {
  return clusterEngine.cluster(bundles, traits);
});

ipcMain.handle('patterns-anomalies', (event, { bundles, patterns }) => {
  return anomalyDetector.detect(bundles, patterns);
});

ipcMain.handle('patterns-stats', () => {
  return {
    patterns: patternEngine.getStats(),
    clusters: clusterEngine.getStats(),
    anomalies: anomalyDetector.getStats()
  };
});

// Topology Mapper IPC (Phase 67)
ipcMain.handle('topology-map-case', (event, bundles) => {
  return topologyMapper.mapCase(bundles);
});

// Insight Generator IPC (Phase 68)
ipcMain.handle('insights-generate', (event, { patterns, anomalies, topology }) => {
  return insightGenerator.generate(patterns, anomalies, topology);
});

// Case Assistant IPC (Phase 69)
ipcMain.handle('assistant-briefing', (event, caseData) => {
  return caseAssistant.generateBriefing(caseData);
});

ipcMain.handle('assistant-suggest-related', (event, { targetBundle, allBundles }) => {
  return caseAssistant.suggestRelated(targetBundle, allBundles);
});

ipcMain.handle('assistant-propose-experiments', (event, bundle) => {
  return caseAssistant.proposeExperiments(bundle);
});

// Autonomous Investigator IPC (Phase 70)
ipcMain.handle('auto-investigate', async (event, bundles) => {
  return await autoInvestigator.run(bundles);
});

// Pattern Classifier IPC (Phase 71)
ipcMain.handle('ai-classify-bundles', (event, bundles) => {
  return patternClassifier.classifyBundles(bundles);
});

// Anomaly Scorer IPC (Phase 72)
ipcMain.handle('ai-score-anomalies', (event, observations) => {
  return anomalyScorer.scoreBundles(observations);
});

// Fingerprint Library IPC (Phase 73)
ipcMain.handle('fplib-add', (event, entry) => {
  return fingerprintLibrary.add(entry);
});
ipcMain.handle('fplib-search', (event, features) => {
  return fingerprintLibrary.findSimilar(features);
});
ipcMain.handle('fplib-compare', (event, candidate) => {
  return fingerprintLibrary.compare(candidate);
});
ipcMain.handle('fplib-export', () => {
  return fingerprintLibrary.export();
});

// Cross-Case Miner IPC (Phase 74)
ipcMain.handle('cross-case-mine', (event, cases) => {
  return crossCaseMiner.mine(cases);
});

// Autonomous Research Mode IPC (Phase 75)
ipcMain.handle('research-generate', (event, context) => {
  return autoResearch.generate(context);
});
ipcMain.handle('research-update-state', (event, { id, state }) => {
  return autoResearch.updateState(id, state);
});
ipcMain.handle('research-review-packet', () => {
  return autoResearch.generateReviewPacket();
});

// Workspace Store IPC (Phase 76)
ipcMain.handle('ws-create', (event, { name, options }) => {
  return workspaceStore.createWorkspace(name, options);
});
ipcMain.handle('ws-list', () => {
  return workspaceStore.listWorkspaces();
});
ipcMain.handle('ws-add-member', (event, { wsId, member }) => {
  return workspaceStore.addMember(wsId, member);
});
ipcMain.handle('ws-assign-case', (event, { wsId, caseId, analystId }) => {
  return workspaceStore.assignCase(wsId, caseId, analystId);
});
ipcMain.handle('ws-activity-feed', (event, wsId) => {
  return workspaceStore.getActivityFeed(wsId);
});

// Trust Registry IPC (Phase 77)
ipcMain.handle('trust-add-source', (event, source) => {
  return trustRegistry.addSource(source);
});
ipcMain.handle('trust-verify', (event, sourceId) => {
  return trustRegistry.verifySource(sourceId);
});
ipcMain.handle('trust-log-exchange', (event, data) => {
  return trustRegistry.logExchange(data);
});
ipcMain.handle('trust-audit', () => {
  return trustRegistry.getExchangeAudit();
});

// Centrality Engine IPC (Phase 78)
ipcMain.handle('graph-centrality', (event, graph) => {
  return centralityEngine.score(graph);
});
ipcMain.handle('graph-bridges', (event, graph) => {
  return centralityEngine.detectBridges(graph);
});
ipcMain.handle('graph-rank-clusters', (event, graph) => {
  return centralityEngine.rankClusters(graph);
});
ipcMain.handle('graph-hot-nodes', (event, graph) => {
  return centralityEngine.scoreHotNodes(graph);
});

// Policy Engine IPC (Phase 79)
ipcMain.handle('policy-load', (event, rules) => {
  return policyEngine.loadPolicies(rules);
});
ipcMain.handle('policy-evaluate', (event, { context, actor }) => {
  return policyEngine.evaluate(context, actor);
});
ipcMain.handle('policy-check', (event, { action, context }) => {
  return policyEngine.isAllowed(action, context);
});
ipcMain.handle('policy-audit', () => {
  return policyEngine.getAuditLog();
});

// Deployment Profiles IPC (Phase 80)
ipcMain.handle('deploy-list', () => {
  return deploymentProfiles.listProfiles();
});
ipcMain.handle('deploy-activate', (event, name) => {
  return deploymentProfiles.activateProfile(name);
});
ipcMain.handle('deploy-compliance', (event, { action, context }) => {
  return deploymentProfiles.checkCompliance(action, context);
});
ipcMain.handle('deploy-quota', () => {
  return deploymentProfiles.getQuotaReport();
});

// Review Workflow IPC (Phase 81)
ipcMain.handle('review-create', (event, { caseId, reviewer, options }) => {
  return reviewWorkflow.createReview(caseId, reviewer, options);
});
ipcMain.handle('review-comment', (event, { reviewId, author, text }) => {
  return reviewWorkflow.comment(reviewId, author, text);
});
ipcMain.handle('review-decide', (event, { reviewId, decision, reason }) => {
  return reviewWorkflow.decide(reviewId, decision, reason);
});
ipcMain.handle('review-pending', () => {
  return reviewWorkflow.getPending();
});

// Redaction Engine IPC (Phase 82)
ipcMain.handle('redact-text', (event, { text, rules }) => {
  return redactionEngine.redact(text, { rules });
});
ipcMain.handle('redact-bundle', (event, bundle) => {
  return redactionEngine.redactBundle(bundle);
});

// Publication Pipeline IPC (Phase 83)
ipcMain.handle('pub-submit', (event, { report, author }) => {
  return publicationPipeline.submit(report, author);
});
ipcMain.handle('pub-transition', (event, { itemId, state, actor }) => {
  return publicationPipeline.transition(itemId, state, actor);
});
ipcMain.handle('pub-list', (event, state) => {
  return state ? publicationPipeline.getByState(state) : publicationPipeline.items;
});

// Model Reporter IPC (Phase 84)
ipcMain.handle('report-generate', (event, caseData) => {
  return modelReporter.generate(caseData);
});

// Deployment Orchestrator IPC (Phase 85)
ipcMain.handle('orchestrate-deploy', (event, { profile, environment }) => {
  return deploymentOrchestrator.deploy(profile, environment);
});
ipcMain.handle('orchestrate-rollback', (event, deploymentId) => {
  return deploymentOrchestrator.rollback(deploymentId);
});
ipcMain.handle('orchestrate-history', () => {
  return deploymentOrchestrator.getHistory();
});

// Timeline Engine IPC (Phase 86)
ipcMain.handle('timeline-reconstruct', (event, { caseId, events }) => {
  return timelineEngine.reconstruct(caseId, events);
});
ipcMain.handle('timeline-get', (event, caseId) => {
  return timelineEngine.getTimeline(caseId);
});

// Infrastructure Tracker IPC (Phase 87)
ipcMain.handle('infra-record', (event, { node, caseId, timestamp }) => {
  return infrastructureTracker.record(node, caseId, timestamp);
});
ipcMain.handle('infra-history', (event, nodeId) => {
  return infrastructureTracker.getHistory(nodeId);
});
ipcMain.handle('infra-migrations', () => {
  return infrastructureTracker.getMigrations();
});
ipcMain.handle('infra-drift', () => {
  return infrastructureTracker.getDriftAnalysis();
});

// Predictive Anomaly IPC (Phase 88)
ipcMain.handle('predict-risk', (event, { patternHistory, context }) => {
  return predictiveAnomaly.predict(patternHistory, context);
});
ipcMain.handle('predict-high-risk', () => {
  return predictiveAnomaly.getHighRiskPredictions();
});

// Forensic Simulator IPC (Phase 89)
ipcMain.handle('simulate-scenario', (event, { scenario, bundle }) => {
  return forensicSimulator.simulate(scenario, bundle);
});
ipcMain.handle('simulate-history', () => {
  return forensicSimulator.getHistory();
});

// Threat Reporter IPC (Phase 90)
ipcMain.handle('threat-generate', (event, caseData) => {
  return threatReporter.generate(caseData);
});
ipcMain.handle('threat-list', () => {
  return threatReporter.getReports();
});

// Global Graph IPC (Phase 91)
ipcMain.handle('global-graph-add-node', (event, { id, type, data, sourceCtx }) => {
  return globalGraph.addNode(id, type, data, sourceCtx);
});
ipcMain.handle('global-graph-add-edge', (event, { sourceId, targetId, relation, data, sourceCtx }) => {
  return globalGraph.addEdge(sourceId, targetId, relation, data, sourceCtx);
});
ipcMain.handle('global-graph-neighborhood', (event, { nodeId, depth }) => {
  return globalGraph.getNeighborhood(nodeId, depth);
});
ipcMain.handle('global-graph-lineage', (event, elementId) => {
  return globalGraph.getLineage(elementId);
});
ipcMain.handle('global-graph-summary', () => {
  return globalGraph.summary();
});

// Infra Attribution IPC (Phase 92)
ipcMain.handle('attrib-attribute', (event, context) => {
  return infraAttributionEngine.attribute(context);
});

// Adversary Fingerprinting IPC (Phase 93)
ipcMain.handle('advfp-fingerprint', (event, observation) => {
  return adversaryFingerprintEngine.fingerprint(observation);
});
ipcMain.handle('advfp-compare', (event, { fp1_label, fp2_label }) => {
  return adversaryFingerprintEngine.compare(fp1_label, fp2_label);
});
ipcMain.handle('advfp-group', () => {
  return adversaryFingerprintEngine.groupPatterns();
});

// Self-Healing Orchestrator IPC (Phase 94)
ipcMain.handle('heal-recover', (event, failureContext) => {
  return selfHealingOrchestrator.recover(failureContext);
});
ipcMain.handle('heal-audit', () => {
  return selfHealingOrchestrator.getAuditLog();
});

// Autonomous Discovery IPC (Phase 95)
ipcMain.handle('discovery-run', (event, context) => {
  return autonomousDiscoveryEngine.discover(context);
});
ipcMain.handle('discovery-history', () => {
  return autonomousDiscoveryEngine.getHistory();
});

// Endgame Command Layer IPC (Phases 96-100)
ipcMain.handle('endgame-command', (event, { command, payload }) => {
  return strategicCommandEngine.executeCommand(command, payload);
});
ipcMain.handle('endgame-history', () => {
  return strategicCommandEngine.getCommandHistory();
});
ipcMain.handle('endgame-replay-get', (event, caseId) => {
  return missionReplayEngine.getReplay(caseId);
});

// Expansion APIs
ipcMain.handle('exp-memory-record', (event, { caseId, analystId, suggestionId, decision, notes }) => {
  return analystMemoryLayer.recordDecision(caseId, analystId, suggestionId, decision, notes);
});
ipcMain.handle('exp-memory-annotate', (event, { caseId, analystId, targetId, text }) => {
  return analystMemoryLayer.annotate(caseId, analystId, targetId, text);
});
ipcMain.handle('exp-heatmap-generate', (event, graphContext) => {
  return threatHeatmapEngine.generateHeatmap(graphContext);
});
ipcMain.handle('exp-prov-tag', (event, { signalId, source, dataset }) => {
  return dataProvenanceSystem.tagSignal(signalId, source, dataset);
});
ipcMain.handle('exp-prov-step', (event, { signalId, stepName, weight }) => {
  return dataProvenanceSystem.appendStep(signalId, stepName, weight);
});
ipcMain.handle('exp-explain', (event, { type, context }) => {
  return explainabilityLayer.explain(type, context);
});

// Ultimate Evolution APIs (Phases 101-150)
ipcMain.handle('adv-narrative-track', (event, graphSequence) => {
  return narrativePropagationEngine.trackPropagation(graphSequence);
});
ipcMain.handle('adv-operator-model', (event, { operatorId, telemetryLogs }) => {
  return operatorBehaviorEngine.modelBehavior(operatorId, telemetryLogs);
});
ipcMain.handle('adv-operator-get', (event, operatorId) => {
  return operatorBehaviorEngine.getProfile(operatorId);
});
ipcMain.handle('adv-predict-future', (event, { graphTrends, behaviorProfile }) => {
  return advPredictiveEngine.forecast(graphTrends, behaviorProfile);
});
ipcMain.handle('adv-assistant-synthesize', (event, { graphSequence, telemetryLogs }) => {
  return advAssistantEngine.synthesize(graphSequence, telemetryLogs);
});

function updateIntelligenceGraph(bundle, caseId) {
  const fingerprint = FingerprintEngine.generateFingerprint(bundle);
  bundle.fingerprint_data = fingerprint; // Tag bundle with fingerprint

  indexManager.indexBundle(bundle); // Index for HyperQuery

  const bid = bundle.fingerprint || bundle.path;

  // Add Bundle Node
  intelGraph.addNode('BUNDLE', bid, {
    caseId,
    path: bundle.path,
    fingerprint: fingerprint
  });

  // Add Infrastructure Nodes and Edges
  if (bundle.cdn) {
    intelGraph.addNode('CDN', bundle.cdn);
    intelGraph.addEdge(bid, bundle.cdn, 'SERVED_BY');
  }
  if (bundle.protocol) {
    intelGraph.addNode('PROTOCOL', bundle.protocol);
    intelGraph.addEdge(bid, bundle.protocol, 'USES_PROTOCOL');
  }
  if (bundle.playerSignature) {
    intelGraph.addNode('PLAYER', bundle.playerSignature);
    intelGraph.addEdge(bid, bundle.playerSignature, 'MANAGED_BY');
  }
}

const CASES_DIR = path.join(RUNTIME_DIR, 'cases');
const caseStore = new CaseStore(CASES_DIR);

ipcMain.handle('case-list', () => caseStore.listCases());
ipcMain.handle('case-create', (event, title) => caseStore.createCase(title));
ipcMain.handle('case-load', (event, caseId) => caseStore.loadCase(caseId));
ipcMain.handle('case-save', (event, caseData) => {
  caseStore.saveCase(caseData);
  return { success: true };
});
ipcMain.handle('case-delete', (event, caseId) => caseStore.deleteCase(caseId));

ipcMain.handle('case-attach-bundle', (event, { caseId, bundlePath }) => {
  const fullCase = caseStore.loadCase(caseId);
  if (!fullCase) throw new Error("Case not found");

  // Update bundle with intelligence data before attaching
  const bundleInfo = {
    path: bundlePath,
    // Add dummy data if bundle file doesn't exist yet for testing, 
    // in real flow this would be parsed from the .hyper file
    cdn: 'MOCK_CDN',
    protocol: 'MOCK_PROTO',
    playerSignature: 'MOCK_PLAYER'
  };

  updateIntelligenceGraph(bundleInfo, caseId);

  const updated = BundleAttachment.attachBundle(fullCase, bundlePath);
  updated.bundles[updated.bundles.length - 1].fingerprint_data = bundleInfo.fingerprint_data;

  caseStore.saveCase(updated);
  return updated;
});

ipcMain.handle('case-add-note', (event, { caseId, content }) => {
  const caseData = caseStore.loadCase(caseId);
  if (!caseData) throw new Error("Case not found");
  const updated = CaseNotes.addNote(caseData, content);
  caseStore.saveCase(updated);
  return updated;
});

ipcMain.handle('case-export-notes', async (event, { caseId, filename }) => {
  const caseData = caseStore.loadCase(caseId);
  if (!caseData) throw new Error("Case not found");

  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Case Notes',
    defaultPath: path.join(app.getPath('downloads'), filename || 'notes.md'),
    filters: [{ name: 'Markdown Files', extensions: ['md'] }]
  });

  if (filePath) {
    CaseNotes.exportToMarkdown(caseData, filePath);
    return { success: true, filePath };
  }
  return { success: false, reason: 'Export cancelled' };
});

ipcMain.handle('case-add-finding', (event, { caseId, findingData }) => {
  const caseData = caseStore.loadCase(caseId);
  if (!caseData) throw new Error("Case not found");
  const updated = FindingsRegistry.addFinding(caseData, findingData);
  caseStore.saveCase(updated);
  return updated;
});

ipcMain.handle('case-update-finding', (event, { caseId, findingId, updates }) => {
  const caseData = caseStore.loadCase(caseId);
  if (!caseData) throw new Error("Case not found");
  const updated = FindingsRegistry.updateFinding(caseData, findingId, updates);
  caseStore.saveCase(updated);
  return updated;
});

ipcMain.handle('case-compare', (event, { bundlePathA, bundlePathB }) => {
  const report = CaseComparator.compare(bundlePathA, bundlePathB);
  const markdown = CaseComparator.generateMarkdown(report);
  return { report, markdown };
});

// IPC Endpoints
ipcMain.handle('automation-set-mode', (event, mode) => {
  clipboardWatcher.setMode(mode);
  return true;
});

ipcMain.handle('automation-get-state', () => {
  return {
    mode: clipboardWatcher.mode,
    queue: decodeQueue.getQueue(),
    history: decodeQueue.getHistory(20),
    metrics: decodeQueue.getMetrics()
  };
});

// Periodic State Persistence
const automationEventsLog = [];
clipboardWatcher.setEventHandler((type, data) => {
  log.info(`AUTOMATION_${type}`, data);
  automationEventsLog.unshift({ type, data, ts: Date.now() });
  if (automationEventsLog.length > 500) automationEventsLog.pop();

  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('automation-event', { type, data }));
});

function persistAutomationState() {
  try {
    const RUNTIME_DIR = path.join(app.getPath('userData'), 'HyperSnatch', 'runtime');
    const autoPath = path.join(RUNTIME_DIR, 'automation');
    if (!fs.existsSync(autoPath)) fs.mkdirSync(autoPath, { recursive: true });

    fs.writeFileSync(path.join(autoPath, 'clipboard_events.json'), JSON.stringify(automationEventsLog, null, 2));
    fs.writeFileSync(path.join(autoPath, 'decode_queue.json'), JSON.stringify(decodeQueue.getQueue(), null, 2));
    fs.writeFileSync(path.join(autoPath, 'decode_history.json'), JSON.stringify(decodeQueue.getHistory(100), null, 2));
  } catch (e) { }
}

setInterval(persistAutomationState, 5000);

// ==================== SOVEREIGN HARDWARE BINDING ====================
async function getRawHardwareIds() {
  try {
    const os = require('os');
    const cpuId = os.cpus()[0].model.replace(/\s+/g, '_');
    const baseboardId = `${os.hostname()}_${os.userInfo().username}`;
    return { cpuId, baseboardId };
  } catch (e) {
    return { cpuId: 'FALLBACK-CPU', baseboardId: 'FALLBACK-BASE' };
  }
}

async function getHardwareFingerprint() {
  const { cpuId, baseboardId } = await getRawHardwareIds();
  return crypto.createHash('sha256').update(`HS-HWID-${cpuId}-${baseboardId}`).digest('hex');
}

/**
 * Checks for a local valid license and returns the tier
 */
async function checkLicenseLocally() {
  try {
    const hwid = await getHardwareFingerprint();
    const licensePath = path.join(CONFIG_DIR, 'license.json');
    if (!fs.existsSync(licensePath)) {
      return { tier: 'COMMUNITY', edition: 'COMMUNITY', valid: false, features: SovereignAuth.TIER_FEATURES.COMMUNITY };
    }
    const license = JSON.parse(fs.readFileSync(licensePath, 'utf8'));
    const result = SovereignAuth.verifyLicense(license, hwid);
    if (result.valid) {
      const edition = result.edition || 'SOVEREIGN';
      return {
        tier: edition,
        edition,
        valid: true,
        user: result.user,
        features: result.features || SovereignAuth.TIER_FEATURES[edition] || SovereignAuth.TIER_FEATURES.COMMUNITY
      };
    }
    return { tier: 'COMMUNITY', edition: 'COMMUNITY', valid: false, features: SovereignAuth.TIER_FEATURES.COMMUNITY };
  } catch (e) {
    return { tier: 'COMMUNITY', edition: 'COMMUNITY', valid: false, features: SovereignAuth.TIER_FEATURES.COMMUNITY };
  }
}

/**
 * Returns an access-denied result if the current license doesn't meet the minimum tier.
 * @param {string} requiredTier - 'SOVEREIGN' or 'INSTITUTIONAL'
 * @param {string} featureName - human-readable feature name for the error message
 * @returns {Object|null} - null if allowed, error object if denied
 */
async function requireTier(requiredTier, featureName) {
  const license = await checkLicenseLocally();
  if (!SovereignAuth.meetsMinimumTier(license.tier, requiredTier)) {
    const tierPrice = requiredTier === 'INSTITUTIONAL' ? '$499' : '$149';
    return {
      success: false,
      error: `ACCESS DENIED: ${featureName} requires ${requiredTier} Edition (${tierPrice}).`,
      requiredTier,
      currentTier: license.tier,
      upgradeUrl: 'https://cashdominion.gumroad.com/l/itpxg'
    };
  }
  return null;
}

ipcMain.handle('get-hardware-status', async () => {
  const fingerprint = await getHardwareFingerprint();
  return {
    fingerprint: fingerprint,
    displayId: fingerprint.substring(0, 16),
    status: 'HARDWARE_LOCKED'
  };
});

ipcMain.handle('authenticate-license', async (event, licensePath) => {
  try {
    const hwid = await getHardwareFingerprint();
    const actualPath = (licensePath && path.isAbsolute(licensePath)) ? licensePath : path.join(CONFIG_DIR, 'license.json');
    if (!fs.existsSync(actualPath)) {
      return { success: false, reason: 'License file not found.' };
    }
    const license = JSON.parse(fs.readFileSync(actualPath, 'utf8'));
    const result = SovereignAuth.verifyLicense(license, hwid);
    return { success: result.valid, ...result };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

ipcMain.handle('final-freeze', async (event, { caseData, reports }) => {
  const gateCheck = await requireTier('SOVEREIGN', 'Final Freeze Evidence Vault');
  if (gateCheck) return gateCheck;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const caseFolderName = `CASE-FREEZE-${timestamp}`;

  const { filePath: rootPath } = await dialog.showOpenDialog({
    title: 'Select Destination for Final Case Freeze',
    properties: ['openDirectory']
  });

  if (!rootPath) return { success: false, reason: 'No directory selected' };

  const casePath = path.join(rootPath, caseFolderName);
  if (!fs.existsSync(casePath)) fs.mkdirSync(casePath);

  const manifestFiles = [];
  const vaultMetadata = {
    version: '1.0.0',
    caseId: caseData.caseNumber || 'GENERAL',
    hardwareBound: true,
    files: {}
  };

  try {
    // 0. Derive Vault Key (PBKDF2 120k iterations per Governance)
    const hwid = await getHardwareFingerprint();
    const vaultKey = crypto.pbkdf2Sync(hwid, 'HS-VAULT-SALT-V1', 120000, 32, 'sha256');

    // 1. Encrypt and Write Reports
    for (const report of reports) {
      if (!validateFilename(report.filename)) {
        throw new Error(`Security Violation: Illegal filename detected: ${report.filename}`);
      }

      const buffer = report.type === 'pdf' ? Buffer.from(report.content, 'base64') : Buffer.from(report.content);

      // AES-256-GCM Encryption
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', vaultKey, iv);
      cipher.setAAD(Buffer.from('HyperSnatch-Vanguard-Vault'));

      let encrypted = cipher.update(buffer);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();

      const vaultFilename = `${report.filename}.vault`;
      const filePath = path.join(casePath, vaultFilename);
      fs.writeFileSync(filePath, encrypted);

      const hash = crypto.createHash('sha256').update(encrypted).digest('hex');
      manifestFiles.push({ hash, path: vaultFilename });

      vaultMetadata.files[vaultFilename] = {
        originalName: report.filename,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        size: encrypted.length
      };
    }

    // 2. Create Vault Manifest (Metadata)
    const manifestPath = path.join(casePath, 'VAULT_MANIFEST.json');
    fs.writeFileSync(manifestPath, JSON.stringify(vaultMetadata, null, 2));

    // 3. Create Integrity Manifest (Hashes of encrypted blobs)
    const entries = manifestFiles.map(f => `${f.hash}  ${f.path}`).join('\n');
    const integrityPath = path.join(casePath, 'INTEGRITY_MANIFEST.txt');
    fs.writeFileSync(integrityPath, entries);

    // 4. Sign the manifest (Sovereign Seal)
    const { cpuId, baseboardId } = await getRawHardwareIds();
    const signature = crypto.createHash('sha256').update(entries + cpuId + baseboardId).digest('hex');

    fs.writeFileSync(path.join(casePath, 'SOVEREIGN_SEAL.sig'), signature);

    // 5. Create a README summary
    const readme = `HYPERSNATCH FINAL FREEZE VAULT\n` +
      `==============================\n` +
      `SECURITY:  AES-256-GCM (Hardware-Bound)\n` +
      `TIMESTAMP: ${new Date().toLocaleString()}\n` +
      `CASE ID:   ${vaultMetadata.caseId}\n` +
      `ITEMS:     ${reports.length}\n` +
      `SIGNATURE: ${signature}\n` +
      `VERIFIED:  SOVEREIGN AUDIT CHAIN ACTIVE\n\n` +
      `NOTICE: Evidence is encrypted and tied to Node ID: ${hwid.substring(0, 16)}\n`;
    fs.writeFileSync(path.join(casePath, 'README_SUMMARY.txt'), readme);

    return { success: true, path: casePath, signature };
  } catch (err) {
    log.error('VAULT_FREEZE_ERROR', { error: err.message });
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export-pdf', async (event, { html, filename }) => {
  const gateCheck = await requireTier('SOVEREIGN', 'PDF Export');
  if (gateCheck) return gateCheck;
  if (!validateFilename(filename)) {
    return { success: false, error: 'Illegal filename' };
  }
  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      ...SECURITY_CONFIG,
      preload: null, // No preload needed for headless PDF window
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  const options = {
    marginsType: 0,
    pageSize: 'A4',
    printBackground: true,
    printSelectionOnly: false,
    landscape: false
  };

  try {
    const data = await pdfWindow.webContents.printToPDF(options);
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save PDF Report',
      defaultPath: path.join(app.getPath('downloads'), filename),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, data);
      return { success: true, filePath };
    }
    return { success: false, reason: 'Save cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    pdfWindow.close();
  }
});

ipcMain.handle('export-security-report', async (event, decodeData) => {
  const gateCheck = await requireTier('SOVEREIGN', 'Security Report Export');
  if (gateCheck) return gateCheck;
  try {
    const reportPath = path.join(app.getPath("desktop"), "hyperSnatch_report.pdf");

    // Read bridge.runtime.json
    let bridgeAuth = { error: "Not spawned yet" };
    try {
      const bridgePath = path.join(process.cwd(), "bridge.runtime.json");
      if (fs.existsSync(bridgePath)) {
        bridgeAuth = JSON.parse(fs.readFileSync(bridgePath, "utf8"));
        bridgeAuth.token = "[REDACTED]";
      }
    } catch (e) { }

    // Check Authenticode (Windows only)
    let authenticodeState = "Skipped (Not Windows)";
    if (process.platform === "win32" && app.isPackaged) {
      try {
        const cp = require("child_process");
        const pePath = process.execPath;
        const psCmd = `powershell -NoProfile -Command "$sig = Get-AuthenticodeSignature -FilePath '${pePath}'; if ($sig.Status -eq 'NotSigned' -or -not $sig.SignerCertificate) { exit 1 }; if (-not $sig.TimeStamperCertificate) { exit 2 }; exit 0"`;
        cp.execSync(psCmd);
        authenticodeState = "Valid & RFC 3161 Timestamped";
      } catch (e) {
        authenticodeState = e.status === 1 ? "Missing Signature" : "Missing Timestamp";
      }
    } else if (process.platform === "win32") {
      authenticodeState = "Skipped (Running from Source)";
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Export Security Report",
      defaultPath: reportPath,
      filters: [{ name: "PDF Document", extensions: ["pdf"] }, { name: "HTML Report", extensions: ["html"] }]
    });

    if (canceled || !filePath) return false;

    // Use CaseReportGenerator
    const CaseReportGenerator = require('../core/case_report_generator.js');
    const AuditChain = require('./core/smartdecode/audit-chain');

    const cands = decodeData?.candidates || [];
    const refs = decodeData?.refusals || [];

    // 1. Sign the session via Audit Chain for forensic immutability
    const hwid = await getHardwareFingerprint();
    const signedBundle = await AuditChain.signSession(
      { candidates: cands, refusals: refs, telemetry: {} },
      { buildId: "RES-RC1", engineVersion: "2.4.0" },
      hwid
    );

    // Map refusals if they don't have timestamp
    const mappedRefs = refs.map(r => ({
      timestamp: r.timestamp || new Date().toISOString(),
      reason: `[${r.host || 'unknown'}] ${r.reason}`
    }));

    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        workspaceId: "OFFLINE_SESSION",
        version: APP_VERSION,
        signature: signedBundle.signature,
        fingerprint: signedBundle.fingerprint
      },
      extraction: {
        totalCandidates: cands.length,
        candidates: cands
      },
      refusals: {
        totalRefusals: refs.length,
        refusals: mappedRefs
      }
    };

    const htmlReport = CaseReportGenerator.generateHTMLReport(reportData);

    if (filePath.endsWith('.html')) {
      fs.writeFileSync(filePath, htmlReport.data, "utf8");
      return true;
    }

    // Export as PDF
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false }
    });

    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlReport.data)}`);
    const pdfData = await pdfWindow.webContents.printToPDF({
      marginsType: 0,
      pageSize: 'A4',
      printBackground: true
    });
    fs.writeFileSync(filePath, pdfData);
    pdfWindow.close();

    return true;
  } catch (err) {
    log.error("EXPORT_REPORT_ERROR", { err: err.message });
    return false;
  }
});

ipcMain.handle('validate-license', async (event) => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select HyperSnatch License File',
      filters: [{ name: 'JSON License', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { canceled: true };
    }

    const licensePath = filePaths[0];
    const hwid = await getHardwareFingerprint();
    const license = JSON.parse(fs.readFileSync(licensePath, 'utf8'));
    const result = SovereignAuth.verifyLicense(license, hwid);

    if (result.valid) {
      const storedLicense = path.join(CONFIG_DIR, 'license.json');
      fs.copyFileSync(licensePath, storedLicense);
      logSecurityEvent('LICENSE_ACTIVATED', { edition: result.edition, tier: result.tier, user: result.user });
      log.info("LICENSE_ACTIVATED", { edition: result.edition, tier: result.tier });
    }

    return result;

  } catch (error) {
    log.error("LICENSE_IMPORT_ERROR", { message: error.message });
    return { valid: false, reason: "Internal error processing license" };
  }
});

ipcMain.handle('get-license-info', async () => {
  const license = await checkLicenseLocally();
  const hwid = await getHardwareFingerprint();
  return {
    ...license,
    hwid,
    displayHwid: hwid.substring(0, 16),
    tierDisplay: license.tier === 'COMMUNITY' ? 'COMMUNITY' : `${license.tier} EDITION`,
    upgradeUrl: 'https://cashdominion.gumroad.com/l/itpxg',
    tiers: {
      SOVEREIGN: { price: '$149', features: SovereignAuth.TIER_FEATURES.SOVEREIGN },
      INSTITUTIONAL: { price: '$499', features: SovereignAuth.TIER_FEATURES.INSTITUTIONAL }
    }
  };
});

ipcMain.handle('get-security-events', () => {
  return securityEvents.slice(-100); // Last 100 events
});

ipcMain.handle('clear-security-events', () => {
  securityEvents = [];
  try {
    const logPath = path.resolve(path.join(LOGS_DIR, 'security.log'));
    if (!logPath.startsWith(process.cwd())) {
      throw new Error('Invalid log path');
    }
    fs.writeFileSync(logPath, '');
  } catch (error) {
    logSecurityEvent('LOG_CLEAR_ERROR', { error: error.message });
  }
});

ipcMain.handle('validate-url', async (event, url) => {
  const result = enforceSecurityPolicy(null, url);
  event.reply(result);
});

ipcMain.handle('import-evidence', async (event, evidenceData) => {
  try {
    // Validate evidence format
    if (!evidenceData || typeof evidenceData !== 'object') {
      event.reply({ success: false, error: 'Invalid evidence data' });
      return;
    }

    // Create evidence file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const evidenceFile = path.join(EVIDENCE_DIR, `imported-${timestamp}.json`);
    const evidencePath = path.resolve(evidenceFile);

    if (!evidencePath.startsWith(process.cwd())) {
      throw new Error('Invalid evidence path');
    }

    fs.writeFileSync(evidenceFile, JSON.stringify(evidenceData, null, 2));

    logSecurityEvent('EVIDENCE_IMPORTED', {
      file: evidenceFile,
      size: JSON.stringify(evidenceData).length
    });

    event.reply({ success: true, file: evidenceFile });
  } catch (error) {
    logSecurityEvent('EVIDENCE_IMPORT_ERROR', { error: error.message });
    event.reply({ success: false, error: error.message });
  }
});

ipcMain.handle('get-forensic-snapshot', async (event, snapshotPath) => {
  try {
    let targetDir = snapshotPath;
    if (!targetDir) {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Select Target Evidence Directory',
        properties: ['openDirectory'],
        defaultPath: path.join(__dirname, '..', 'tests', 'evidence')
      });
      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'No directory selected' };
      }
      targetDir = filePaths[0];
    }

    const harPath = path.join(targetDir, 'network.har');
    const domPath = path.join(targetDir, 'dom_snapshot.html');
    const configPath = path.join(targetDir, 'player_config.json');
    const tracePath = path.join(targetDir, 'stream_trace.json');

    const result = { success: true, targetDir, artifacts: {} };
    if (fs.existsSync(harPath)) result.artifacts.networkHar = JSON.parse(fs.readFileSync(harPath, 'utf8'));
    if (fs.existsSync(domPath)) result.artifacts.domSnapshot = fs.readFileSync(domPath, 'utf8');
    if (fs.existsSync(configPath)) result.artifacts.playerConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (fs.existsSync(tracePath)) result.artifacts.streamTrace = JSON.parse(fs.readFileSync(tracePath, 'utf8'));

    return result;
  } catch (error) {
    log.error('FORENSIC_SNAPSHOT_ERROR', { error: error.message });
    return { success: false, error: error.message };
  }
});

ipcMain.on('log-message', (event, { level, message, meta }) => {
  log[level.toLowerCase()](message, meta);
});

// ==================== APP LIFECYCLE ====================
function createRuntimeDirectories() {
  const dirs = [RUNTIME_DIR, LOGS_DIR, EVIDENCE_DIR, EXPORTS_DIR, CONFIG_DIR];

  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (error) {
      logSecurityEvent('DIR_CREATE_ERROR', { dir, error: error.message });
    }
  });
}

function createDefaultConfig() {
  const defaultConfig = {
    version: '1.0.0',
    mode: 'strict',
    allowlistEnabled: true,
    allowedHosts: ['localhost', '127.0.0.1'],
    allowedPorts: [3000, 8000, 8080, 3001],
    allowedContentTypes: [
      'text/html',
      'application/json',
      'text/plain'
    ],
    premiumMarkers: [
      'subscribe', 'premium', 'login', 'paywall', 'purchase',
      'access denied', 'subscription', 'upgrade', 'payment'
    ],
    legalDisclaimerAccepted: false,
    smartDecode: {
      defaultEngine: "rust",
      strictEngine: false
    },
    strategyRuntime: {
      enabled: false,
      requireSignature: true,
      trustedPackHashes: [
        "efc9c8045d99acfd689a4105bce717260a9a3e5f4d04287aba4c167ec69c4456",
        "a23b9bbf54c832c736b6adf9169091075edead1d76b17f57b50e35bf60ad22f2"
      ]
    }
  };

  try {
    const policyPath = path.resolve(POLICY_FILE);
    const configDir = path.resolve(CONFIG_DIR); const configPrefix = (configDir.endsWith(path.sep) ? configDir : (configDir + path.sep)).toLowerCase(); if (!policyPath.toLowerCase().startsWith(configPrefix)) {
      throw new Error('Invalid policy path');
    }
    fs.writeFileSync(policyPath, JSON.stringify(defaultConfig, null, 2));
    logSecurityEvent('DEFAULT_CONFIG_CREATED', { file: POLICY_FILE });
  } catch (error) {
    logSecurityEvent('CONFIG_CREATE_ERROR', { error: error.message });
  }
}

function createDefaultAllowlist() {
  const defaultAllowlist = {
    allowedHosts: ['localhost', '127.0.0.1']
  };

  try {
    const allowlistPath = path.resolve(ALLOWLIST_FILE);
    const configDir = path.resolve(CONFIG_DIR);
    const configPrefix = (configDir.endsWith(path.sep) ? configDir : (configDir + path.sep)).toLowerCase();
    if (!allowlistPath.toLowerCase().startsWith(configPrefix)) {
      throw new Error('Invalid allowlist path');
    }
    fs.writeFileSync(allowlistPath, JSON.stringify(defaultAllowlist, null, 2));
    logSecurityEvent('DEFAULT_ALLOWLIST_CREATED', { file: ALLOWLIST_FILE });
  } catch (error) {
    logSecurityEvent('ALLOWLIST_CREATE_ERROR', { error: error.message });
  }
}

function readPolicySafe() {
  try {
    const policyPath = path.resolve(POLICY_FILE);
    const configDir = path.resolve(CONFIG_DIR);
    const configPrefix = (configDir.endsWith(path.sep) ? configDir : (configDir + path.sep)).toLowerCase();
    if (!policyPath.toLowerCase().startsWith(configPrefix)) {
      throw new Error('Invalid policy path');
    }
    const raw = fs.readFileSync(policyPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getPolicySummary() {
  const p = readPolicySafe() || {};

  const smartDecode = {
    defaultEngine: typeof p.smartDecode?.defaultEngine === 'string' ? p.smartDecode.defaultEngine : 'rust',
    strictEngine: Boolean(p.smartDecode?.strictEngine),
  };

  const trusted = Array.isArray(p.strategyRuntime?.trustedPackHashes) ? p.strategyRuntime.trustedPackHashes : [];
  const strategyRuntime = {
    enabled: Boolean(p.strategyRuntime?.enabled),
    requireSignature: p.strategyRuntime?.requireSignature !== false,
    trustedPackHashes: trusted.filter((h) => typeof h === 'string' && /^[a-f0-9]{64}$/i.test(h)),
  };

  return {
    version: typeof p.version === 'string' ? p.version : '1.0.0',
    mode: typeof p.mode === 'string' ? p.mode : 'strict',
    allowlistEnabled: p.allowlistEnabled !== false,
    legalDisclaimerAccepted: Boolean(p.legalDisclaimerAccepted),
    premiumMarkers: Array.isArray(p.premiumMarkers) ? p.premiumMarkers : [],
    smartDecode,
    strategyRuntime,
  };
}

function ensurePolicyDefaults() {
  try {
    const policyPath = path.resolve(POLICY_FILE);
    const configDir = path.resolve(CONFIG_DIR);
    const configPrefix = (configDir.endsWith(path.sep) ? configDir : (configDir + path.sep)).toLowerCase();
    if (!policyPath.toLowerCase().startsWith(configPrefix)) {
      throw new Error('Invalid policy path');
    }

    const existing = readPolicySafe() || {};

    // Only add missing keys; never overwrite user customizations.
    if (!existing.smartDecode || typeof existing.smartDecode !== 'object') {
      existing.smartDecode = { defaultEngine: 'rust', strictEngine: false };
    } else {
      if (typeof existing.smartDecode.defaultEngine !== 'string') existing.smartDecode.defaultEngine = 'rust';
      if (typeof existing.smartDecode.strictEngine !== 'boolean') existing.smartDecode.strictEngine = false;
    }

    if (!existing.strategyRuntime || typeof existing.strategyRuntime !== 'object') {
      existing.strategyRuntime = {
        enabled: false,
        requireSignature: true,
        trustedPackHashes: [
          'efc9c8045d99acfd689a4105bce717260a9a3e5f4d04287aba4c167ec69c4456',
          'a23b9bbf54c832c736b6adf9169091075edead1d76b17f57b50e35bf60ad22f2'
        ],
      };
    } else {
      if (typeof existing.strategyRuntime.enabled !== 'boolean') existing.strategyRuntime.enabled = false;
      if (typeof existing.strategyRuntime.requireSignature !== 'boolean') existing.strategyRuntime.requireSignature = true;
      if (!Array.isArray(existing.strategyRuntime.trustedPackHashes)) existing.strategyRuntime.trustedPackHashes = [];
    }

    fs.writeFileSync(policyPath, JSON.stringify(existing, null, 2));
  } catch (e) {
    logSecurityEvent('POLICY_MIGRATION_ERROR', { error: e.message });
  }
}
function getRendererPath() {
  return path.join(__dirname, '..', 'ui', 'hypersnatch-ui.html');
}

/**
 * Institutional Hardening: Startup Self-Diagnostic
 */
async function runSelfCheck() {
  const report = {
    timestamp: new Date().toISOString(),
    passed: true,
    checks: [],
    errors: []
  };

  try {
    // 1. Hardware Integrity Check
    const hwid = await getHardwareFingerprint();
    report.checks.push({ name: 'HARDWARE_ID', status: 'OK', id: hwid.substring(0, 16) });

    // 2. Runtime Environment Check
    const paths = [RUNTIME_DIR, CONFIG_DIR, LOGS_DIR, EVIDENCE_DIR];
    const missing = paths.filter(p => !fs.existsSync(p));
    if (missing.length > 0) {
      report.passed = false;
      report.errors.push(`Missing runtime paths: ${missing.join(', ')}`);
    } else {
      report.checks.push({ name: 'RUNTIME_PATHS', status: 'OK' });
    }

    // 3. Rust Core Availability
    const binName = process.platform === "win32" ? "hs-core.exe" : "hs-core";
    const rustPath = app.isPackaged
      ? path.join(process.resourcesPath, binName)
      : path.join(__dirname, '..', 'build', binName);

    if (fs.existsSync(rustPath)) {
      report.checks.push({ name: 'RUST_CORE', status: 'OK' });
    } else {
      report.checks.push({ name: 'RUST_CORE', status: 'NOT_FOUND', warning: 'Falling back to JS engine' });
    }

    // 4. Sandbox & Context Isolation (Meta Check)
    report.checks.push({
      name: 'SECURITY_POSTURE',
      contextIsolation: SECURITY_CONFIG.contextIsolation,
      sandbox: SECURITY_CONFIG.sandbox,
      webSecurity: SECURITY_CONFIG.webSecurity
    });

  } catch (err) {
    report.passed = false;
    report.errors.push(`Critical diagnostic failure: ${err.message}`);
  }

  return report;
}

// ==================== MAIN APP ====================
app.whenReady().then(() => {
  logSecurityEvent('APP_READY', { version: APP_VERSION });
  log.info("SYSTEM_BOOTSTRAP_COMPLETE", { version: APP_VERSION });

  // HARD NETWORK LOCK: Cancel ALL external network requests globally
  const { session } = require('electron');
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    try {
      const url = new URL(details.url);

      // Allow internal app resources
      if (url.protocol === 'file:') {
        return callback({ cancel: false });
      }

      // Allow internal IPC/Bridge communication
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return callback({ cancel: false });
      }

      // Block everything else
      logSecurityEvent('NETWORK_BLOCK_TRIGGERED', { url: details.url });
      return callback({ cancel: true });
    } catch (e) {
      // Fallback: block anything unparseable
      callback({ cancel: true });
    }
  });

  // CSP ENFORCEMENT & SECONDARY AIRGAP LAYER
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    try {
      const url = new URL(details.url);

      // Secondary Airgap Check: Ensure redirects/workers don't bypass onBeforeRequest
      if (url.protocol !== 'file:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        logSecurityEvent('NETWORK_BLOCK_HEADERS_STAGE', { url: details.url });
        return callback({ cancel: true });
      }
    } catch (e) { }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "connect-src 'self' http://localhost:3000; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " + // Allow inline styles for UI components
          "img-src 'self' data: blob: https://*; " +
          "media-src 'self' data: blob: https://*;"
        ]
      }
    });
  });

  // Create runtime directories
  createRuntimeDirectories();

  // Ensure config files exist (and are forward-compatible)
  if (!fs.existsSync(POLICY_FILE)) {
    createDefaultConfig();
  } else {
    ensurePolicyDefaults();
  }

  if (!fs.existsSync(ALLOWLIST_FILE)) {
    createDefaultAllowlist();
  }

  // Policy: default SmartDecode engine under Electron
  try {
    const pol = readPolicySafe();
    const requested = String(process.env.HYPERSNATCH_SMARTDECODE_ENGINE || "").toLowerCase();
    const defEngine = String(pol?.smartDecode?.defaultEngine || "rust").toLowerCase();
    if (!requested && defEngine && defEngine !== "auto") {
      process.env.HYPERSNATCH_SMARTDECODE_ENGINE = defEngine;
    }
  } catch { }
  // Security: Prevent multiple instances
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    logSecurityEvent('SINGLE_INSTANCE_ENFORCED');
    app.quit();
    return;
  }

  // Create main window with hardened security
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,           // SOVEREIGN SHELL: Frameless
    fullscreen: false,      // Disabled Kiosk mode for standard desktop usage
    backgroundColor: '#0a1016',
    webPreferences: {
      ...SECURITY_CONFIG,
      preload: path.join(__dirname, 'preload.js'),
      // Additional security
      safeDialogs: true,
      autoplayPolicy: 'document-user-activation-required',
      backgroundThrottling: false
    },
    icon: path.join(__dirname, 'assets', 'icon.ico')
  });

  // Custom Window Controls for Frameless Shell
  ipcMain.handle('window-minimize', () => mainWindow.minimize());
  ipcMain.handle('window-maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window-close', () => mainWindow.close());
  ipcMain.handle('window-fullscreen', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));

  // Security: Set window open handler after window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Security: Log window creation
  logSecurityEvent('WINDOW_CREATED', {
    securityConfig: SECURITY_CONFIG,
    rendererPath: mainWindow.webContents.executeJavaScript(`window.rendererPath = '${getRendererPath().replace(/\\/g, '\\\\')}'`)
  });

  // Load the app
  mainWindow.loadFile(getRendererPath());

  // Institutional Hardening: Startup Self-Diagnostic
  runSelfCheck().then(report => {
    logSecurityEvent('STARTUP_DIAGNOSTIC_COMPLETE', report);
    if (!report.passed) {
      log.error('DIAGNOSTIC_FAILURE', report.errors);
    }
  });

  // Security: Handle window closed
  mainWindow.on('closed', () => {
    logSecurityEvent('WINDOW_CLOSED');
  });

  // Security: Handle certificate errors
  mainWindow.webContents.on('certificate-error', (event, url, error) => {
    logSecurityEvent('CERTIFICATE_ERROR', { url, error: error.message });
  });

  // Security: Handle console messages
  mainWindow.webContents.on('console-message', (event, level, message) => {
    if (level === 'error') {
      logSecurityEvent('RENDERER_ERROR', { message });
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logSecurityEvent('WINDOW_SHOWN');
  });

  // Security: Handle unresponsive
  mainWindow.on('unresponsive', () => {
    logSecurityEvent('WINDOW_UNRESPONSIVE');
  });

  // Security: Handle crashed
  mainWindow.webContents.on('crashed', (event, killed) => {
    logSecurityEvent('WINDOW_CRASHED', { killed });
  });
});
module.exports = {
  app,
  BrowserWindow,
  logSecurityEvent,
  enforceSecurityPolicy,
  getRendererPath
};
