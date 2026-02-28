const fs = require("fs");
const path = require("path");
const { app } = require("electron");

function getLogPath() {
  const logDir = path.join(app.getPath("userData"), "logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return path.join(logDir, "runtime.log");
}

function write(level, message, meta = {}) {
  const { redact } = require("./crash-logger");

  let safeMeta = meta;
  if (meta && typeof meta === "object") {
    try {
      safeMeta = JSON.parse(redact(JSON.stringify(meta)));
    } catch (e) { }
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: String(message).includes("[object") ? message : redact(message),
    meta: safeMeta
  };

  fs.appendFile(getLogPath(), JSON.stringify(entry) + "\n", (err) => {
    if (err) console.error("Failed to write to runtime.log", err);
  });
}

module.exports = {
  info: (msg, meta) => write("INFO", msg, meta),
  warn: (msg, meta) => write("WARN", msg, meta),
  error: (msg, meta) => write("ERROR", msg, meta)
};
