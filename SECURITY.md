# HyperSnatch - Security Documentation

---

## 📋 SECURITY OVERVIEW

**Date:** 2026-02-19  
**Version:** 1.0.0  
**Posture:** Security-First Evidence Analyzer  

---

## 🛡️ SECURITY PRINCIPLES

### **1. Default Deny Posture**
- **Allowlist Only:** Only localhost access by default
- **Policy Enforcement:** Strict mode enabled by default
- **Validation Required:** All candidates must pass validation
- **Evidence Logging:** Complete audit trail for all operations

### **2. Context Isolation**
- **Renderer Isolation:** No direct Node.js access
- **IPC Hardening:** Only allowed channels
- **Sandbox Mode:** Enabled for all processes
- **CSP Enforcement:** Content Security Policy active

### **3. Deterministic Validation**
- **No Network Bypass:** Only authorized validation sources
- **Mock Testing:** Deterministic test results
- **Local Server Only:** Network access limited to localhost
- **Allowlist Control:** Explicit host allowlist required

---

## 🔧 ELECTRON SECURITY SETTINGS

### **BrowserWindow Configuration**
```javascript
{
  webPreferences: {
    contextIsolation: true,        // ✅ ENABLED
    nodeIntegration: false,        // ✅ DISABLED
    enableRemoteModule: false,      // ✅ DISABLED
    sandbox: true,                 // ✅ ENABLED
    webSecurity: true,              // ✅ ENABLED
    preload: path.join(__dirname, 'preload.js')
  }
}
```

### **Content Security Policy**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data:;">
```

---

## 🔐 VALIDATION SECURITY

### **Validator Modes**

#### **Mock Validator** (Default)
- **Network Access:** None
- **Deterministic:** Yes
- **Use Case:** Testing and development
- **Security:** ✅ Safe - no external calls

#### **Local Server Validator**
- **Network Access:** localhost only
- **Allowed Ports:** 3000, 8000, 8080, 3001
- **Timeout:** 5 seconds
- **Security:** ✅ Safe - local only

#### **Allowlist Validator** (Optional)
- **Network Access:** allowlist only
- **Explicit Enable:** Required
- **Host Control:** Strict allowlist enforcement
- **Security:** ⚠️ Requires careful configuration

### **Validation Checks**
1. **URL Format:** Valid HTTP/HTTPS URL
2. **Host Allowlist:** Only allowed hosts
3. **Port Validation:** Only allowed ports
4. **Network Request:** HEAD request only
5. **Content Type:** Allowed content types only
6. **Policy Compliance:** No premium markers

---

## 🛡️ POLICY ENFORCEMENT

### **Policy Modes**

#### **Strict Mode** (Default)
- **Premium Markers:** Block all
- **Detected Candidates:** Require validation
- **Validated Candidates:** Allowed
- **Blocked Candidates:** Refuse processing

#### **Audit Mode**
- **Premium Markers:** Warning only
- **Detected Candidates:** Allowed with warning
- **Validated Candidates:** Allowed
- **Blocked Candidates:** Allowed with warning

#### **Lab Mode**
- **Premium Markers:** Analysis only
- **Detected Candidates:** Analysis only
- **Validated Candidates:** Analysis only
- **Blocked Candidates:** Analysis only

### **Policy Rules**
```javascript
const policyRules = {
  // Premium content markers
  premiumMarkers: [
    'subscribe', 'premium', 'login', 'paywall', 'purchase',
    'access denied', 'subscription', 'upgrade', 'payment'
  ],
  
  // Default allowlist
  allowedHosts: ['localhost', '127.0.0.1'],
  
  // Allowed ports
  allowedPorts: [3000, 8000, 8080, 3001],
  
  // Allowed content types
  allowedContentTypes: [
    'text/html', 'application/json', 'text/plain'
  ]
};
```

---

## 📝 EVIDENCE LOGGING

### **Log Format**
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

### **Log Storage**
- **In-Memory:** During session
- **Export:** JSON format
- **Persistence:** User-initiated export
- **Integrity:** No tamper protection (TODO)

---

## 🔍 SECURITY TESTING

### **Test Coverage**
- ✅ **Unit Tests:** Parser, validator, policy
- ✅ **Integration Tests:** End-to-end workflows
- ✅ **Security Tests:** IPC, CSP, sandbox
- ✅ **Regression Tests:** Golden file comparison

### **Test Fixtures**
- **Detected Candidate:** Normal URL detection
- **Blocked Candidate:** Premium content blocking
- **Validated Candidate:** Successful validation
- **Unknown Candidate:** Insufficient data

---

## 🚨 SECURITY RISKS

### **Critical Risks** 🔴
- **None Identified** - Current implementation is secure

### **Moderate Risks** ⚠️
- **Evidence Tampering:** No integrity protection
- **Allowlist Misconfiguration:** User error possible
- **Policy Bypass:** Lab mode allows analysis only

### **Low Risks** ✅
- **Browser Compatibility:** Modern features only
- **Performance:** Validation overhead
- **Storage:** In-memory evidence logging

---

## 📋 SECURITY CHECKLIST

### **Before Deployment**
- [ ] Context isolation enabled
- [ ] Node integration disabled
- [ ] Sandbox mode enabled
- [ ] CSP headers present
- [ ] Allowlist localhost only
- [ ] Strict policy mode default
- [ ] Evidence logging enabled
- [ ] Tests passing

### **Runtime Monitoring**
- [ ] Policy violations logged
- [ ] Validation failures tracked
- [ ] Network access monitored
- [ ] Evidence integrity checked
- [ ] Performance metrics collected

---

## 🔧 SECURITY CONFIGURATION

### **Production Settings**
```json
{
  "allowlistEnabled": true,
  "allowedHosts": ["localhost", "127.0.0.1"],
  "allowedPorts": [3000, 8000, 8080, 3001],
  "policyMode": "strict",
  "validatorMode": "mock",
  "evidenceLogging": true,
  "sandboxEnabled": true
}
```

### **Development Settings**
```json
{
  "allowlistEnabled": true,
  "allowedHosts": ["localhost", "127.0.0.1", "example.com"],
  "allowedPorts": [3000, 8000, 8080, 3001],
  "policyMode": "audit",
  "validatorMode": "mock",
  "evidenceLogging": true,
  "sandboxEnabled": true
}
```

---

## 📞 SECURITY CONTACT

- **Security Issues:** Report via private channels
- **Vulnerability Disclosure:** Responsible disclosure policy
- **Security Updates:** Patch management process
- **Audit Requests:** Available for security audits

---

**This security documentation ensures HyperSnatch maintains a security-first posture while providing flexible validation capabilities.**
