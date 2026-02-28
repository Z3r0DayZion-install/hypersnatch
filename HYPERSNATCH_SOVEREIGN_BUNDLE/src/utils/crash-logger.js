"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

function getLogDir() {
    const isPackaged = process.pkg || process.execPath.endsWith("hypersnatch.exe") || process.execPath.endsWith("ui-bridge.exe");
    const exeDir = isPackaged ? path.dirname(process.execPath) : process.cwd();

    const portablePath = path.join(exeDir, ".portable");
    if (fs.existsSync(portablePath)) {
        return exeDir;
    }

    try {
        const { app } = require("electron");
        if (app && typeof app.getPath === "function") {
            return path.join(app.getPath("userData"), "logs");
        }
    } catch (e) { }

    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    return path.join(localAppData, "HyperSnatch", "logs");
}

function redact(text) {
    if (!text) return text;
    if (process.env.VERBOSE_DEBUG === 'true' || process.env.VERBOSE_DEBUG === '1') return text;

    let scrubbed = String(text);
    // Redact querystrings entirely
    scrubbed = scrubbed.replace(/\?([^ \n'"\\]+)/g, '?[REDACTED]');

    // Hash sensitive specific fields
    scrubbed = scrubbed.replace(/(token|sig|signature|X-Amz-Signature)(["':=\s]+)([a-zA-Z0-9_\-\.]{16,})/gi,
        (match, key, sep, val) => {
            const crypto = require("crypto");
            const hash = crypto.createHash("sha256").update(val).digest("hex").slice(0, 8);
            return `${key}${sep}[HASH:${hash}]`;
        }
    );
    return scrubbed;
}

function initCrashHandler() {
    process.on("uncaughtException", (err) => {
        try {
            const logDir = getLogDir();
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            const logFile = path.join(logDir, "hypersnatch-crash.log");

            const entry = `[${new Date().toISOString()}] FATAL CRASH\n${redact(err.stack || err.message)}\n\n`;
            fs.appendFileSync(logFile, entry, "utf8");

            console.error(`\n❌ FATAL CRASH: A critical error occurred. Log saved to ${logFile}\n`);
        } catch (e) {
            console.error("\n❌ FATAL CRASH: Failed to write crash log:", err.message);
        }
        process.exit(1);
    });
}

module.exports = {
    initCrashHandler,
    getLogDir,
    redact
};
