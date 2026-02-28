"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function binName() {
  return process.platform === "win32" ? "hs-core.exe" : "hs-core";
}

function resolveHsCorePath() {
  const candidates = [];

  if (process.env.HS_CORE_PATH) candidates.push(String(process.env.HS_CORE_PATH));

  // Packaged Electron apps expose `process.resourcesPath`.
  if (process.resourcesPath) candidates.push(path.join(process.resourcesPath, binName()));

  // Dev fallbacks
  const repoRoot = path.join(__dirname, "..", "..", "..");
  candidates.push(path.join(repoRoot, "build", binName()));
  candidates.push(path.join(repoRoot, "rust", "hs-core", "target", "release", binName()));
  candidates.push(path.join(repoRoot, "rust", "hs-core", "target", "debug", binName()));

  for (const p of candidates) {
    try {
      if (!p) continue;
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    } catch {
      // ignore
    }
  }

  return null;
}

function canRun() {
  return Boolean(resolveHsCorePath());
}

function smartdecode(input, options = {}) {
  const binPath = resolveHsCorePath();
  if (!binPath) {
    const err = new Error("hs-core binary not found");
    err.code = "HS_CORE_NOT_FOUND";
    throw err;
  }

  const timeoutMs = Number(options.timeoutMs ?? process.env.HS_CORE_TIMEOUT_MS ?? 2500);
  const maxInputBytes = Number(options.maxInputBytes ?? process.env.HS_CORE_MAX_INPUT_BYTES ?? 2_000_000);
  const maxStdoutBytes = Number(options.maxStdoutBytes ?? process.env.HS_CORE_MAX_STDOUT_BYTES ?? 4_000_000);

  const payload = String(input ?? "");
  const inputBytes = Buffer.byteLength(payload, "utf8");
  if (inputBytes > maxInputBytes) {
    const err = new Error(`hs-core input too large (${inputBytes} bytes > ${maxInputBytes})`);
    err.code = "HS_CORE_INPUT_TOO_LARGE";
    throw err;
  }

  const req = JSON.stringify({ input: payload, splitSegments: Boolean(options.splitSegments) });

  return new Promise((resolve, reject) => {
    const child = spawn(binPath, ["smartdecode", "--json"], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);

    const killTimer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // ignore
      }
      const err = new Error(`hs-core timeout after ${timeoutMs}ms`);
      err.code = "HS_CORE_TIMEOUT";
      reject(err);
    }, timeoutMs);

    const finish = (err, value) => {
      clearTimeout(killTimer);
      if (err) reject(err);
      else resolve(value);
    };

    child.on("error", (e) => {
      const err = new Error(`hs-core spawn failed: ${e.message}`);
      err.cause = e;
      err.code = "HS_CORE_SPAWN_FAILED";
      finish(err);
    });

    child.stdout.on("data", (chunk) => {
      stdout = Buffer.concat([stdout, chunk]);
      if (stdout.length > maxStdoutBytes) {
        try {
          child.kill();
        } catch {
          // ignore
        }
        const err = new Error(`hs-core stdout too large (${stdout.length} bytes)`);
        err.code = "HS_CORE_STDOUT_TOO_LARGE";
        finish(err);
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr = Buffer.concat([stderr, chunk]);
      if (stderr.length > 1_000_000) {
        // Prevent unbounded stderr growth.
        stderr = stderr.slice(0, 1_000_000);
      }
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const err = new Error(`hs-core exited with code ${code}: ${stderr.toString("utf8")}`.trim());
        err.code = "HS_CORE_NONZERO_EXIT";
        return finish(err);
      }

      let parsed;
      try {
        parsed = JSON.parse(stdout.toString("utf8"));
      } catch (e) {
        const err = new Error(`hs-core returned invalid JSON: ${e.message}`);
        err.code = "HS_CORE_BAD_JSON";
        err.stderr = stderr.toString("utf8");
        err.stdout = stdout.toString("utf8");
        return finish(err);
      }

      return finish(null, parsed);
    });

    try {
      child.stdin.end(req, "utf8");
    } catch (e) {
      const err = new Error(`hs-core stdin write failed: ${e.message}`);
      err.code = "HS_CORE_STDIN_FAILED";
      finish(err);
    }
  });
}

module.exports = {
  binName,
  resolveHsCorePath,
  canRun,
  smartdecode,
};
