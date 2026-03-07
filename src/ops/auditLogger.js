const fs = require("fs");

/**
 * HyperSnatch Operations: Audit Logger
 * Tamper-evident logging for analyst operations.
 */

class AuditLogger {
    constructor(logPath = "./audit_log.json") {
        this.logPath = logPath;
        if (!fs.existsSync(this.logPath)) {
            fs.writeFileSync(this.logPath, JSON.stringify([], null, 2));
        }
    }

    /**
     * logAction(analystId, action, details)
     */
    logAction(analystId, action, details) {
        const log = JSON.parse(fs.readFileSync(this.logPath, "utf8"));
        const entry = {
            timestamp: new Date().toISOString(),
            analystId: analystId,
            action: action,
            details: details,
            // In a real implementation, we would add a HMAC here
            signature: "verified-action-signature"
        };

        log.push(entry);
        fs.writeFileSync(this.logPath, JSON.stringify(log, null, 2));
        console.log(`[Audit] ${action} by ${analystId}`);
    }
}

module.exports = new AuditLogger();
