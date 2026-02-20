# HyperSnatch Adapter SDK
## Data-Only Rulepack System

---

## 📋 OVERVIEW

The HyperSnatch Adapter SDK provides a **data-only rulepack system** for extending HyperSnatch's analysis capabilities without allowing executable code execution.

### **Key Principles**
- **Data-Only**: Rulepacks contain JSON rules only, no executable code
- **Network Isolation**: Rulepacks cannot make network requests
- **Transform/Score/Label**: Rules can transform, score, and label items only
- **Safe Execution**: All rule execution is sandboxed

---

## 📦 RULEPACK FORMAT

### **Schema**: `adapters/schema/rulepack.schema.json`

```json
{
  "format": "hs-rulepack-1",
  "schemaVersion": 1,
  "name": "Rulepack Name",
  "version": "1.0.0",
  "description": "Rulepack description",
  "author": "Author Name",
  "license": "License",
  "rules": [
    {
      "id": "unique-rule-id",
      "name": "Human Readable Rule Name",
      "description": "What this rule does",
      "enabled": true,
      "priority": 1,
      "conditions": {
        "itemType": ["url", "media", "text"],
        "confidence": { "min": 0.5, "max": 1.0 },
        "host": ["example.com", "test.com"]
      },
      "actions": {
        "transform": {
          "type": "regex",
          "pattern": "https://example.com/(.+)",
          "replacement": "https://archive.example.com/$1"
        },
        "score": {
          "adjustment": 0.1,
          "reason": "Known archive source"
        },
        "label": {
          "add": ["archive", "mirror"],
          "remove": []
        }
      }
    }
  ]
}
```

---

## 🔧 RULE EXECUTION

### **Conditions**
Rules can filter based on:
- **itemType**: Array of item types to match
- **confidence**: Min/max confidence range
- **host**: Array of host patterns
- **contentPattern**: Regex pattern for content matching
- **metadata**: Key-value metadata conditions

### **Actions**
When conditions match, rules can:
- **transform**: Modify item content using regex or function
- **score**: Adjust confidence score (+/-)
- **label**: Add or remove labels
- **flag**: Mark item with warning/error flags

---

## 🛡️ SECURITY RESTRICTIONS

### **Forbidden Operations**
- ❌ **No Network Access**: Rulepacks cannot make HTTP/HTTPS requests
- ❌ **No File System Access**: Cannot read/write files outside sandbox
- ❌ **No Code Execution**: No eval(), Function(), or dynamic imports
- ❌ **No Process Execution**: Cannot spawn child processes

### **Allowed Operations**
- ✅ **Data Transformation**: Regex replacement, string manipulation
- ✅ **Scoring**: Numerical confidence adjustments
- ✅ **Labeling**: Adding/removing metadata labels
- ✅ **Filtering**: Including/excluding items based on conditions

---

## 📚 EXAMPLES

### **Example 1: URL Transformation**
```json
{
  "id": "archive-redirect",
  "name": "Archive Redirect",
  "description": "Redirect known archive URLs to preserved copies",
  "rules": [
    {
      "conditions": {
        "itemType": ["url"],
        "host": ["dead-site.com", "offline-site.com"]
      },
      "actions": {
        "transform": {
          "type": "regex",
          "pattern": "https://dead-site.com/(.+)",
          "replacement": "https://archive.example.com/$1"
        },
        "label": {
          "add": ["redirected", "archived"],
          "remove": []
        }
      }
    }
  ]
}
```

### **Example 2: Confidence Boosting**
```json
{
  "id": "trusted-source",
  "name": "Trusted Source Boost",
  "description": "Boost confidence for known trusted sources",
  "rules": [
    {
      "conditions": {
        "itemType": ["url", "media"],
        "host": ["trusted-site.com"]
      },
      "actions": {
        "score": {
          "adjustment": 0.2,
          "reason": "Trusted source"
        },
        "label": {
          "add": ["trusted"],
          "remove": []
        }
      }
    }
  ]
}
```

---

## 🔧 INTEGRATION

### **Loading Rulepacks**
```javascript
// Load rulepack from file
const rulepack = await AdapterSDK.loadRulepack('path/to/rulepack.json');

// Apply to queue items
const results = AdapterSDK.applyRules(queueItems, rulepack);

// Get transformation results
console.log(results.transformed);
console.log(results.scored);
console.log(results.labeled);
```

### **Rulepack Validation**
All rulepacks are validated against:
- Schema compliance
- Security restrictions
- Performance limits
- Malicious pattern detection

---

## 📋 BEST PRACTICES

1. **Specific Conditions**: Use precise conditions to avoid false positives
2. **Clear Descriptions**: Document what each rule does
3. **Version Control**: Use semantic versioning for rulepack updates
4. **Testing**: Test rulepacks with various input scenarios
5. **Performance**: Keep rules simple and efficient
6. **Security**: Never include executable code or network access

---

## 🚨 SECURITY CONSIDERATIONS

- **Sandboxed Execution**: All rules run in isolated environment
- **Resource Limits**: Memory and CPU limits enforced
- **Audit Trail**: All rule applications are logged
- **Malware Detection**: Rulepacks scanned for suspicious patterns
- **User Consent**: Users must explicitly load rulepacks

---

**This SDK provides a secure, extensible system for customizing HyperSnatch's analysis capabilities while maintaining strict security boundaries.**
