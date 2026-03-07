// ==================== ELECTRON PRELOAD SCRIPT ====================
"use strict";

const { contextBridge, ipcRenderer, clipboard } = require('electron');

// ==================== SECURITY: IPC ALLOWLIST ====================
// Strictly limited to Vanguard Forensic Utilities
const ALLOWED_IPC_CHANNELS = new Set([
  'get-app-info',
  'open-logs-folder',
  'open-evidence-folder',
  'get-security-events',
  'clear-security-events',
  'validate-url',
  'import-evidence',
  'log-message',
  'export-security-report',
  'export-pdf',
  'final-freeze',
  'validate-license',
  'get-license-info',
  'accept-legal-disclaimer',
  'get-hardware-status',
  'authenticate-license',
  'window-minimize',
  'window-maximize',
  'window-close',
  'window-fullscreen',
  'smart-decode-run',
  'smart-decode-sign-session',
  'smart-decode-verify-session',
  'smart-decode-verify-session',
  'get-forensic-snapshot',
  'automation-set-mode',
  'automation-get-state',
  'case-list',
  'case-create',
  'case-load',
  'case-save',
  'case-delete',
  'case-attach-bundle',
  'case-add-note',
  'case-export-notes',
  'case-add-finding',
  'case-update-finding',
  'case-compare',
  'audit-log',
  'audit-get-logs',
  'custody-record',
  'custody-get-chain',
  'evidence-sign',
  'evidence-verify',
  'evidence-seal-case',
  'intelligence-get-graph',
  'intelligence-get-similar',
  'intelligence-rebuild-graph',
  'plugins-list',
  'plugins-load',
  'plugins-run-capability',
  'query-execute',
  'query-stats',
  'replay-mutate-set',
  'replay-mutate-clear',
  'rules-scan-bundle',
  'research-list-scripts',
  'research-run-script',
  'export-case-data',
  'patterns-discover',
  'patterns-cluster',
  'patterns-anomalies',
  'patterns-stats',
  'topology-map-case',
  'insights-generate',
  'assistant-briefing',
  'assistant-suggest-related',
  'assistant-propose-experiments',
  'auto-investigate',
  'ai-classify-bundles',
  'ai-score-anomalies',
  'fplib-add',
  'fplib-search',
  'fplib-compare',
  'fplib-export',
  'cross-case-mine',
  'research-generate',
  'research-update-state',
  'research-review-packet',
  'ws-create',
  'ws-list',
  'ws-add-member',
  'ws-assign-case',
  'ws-activity-feed',
  'trust-add-source',
  'trust-verify',
  'trust-log-exchange',
  'trust-audit',
  'graph-centrality',
  'graph-bridges',
  'graph-rank-clusters',
  'graph-hot-nodes',
  'policy-load',
  'policy-evaluate',
  'policy-check',
  'policy-audit',
  'deploy-list',
  'deploy-activate',
  'deploy-compliance',
  'deploy-quota',
  'review-create',
  'review-comment',
  'review-decide',
  'review-pending',
  'redact-text',
  'redact-bundle',
  'pub-submit',
  'pub-transition',
  'pub-list',
  'report-generate',
  'orchestrate-deploy',
  'report-generate',
  'orchestrate-deploy',
  'orchestrate-rollback',
  'orchestrate-history',
  'timeline-reconstruct',
  'timeline-get',
  'infra-record',
  'infra-history',
  'infra-migrations',
  'infra-drift',
  'predict-risk',
  'predict-high-risk',
  'simulate-scenario',
  'simulate-history',
  'simulate-scenario',
  'simulate-history',
  'threat-generate',
  'threat-list',
  'global-graph-add-node',
  'global-graph-add-edge',
  'global-graph-neighborhood',
  'global-graph-lineage',
  'global-graph-summary',
  'attrib-attribute',
  'advfp-fingerprint',
  'advfp-compare',
  'advfp-group',
  'heal-recover',
  'heal-audit',
  'discovery-run',
  'discovery-history',
  'endgame-command',
  'endgame-history',
  'endgame-replay-get',
  'exp-memory-record',
  'exp-memory-annotate',
  'exp-heatmap-generate',
  'exp-prov-tag',
  'exp-prov-step',
  'exp-explain',
  'adv-narrative-track',
  'adv-operator-model',
  'adv-operator-get',
  'adv-predict-future',
  'adv-assistant-synthesize'
]);

function validateIPCChannel(channel) {
  if (!ALLOWED_IPC_CHANNELS.has(channel)) {
    throw new Error(`Security Violation: Disallowed IPC channel '${channel}'`);
  }
}

// ==================== EXPOSED API ====================
const electronAPI = {
  getAppInfo: () => {
    validateIPCChannel('get-app-info');
    return ipcRenderer.invoke('get-app-info');
  },

  acceptLegalDisclaimer: () => {
    validateIPCChannel('accept-legal-disclaimer');
    return ipcRenderer.invoke('accept-legal-disclaimer');
  },

  openLogsFolder: () => {
    validateIPCChannel('open-logs-folder');
    return ipcRenderer.invoke('open-logs-folder');
  },

  openEvidenceFolder: () => {
    validateIPCChannel('open-evidence-folder');
    return ipcRenderer.invoke('open-evidence-folder');
  },

  getSecurityEvents: () => {
    validateIPCChannel('get-security-events');
    return ipcRenderer.invoke('get-security-events');
  },

  clearSecurityEvents: () => {
    validateIPCChannel('clear-security-events');
    return ipcRenderer.invoke('clear-security-events');
  },

  importEvidence: (evidenceData) => {
    validateIPCChannel('import-evidence');
    return ipcRenderer.invoke('import-evidence', evidenceData);
  },

  getForensicSnapshot: (path) => {
    validateIPCChannel('get-forensic-snapshot');
    return ipcRenderer.invoke('get-forensic-snapshot', path);
  },

  validateUrl: (url) => {
    validateIPCChannel('validate-url');
    return ipcRenderer.invoke('validate-url', url);
  },

  logMessage: (level, message, meta = {}) => {
    validateIPCChannel('log-message');
    ipcRenderer.send('log-message', { level, message, meta });
  },

  copyToClipboard: (text) => {
    try {
      clipboard.writeText(text);
      ipcRenderer.send('log-message', { level: 'INFO', message: 'CLIPBOARD_WRITE_SUCCESS' });
      return true;
    } catch (err) {
      ipcRenderer.send('log-message', { level: 'ERROR', message: 'CLIPBOARD_WRITE_FAILURE', meta: { error: err.message } });
      return false;
    }
  },

  readClipboardText: () => {
    try {
      return clipboard.readText();
    } catch (err) {
      ipcRenderer.send('log-message', { level: 'ERROR', message: 'CLIPBOARD_READ_FAILURE', meta: { error: err.message } });
      return "";
    }
  },

  exportSecurityReport: (data) => {
    validateIPCChannel('export-security-report');
    return ipcRenderer.invoke('export-security-report', data);
  },

  validateLicense: () => {
    validateIPCChannel('validate-license');
    return ipcRenderer.invoke('validate-license');
  },

  getLicenseInfo: () => {
    validateIPCChannel('get-license-info');
    return ipcRenderer.invoke('get-license-info');
  },

  exportPdf: (html, filename) => {
    validateIPCChannel('export-pdf');
    return ipcRenderer.invoke('export-pdf', { html, filename });
  },

  finalFreeze: (caseData, reports) => {
    validateIPCChannel('final-freeze');
    return ipcRenderer.invoke('final-freeze', { caseData, reports });
  },

  automationSetMode: (mode) => {
    validateIPCChannel('automation-set-mode');
    return ipcRenderer.invoke('automation-set-mode', mode);
  },

  automationGetState: () => {
    validateIPCChannel('automation-get-state');
    return ipcRenderer.invoke('automation-get-state');
  },

  onAutomationEvent: (callback) => {
    // Note: This relies on directly listening, we don't strict validate inbound events in the same way
    ipcRenderer.on('automation-event', (event, payload) => callback(payload));
  },

  // Case Management API
  caseList: () => {
    validateIPCChannel('case-list');
    return ipcRenderer.invoke('case-list');
  },
  caseCreate: (title) => {
    validateIPCChannel('case-create');
    return ipcRenderer.invoke('case-create', title);
  },
  caseLoad: (caseId) => {
    validateIPCChannel('case-load');
    return ipcRenderer.invoke('case-load', caseId);
  },
  caseSave: (caseData) => {
    validateIPCChannel('case-save');
    return ipcRenderer.invoke('case-save', caseData);
  },
  caseDelete: (caseId) => {
    validateIPCChannel('case-delete');
    return ipcRenderer.invoke('case-delete', caseId);
  },
  caseAttachBundle: (caseId, bundlePath) => {
    validateIPCChannel('case-attach-bundle');
    return ipcRenderer.invoke('case-attach-bundle', { caseId, bundlePath });
  },
  caseAddNote: (caseId, content) => {
    validateIPCChannel('case-add-note');
    return ipcRenderer.invoke('case-add-note', { caseId, content });
  },
  caseExportNotes: (caseId, filename) => {
    validateIPCChannel('case-export-notes');
    return ipcRenderer.invoke('case-export-notes', { caseId, filename });
  },
  caseAddFinding: (caseId, findingData) => {
    validateIPCChannel('case-add-finding');
    return ipcRenderer.invoke('case-add-finding', { caseId, findingData });
  },
  caseUpdateFinding: (caseId, findingId, updates) => {
    validateIPCChannel('case-update-finding');
    return ipcRenderer.invoke('case-update-finding', { caseId, findingId, updates });
  },
  caseCompare: (bundlePathA, bundlePathB) => {
    validateIPCChannel('case-compare');
    return ipcRenderer.invoke('case-compare', { bundlePathA, bundlePathB });
  },

  // Trust Layer API (Phase 58)
  auditLog: (type, data) => {
    validateIPCChannel('audit-log');
    return ipcRenderer.invoke('audit-log', { type, data });
  },
  auditGetLogs: () => {
    validateIPCChannel('audit-get-logs');
    return ipcRenderer.invoke('audit-get-logs');
  },
  custodyRecord: (fingerprint, action, details) => {
    validateIPCChannel('custody-record');
    return ipcRenderer.invoke('custody-record', { fingerprint, action, details });
  },
  custodyGetChain: (fingerprint) => {
    validateIPCChannel('custody-get-chain');
    return ipcRenderer.invoke('custody-get-chain', fingerprint);
  },
  evidenceSign: (data) => {
    validateIPCChannel('evidence-sign');
    return ipcRenderer.invoke('evidence-sign', data);
  },
  evidenceVerify: (data, signature, publicKey) => {
    validateIPCChannel('evidence-verify');
    return ipcRenderer.invoke('evidence-verify', { data, signature, publicKey });
  },
  evidenceSealCase: (caseId, destinationDir) => {
    validateIPCChannel('evidence-seal-case');
    return ipcRenderer.invoke('evidence-seal-case', { caseId, destinationDir });
  },

  // Intelligence Graph API (Phase 59)
  intelligenceGetGraph: () => {
    validateIPCChannel('intelligence-get-graph');
    return ipcRenderer.invoke('intelligence-get-graph');
  },
  intelligenceGetSimilar: (fingerprint) => {
    validateIPCChannel('intelligence-get-similar');
    return ipcRenderer.invoke('intelligence-get-similar', fingerprint);
  },
  intelligenceRebuildGraph: () => {
    validateIPCChannel('intelligence-rebuild-graph');
    return ipcRenderer.invoke('intelligence-rebuild-graph');
  },

  // Plugin API (Phase 60)
  pluginsList: () => {
    validateIPCChannel('plugins-list');
    return ipcRenderer.invoke('plugins-list');
  },
  pluginsLoad: (path) => {
    validateIPCChannel('plugins-load');
    return ipcRenderer.invoke('plugins-load', path);
  },
  pluginsRunCapability: (pluginId, capability, context) => {
    validateIPCChannel('plugins-run-capability');
    return ipcRenderer.invoke('plugins-run-capability', { pluginId, capability, context });
  },

  // HyperQuery API (Phase 61)
  queryExecute: (queryStr) => {
    validateIPCChannel('query-execute');
    return ipcRenderer.invoke('query-execute', queryStr);
  },
  queryStats: () => {
    validateIPCChannel('query-stats');
    return ipcRenderer.invoke('query-stats');
  },

  // Replay Mutation API (Phase 62)
  replayMutateSet: (sessionId, config) => {
    validateIPCChannel('replay-mutate-set');
    return ipcRenderer.invoke('replay-mutate-set', { sessionId, config });
  },
  replayMutateClear: (sessionId) => {
    validateIPCChannel('replay-mutate-clear');
    return ipcRenderer.invoke('replay-mutate-clear', sessionId);
  },

  // Detection Rules API (Phase 63)
  rulesScanBundle: (bundle) => {
    validateIPCChannel('rules-scan-bundle');
    return ipcRenderer.invoke('rules-scan-bundle', bundle);
  },

  // Research Mode API (Phase 64)
  researchListScripts: () => {
    validateIPCChannel('research-list-scripts');
    return ipcRenderer.invoke('research-list-scripts');
  },
  researchRunScript: (scriptName, context) => {
    validateIPCChannel('research-run-script');
    return ipcRenderer.invoke('research-run-script', { scriptName, context });
  },

  // Dataset Export API (Phase 65)
  exportCaseData: (caseData, format, path) => {
    validateIPCChannel('export-case-data');
    return ipcRenderer.invoke('export-case-data', { caseData, format, targetPath: path });
  },

  // Pattern Discovery API (Phase 66)
  patternsDiscover: (bundles) => {
    validateIPCChannel('patterns-discover');
    return ipcRenderer.invoke('patterns-discover', bundles);
  },
  patternsCluster: (bundles, traits) => {
    validateIPCChannel('patterns-cluster');
    return ipcRenderer.invoke('patterns-cluster', { bundles, traits });
  },
  patternsAnomalies: (bundles, patterns) => {
    validateIPCChannel('patterns-anomalies');
    return ipcRenderer.invoke('patterns-anomalies', { bundles, patterns });
  },
  patternsStats: () => {
    validateIPCChannel('patterns-stats');
    return ipcRenderer.invoke('patterns-stats');
  },

  // Topology Mapper API (Phase 67)
  topologyMapCase: (bundles) => {
    validateIPCChannel('topology-map-case');
    return ipcRenderer.invoke('topology-map-case', bundles);
  },

  // Insight Generator API (Phase 68)
  insightsGenerate: (patterns, anomalies, topology) => {
    validateIPCChannel('insights-generate');
    return ipcRenderer.invoke('insights-generate', { patterns, anomalies, topology });
  },

  // Case Assistant API (Phase 69)
  assistantBriefing: (caseData) => {
    validateIPCChannel('assistant-briefing');
    return ipcRenderer.invoke('assistant-briefing', caseData);
  },
  assistantSuggestRelated: (targetBundle, allBundles) => {
    validateIPCChannel('assistant-suggest-related');
    return ipcRenderer.invoke('assistant-suggest-related', { targetBundle, allBundles });
  },
  assistantProposeExperiments: (bundle) => {
    validateIPCChannel('assistant-propose-experiments');
    return ipcRenderer.invoke('assistant-propose-experiments', bundle);
  },

  // Autonomous Investigator API (Phase 70)
  autoInvestigate: (bundles) => {
    validateIPCChannel('auto-investigate');
    return ipcRenderer.invoke('auto-investigate', bundles);
  },

  // AI Pattern Classifier API (Phase 71)
  aiClassifyBundles: (bundles) => {
    validateIPCChannel('ai-classify-bundles');
    return ipcRenderer.invoke('ai-classify-bundles', bundles);
  },

  // Anomaly Scorer API (Phase 72)
  aiScoreAnomalies: (observations) => {
    validateIPCChannel('ai-score-anomalies');
    return ipcRenderer.invoke('ai-score-anomalies', observations);
  },

  // Fingerprint Library API (Phase 73)
  fplibAdd: (entry) => {
    validateIPCChannel('fplib-add');
    return ipcRenderer.invoke('fplib-add', entry);
  },
  fplibSearch: (features) => {
    validateIPCChannel('fplib-search');
    return ipcRenderer.invoke('fplib-search', features);
  },
  fplibCompare: (candidate) => {
    validateIPCChannel('fplib-compare');
    return ipcRenderer.invoke('fplib-compare', candidate);
  },
  fplibExport: () => {
    validateIPCChannel('fplib-export');
    return ipcRenderer.invoke('fplib-export');
  },

  // Cross-Case Miner API (Phase 74)
  crossCaseMine: (cases) => {
    validateIPCChannel('cross-case-mine');
    return ipcRenderer.invoke('cross-case-mine', cases);
  },

  // Autonomous Research API (Phase 75)
  researchGenerate: (context) => {
    validateIPCChannel('research-generate');
    return ipcRenderer.invoke('research-generate', context);
  },
  researchUpdateState: (id, state) => {
    validateIPCChannel('research-update-state');
    return ipcRenderer.invoke('research-update-state', { id, state });
  },
  researchReviewPacket: () => {
    validateIPCChannel('research-review-packet');
    return ipcRenderer.invoke('research-review-packet');
  },

  // Workspace Store API (Phase 76)
  wsCreate: (name, options) => {
    validateIPCChannel('ws-create');
    return ipcRenderer.invoke('ws-create', { name, options });
  },
  wsList: () => {
    validateIPCChannel('ws-list');
    return ipcRenderer.invoke('ws-list');
  },
  wsAddMember: (wsId, member) => {
    validateIPCChannel('ws-add-member');
    return ipcRenderer.invoke('ws-add-member', { wsId, member });
  },
  wsAssignCase: (wsId, caseId, analystId) => {
    validateIPCChannel('ws-assign-case');
    return ipcRenderer.invoke('ws-assign-case', { wsId, caseId, analystId });
  },
  wsActivityFeed: (wsId) => {
    validateIPCChannel('ws-activity-feed');
    return ipcRenderer.invoke('ws-activity-feed', wsId);
  },

  // Trust Registry API (Phase 77)
  trustAddSource: (source) => {
    validateIPCChannel('trust-add-source');
    return ipcRenderer.invoke('trust-add-source', source);
  },
  trustVerify: (sourceId) => {
    validateIPCChannel('trust-verify');
    return ipcRenderer.invoke('trust-verify', sourceId);
  },
  trustLogExchange: (data) => {
    validateIPCChannel('trust-log-exchange');
    return ipcRenderer.invoke('trust-log-exchange', data);
  },
  trustAudit: () => {
    validateIPCChannel('trust-audit');
    return ipcRenderer.invoke('trust-audit');
  },

  // Centrality Engine API (Phase 78)
  graphCentrality: (graph) => {
    validateIPCChannel('graph-centrality');
    return ipcRenderer.invoke('graph-centrality', graph);
  },
  graphBridges: (graph) => {
    validateIPCChannel('graph-bridges');
    return ipcRenderer.invoke('graph-bridges', graph);
  },
  graphRankClusters: (graph) => {
    validateIPCChannel('graph-rank-clusters');
    return ipcRenderer.invoke('graph-rank-clusters', graph);
  },
  graphHotNodes: (graph) => {
    validateIPCChannel('graph-hot-nodes');
    return ipcRenderer.invoke('graph-hot-nodes', graph);
  },

  // Policy Engine API (Phase 79)
  policyLoad: (rules) => {
    validateIPCChannel('policy-load');
    return ipcRenderer.invoke('policy-load', rules);
  },
  policyEvaluate: (context, actor) => {
    validateIPCChannel('policy-evaluate');
    return ipcRenderer.invoke('policy-evaluate', { context, actor });
  },
  policyCheck: (action, context) => {
    validateIPCChannel('policy-check');
    return ipcRenderer.invoke('policy-check', { action, context });
  },
  policyAudit: () => {
    validateIPCChannel('policy-audit');
    return ipcRenderer.invoke('policy-audit');
  },

  // Deployment Profiles API (Phase 80)
  deployList: () => {
    validateIPCChannel('deploy-list');
    return ipcRenderer.invoke('deploy-list');
  },
  deployActivate: (name) => {
    validateIPCChannel('deploy-activate');
    return ipcRenderer.invoke('deploy-activate', name);
  },
  deployCompliance: (action, context) => {
    validateIPCChannel('deploy-compliance');
    return ipcRenderer.invoke('deploy-compliance', { action, context });
  },
  deployQuota: () => {
    validateIPCChannel('deploy-quota');
    return ipcRenderer.invoke('deploy-quota');
  },

  // Review Workflow API (Phase 81)
  reviewCreate: (caseId, reviewer, options) => {
    validateIPCChannel('review-create');
    return ipcRenderer.invoke('review-create', { caseId, reviewer, options });
  },
  reviewComment: (reviewId, author, text) => {
    validateIPCChannel('review-comment');
    return ipcRenderer.invoke('review-comment', { reviewId, author, text });
  },
  reviewDecide: (reviewId, decision, reason) => {
    validateIPCChannel('review-decide');
    return ipcRenderer.invoke('review-decide', { reviewId, decision, reason });
  },
  reviewPending: () => {
    validateIPCChannel('review-pending');
    return ipcRenderer.invoke('review-pending');
  },

  // Redaction Engine API (Phase 82)
  redactText: (text, rules) => {
    validateIPCChannel('redact-text');
    return ipcRenderer.invoke('redact-text', { text, rules });
  },
  redactBundle: (bundle) => {
    validateIPCChannel('redact-bundle');
    return ipcRenderer.invoke('redact-bundle', bundle);
  },

  // Publication Pipeline API (Phase 83)
  pubSubmit: (report, author) => {
    validateIPCChannel('pub-submit');
    return ipcRenderer.invoke('pub-submit', { report, author });
  },
  pubTransition: (itemId, state, actor) => {
    validateIPCChannel('pub-transition');
    return ipcRenderer.invoke('pub-transition', { itemId, state, actor });
  },
  pubList: (state) => {
    validateIPCChannel('pub-list');
    return ipcRenderer.invoke('pub-list', state);
  },

  // Model Reporter API (Phase 84)
  reportGenerate: (caseData) => {
    validateIPCChannel('report-generate');
    return ipcRenderer.invoke('report-generate', caseData);
  },

  // Deployment Orchestrator API (Phase 85)
  orchestrateDeploy: (profile, environment) => {
    validateIPCChannel('orchestrate-deploy');
    return ipcRenderer.invoke('orchestrate-deploy', { profile, environment });
  },
  orchestrateRollback: (deploymentId) => {
    validateIPCChannel('orchestrate-rollback');
    return ipcRenderer.invoke('orchestrate-rollback', deploymentId);
  },
  orchestrateHistory: () => {
    validateIPCChannel('orchestrate-history');
    return ipcRenderer.invoke('orchestrate-history');
  },

  // Timeline Engine API (Phase 86)
  timelineReconstruct: (caseId, events) => {
    validateIPCChannel('timeline-reconstruct');
    return ipcRenderer.invoke('timeline-reconstruct', { caseId, events });
  },
  timelineGet: (caseId) => {
    validateIPCChannel('timeline-get');
    return ipcRenderer.invoke('timeline-get', caseId);
  },

  // Infrastructure Tracker API (Phase 87)
  infraRecord: (node, caseId, timestamp) => {
    validateIPCChannel('infra-record');
    return ipcRenderer.invoke('infra-record', { node, caseId, timestamp });
  },
  infraHistory: (nodeId) => {
    validateIPCChannel('infra-history');
    return ipcRenderer.invoke('infra-history', nodeId);
  },
  infraMigrations: () => {
    validateIPCChannel('infra-migrations');
    return ipcRenderer.invoke('infra-migrations');
  },
  infraDrift: () => {
    validateIPCChannel('infra-drift');
    return ipcRenderer.invoke('infra-drift');
  },

  // Predictive Anomaly API (Phase 88)
  predictRisk: (patternHistory, context) => {
    validateIPCChannel('predict-risk');
    return ipcRenderer.invoke('predict-risk', { patternHistory, context });
  },
  predictHighRisk: () => {
    validateIPCChannel('predict-high-risk');
    return ipcRenderer.invoke('predict-high-risk');
  },

  // Forensic Simulator API (Phase 89)
  simulateScenario: (scenario, bundle) => {
    validateIPCChannel('simulate-scenario');
    return ipcRenderer.invoke('simulate-scenario', { scenario, bundle });
  },
  simulateHistory: () => {
    validateIPCChannel('simulate-history');
    return ipcRenderer.invoke('simulate-history');
  },

  // Threat Reporter API (Phase 90)
  threatGenerate: (caseData) => {
    validateIPCChannel('threat-generate');
    return ipcRenderer.invoke('threat-generate', caseData);
  },
  threatList: () => {
    validateIPCChannel('threat-list');
    return ipcRenderer.invoke('threat-list');
  },

  // Global Graph API (Phase 91)
  globalGraphAddNode: (id, type, data, sourceCtx) => {
    validateIPCChannel('global-graph-add-node');
    return ipcRenderer.invoke('global-graph-add-node', { id, type, data, sourceCtx });
  },
  globalGraphAddEdge: (sourceId, targetId, relation, data, sourceCtx) => {
    validateIPCChannel('global-graph-add-edge');
    return ipcRenderer.invoke('global-graph-add-edge', { sourceId, targetId, relation, data, sourceCtx });
  },
  globalGraphNeighborhood: (nodeId, depth) => {
    validateIPCChannel('global-graph-neighborhood');
    return ipcRenderer.invoke('global-graph-neighborhood', { nodeId, depth });
  },
  globalGraphLineage: (elementId) => {
    validateIPCChannel('global-graph-lineage');
    return ipcRenderer.invoke('global-graph-lineage', elementId);
  },
  globalGraphSummary: () => {
    validateIPCChannel('global-graph-summary');
    return ipcRenderer.invoke('global-graph-summary');
  },

  // Infra Attribution API (Phase 92)
  attribAttribute: (context) => {
    validateIPCChannel('attrib-attribute');
    return ipcRenderer.invoke('attrib-attribute', context);
  },

  // Adversary Fingerprinting API (Phase 93)
  advfpFingerprint: (observation) => {
    validateIPCChannel('advfp-fingerprint');
    return ipcRenderer.invoke('advfp-fingerprint', observation);
  },
  advfpCompare: (fp1_label, fp2_label) => {
    validateIPCChannel('advfp-compare');
    return ipcRenderer.invoke('advfp-compare', { fp1_label, fp2_label });
  },
  advfpGroup: () => {
    validateIPCChannel('advfp-group');
    return ipcRenderer.invoke('advfp-group');
  },

  // Self-Healing Orchestrator API (Phase 94)
  healRecover: (failureContext) => {
    validateIPCChannel('heal-recover');
    return ipcRenderer.invoke('heal-recover', failureContext);
  },
  healAudit: () => {
    validateIPCChannel('heal-audit');
    return ipcRenderer.invoke('heal-audit');
  },

  // Autonomous Discovery API (Phase 95)
  discoveryRun: (context) => {
    validateIPCChannel('discovery-run');
    return ipcRenderer.invoke('discovery-run', context);
  },
  discoveryHistory: () => {
    validateIPCChannel('discovery-history');
    return ipcRenderer.invoke('discovery-history');
  },

  // Endgame Command Layer API (Phases 96-100)
  endgameCommand: (command, payload) => {
    validateIPCChannel('endgame-command');
    return ipcRenderer.invoke('endgame-command', { command, payload });
  },
  endgameHistory: () => {
    validateIPCChannel('endgame-history');
    return ipcRenderer.invoke('endgame-history');
  },
  endgameReplayGet: (caseId) => {
    validateIPCChannel('endgame-replay-get');
    return ipcRenderer.invoke('endgame-replay-get', caseId);
  },

  // Expansion API
  expMemoryRecord: (caseId, analystId, suggestionId, decision, notes) => {
    validateIPCChannel('exp-memory-record');
    return ipcRenderer.invoke('exp-memory-record', { caseId, analystId, suggestionId, decision, notes });
  },
  expMemoryAnnotate: (caseId, analystId, targetId, text) => {
    validateIPCChannel('exp-memory-annotate');
    return ipcRenderer.invoke('exp-memory-annotate', { caseId, analystId, targetId, text });
  },
  expHeatmapGenerate: (graphContext) => {
    validateIPCChannel('exp-heatmap-generate');
    return ipcRenderer.invoke('exp-heatmap-generate', graphContext);
  },
  expProvTag: (signalId, source, dataset) => {
    validateIPCChannel('exp-prov-tag');
    return ipcRenderer.invoke('exp-prov-tag', { signalId, source, dataset });
  },
  expProvStep: (signalId, stepName, weight) => {
    validateIPCChannel('exp-prov-step');
    return ipcRenderer.invoke('exp-prov-step', { signalId, stepName, weight });
  },
  expExplain: (type, context) => {
    validateIPCChannel('exp-explain');
    return ipcRenderer.invoke('exp-explain', { type, context });
  },

  // Ultimate Evolution API (Phases 101-150)
  advNarrativeTrack: (graphSequence) => {
    validateIPCChannel('adv-narrative-track');
    return ipcRenderer.invoke('adv-narrative-track', graphSequence);
  },
  advOperatorModel: (operatorId, telemetryLogs) => {
    validateIPCChannel('adv-operator-model');
    return ipcRenderer.invoke('adv-operator-model', { operatorId, telemetryLogs });
  },
  advOperatorGet: (operatorId) => {
    validateIPCChannel('adv-operator-get');
    return ipcRenderer.invoke('adv-operator-get', operatorId);
  },
  advPredictFuture: (graphTrends, behaviorProfile) => {
    validateIPCChannel('adv-predict-future');
    return ipcRenderer.invoke('adv-predict-future', { graphTrends, behaviorProfile });
  },
  advAssistantSynthesize: (graphSequence, telemetryLogs) => {
    validateIPCChannel('adv-assistant-synthesize');
    return ipcRenderer.invoke('adv-assistant-synthesize', { graphSequence, telemetryLogs });
  }
};

// ==================== INITIALIZATION ====================
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

contextBridge.exposeInMainWorld('smartDecode', {
  run: async (input, options) => {
    validateIPCChannel('smart-decode-run');
    return ipcRenderer.invoke('smart-decode-run', { input, options });
  },
  signSession: async (sessionState, systemInfo) => {
    validateIPCChannel('smart-decode-sign-session');
    return ipcRenderer.invoke('smart-decode-sign-session', { sessionState, systemInfo });
  },
  verifySession: async (bundle) => {
    validateIPCChannel('smart-decode-verify-session');
    return ipcRenderer.invoke('smart-decode-verify-session', bundle);
  }
});
