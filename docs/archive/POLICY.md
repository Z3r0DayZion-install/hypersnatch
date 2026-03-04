# HyperSnatch - Policy Documentation

---

## 📋 POLICY OVERVIEW

**Date:** 2026-02-19  
**Version:** 1.0.0  
**Mode:** Security-First Evidence Analyzer  

---

## 🎯 POLICY PHILOSOPHY

**HyperSnatch is NOT a download bypass tool.** It is a security/compliance-first evidence analyzer that validates candidates only where users are authorized to access resources.

### **Core Principles**
1. **Truthful States:** Candidates are "detected" until validated
2. **Authorized Validation:** Only validate authorized resources
3. **Policy Enforcement:** Strict blocking of unauthorized access
4. **Evidence Integrity:** Complete audit trail of all operations
5. **No Evasion:** No features designed to bypass controls

---

## 🛡️ POLICY RULES

### **Default Policy Configuration**
```json
{
  "version": "1.0.0",
  "mode": "strict",
  "allowlistEnabled": true,
  "allowedHosts": ["localhost", "127.0.0.1"],
  "allowedPorts": [3000, 8000, 8080, 3001],
  "allowedContentTypes": [
    "text/html",
    "application/json", 
    "text/plain"
  ],
  "premiumMarkers": [
    "subscribe", "premium", "login", "paywall", "purchase", 
    "access denied", "subscription", "upgrade", "payment"
  ]
}
```

---

## 🎯 CANDIDATE STATES

### **DecodeStatus Enum**
```javascript
const DecodeStatus = {
  DETECTED: 'detected',     // Pattern matched, not validated
  VALIDATED: 'validated',   // Passed validation, authorized
  BLOCKED: 'blocked',      // Policy violation
  UNKNOWN: 'unknown',       // Insufficient data
  ERROR: 'error'          // Processing error
};
```

### **State Transitions**
```
DETECTED → VALIDATED: Validation pipeline successful
DETECTED → BLOCKED: Policy violation detected
VALIDATED → ALLOWED: Candidate authorized for access
BLOCKED → REFUSED: Processing stopped
UNKNOWN → DETECTED: More data becomes available
ERROR → UNKNOWN: Error resolved
```

---

## 🔍 VALIDATION PIPELINE

### **Validation Sources**
1. **Mock Validator** (Default)
   - **Purpose:** Deterministic testing
   - **Network:** No external calls
   - **Security:** ✅ Safe

2. **Local Server Validator**
   - **Purpose:** Local development testing
   - **Network:** localhost only
   - **Security:** ✅ Safe

3. **Allowlist Validator** (Optional)
   - **Purpose:** Production validation
   - **Network:** Allowlist only
   - **Security:** ⚠️ Requires configuration

### **Validation Checks**
```javascript
const validationChecks = [
  {
    name: 'url_format',
    description: 'Valid HTTP/HTTPS URL format',
    required: true
  },
  {
    name: 'host_allowed',
    description: 'Host is in allowlist',
    required: true
  },
  {
    name: 'confidence_threshold',
    description: 'Confidence meets minimum threshold (0.5)',
    required: true
  },
  {
    name: 'method_allowed',
    description: 'Extraction method is authorized',
    required: true
  },
  {
    name: 'content_type',
    description: 'Content type is allowed',
    required: false
  },
  {
    name: 'network_request',
    description: 'Network request successful',
    required: false
  }
];
```

---

## 🛡️ POLICY ENFORCEMENT

### **Policy Modes**

#### **Strict Mode** (Default)
- **Premium Markers:** ❌ **BLOCK** all candidates with premium markers
- **Detected Candidates:** ❌ **BLOCK** unless validated
- **Validated Candidates:** ✅ **ALLOW** all access
- **Unknown Candidates:** ⚠️ **LOG** with warning
- **Error States:** 🚨 **STOP** processing

#### **Audit Mode**
- **Premium Markers:** ⚠️ **WARN** but allow access
- **Detected Candidates:** ⚠️ **WARN** but allow access
- **Validated Candidates:** ✅ **ALLOW** all access
- **Unknown Candidates:** ⚠️ **WARN** with warning
- **Error States:** 🚨 **STOP** processing

#### **Lab Mode**
- **Premium Markers:** ℹ️ **ANALYZE** only, no blocking
- **Detected Candidates:** ℹ️ **ANALYZE** only
- **Validated Candidates:** ℹ️ **ANALYZE** only
- **Unknown Candidates:** ℹ️ **ANALYZE** only
- **Error States:** 🚨 **STOP** processing

---

## 📝 EVIDENCE LOGGING

### **Log Structure**
```javascript
{
  timestamp: "2026-02-19T00:00:00.000Z",
  action: "candidate_validation",
  candidateId: "emload-v2-ajRGMlgyUmt0VXNnc01xNzRiZk5Odz09",
  validator: "mock",
  status: "validated",
  checks: [
    {
      name: "url_format",
      pass: true,
      info: "Valid URL format"
    }
  ]
}
```

### **Log Types**
- **candidate_validation:** Candidate validation results
- **policy_check:** Policy evaluation results
- **candidate_blocked:** Policy violation blocking
- **export_operation:** Evidence export actions
- **system_event:** System state changes

---

## 🔐 ACCESS CONTROL

### **Role-Based Access**
- **Analyst:** Full access to all features
- **Operator:** Limited to validated candidates only
- **Viewer:** Read-only access to evidence
- **Auditor:** Access to policy configuration only

### **Feature Gating**
- **Basic:** Detected candidates only
- **Standard:** Validated candidates
- **Premium:** Full validation pipeline
- **Enterprise:** Custom policy rules

---

## 🚨 VIOLATION HANDLING

### **Policy Events**
```javascript
{
  ruleId: "premium_content_detected",
  shortReason: "Premium markers found",
  remediationHint: "Remove premium markers or use authorized access",
  timestamp: "2026-02-19T00:00:00.000Z",
  candidateId: "emload-v2-ajRGMlgyUmt0VXNnc01xNzRiZk5Odz09"
}
```

### **Block Reasons**
- **Premium Content:** "Premium markers detected: subscribe, premium"
- **Host Not Allowed:** "Host not in allowlist"
- **Validation Failed:** "Candidate validation failed"
- **Policy Violation:** "Policy rule violated"

---

## 📋 COMPLIANCE REQUIREMENTS

### **Before Deployment**
- [ ] Allowlist configured for production
- [ ] Policy mode set to "strict"
- [ ] All tests passing
- [ ] Security hardening enabled
- [ ] Evidence logging verified

### **Runtime Monitoring**
- [ ] Policy violations logged
- [ ] Validation failures tracked
- [ ] Network access monitored
- [ ] Evidence integrity checked
- [ ] Performance metrics collected

---

## 🔧 CONFIGURATION MANAGEMENT

### **Adding Allowlist Entries**
```javascript
// Add new host to allowlist
const config = require('./config/allowlist.json');
config.allowedHosts.push('new.example.com');
fs.writeFileSync('./config/allowlist.json', JSON.stringify(config, null, 2));
```

### **Policy Mode Changes**
```javascript
// Switch to audit mode
const config = require('./config/policy.json');
config.mode = 'audit';
fs.writeFileSync('./config/policy.json', JSON.stringify(config, null, 2));
```

---

## 📞 SUPPORT

### **Policy Questions**
- **How to add new hosts?** Edit `config/allowlist.json`
- **How to change policy mode?** Edit `config/policy.json`
- **How to add custom rules?** Contact security team
- **How to report violations?** Use evidence export feature

### **Security Issues**
- **Report security vulnerabilities** to private security channel
- **Policy bypass attempts** are logged and blocked
- **Unauthorized access** triggers immediate policy enforcement

---

**This policy documentation ensures HyperSnatch maintains security-first operations while providing flexible validation capabilities.**
