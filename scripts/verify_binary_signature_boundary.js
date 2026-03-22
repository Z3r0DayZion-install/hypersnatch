"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function readPackageVersion(projectRoot) {
  const packagePath = path.join(projectRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return pkg.version;
}

function getAuthenticodeSignature(filePath) {
  const normalizedPath = path.resolve(filePath).replace(/'/g, "''");
  const command = [
    `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;`,
    `$sig = Get-AuthenticodeSignature -FilePath '${normalizedPath}';`,
    `[PSCustomObject]@{`,
    `  Status = [string]$sig.Status;`,
    `  StatusMessage = [string]$sig.StatusMessage;`,
    `  SignerSubject = if ($sig.SignerCertificate) { [string]$sig.SignerCertificate.Subject } else { '' }`,
    `} | ConvertTo-Json -Compress`
  ].join(" ");

  const result = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", command], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    throw new Error(`Authenticode probe failed for ${filePath}: ${stderr || stdout || "unknown powershell error"}`);
  }

  const raw = (result.stdout || "").trim();
  if (!raw) {
    throw new Error(`Authenticode probe returned empty output for ${filePath}`);
  }
  const parsed = JSON.parse(raw);
  return {
    status: parsed.Status || "Unknown",
    statusMessage: parsed.StatusMessage || "",
    signerSubject: parsed.SignerSubject || ""
  };
}

function verifyBinarySignatureBoundary(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const expectedVersion = options.expectedVersion || readPackageVersion(projectRoot);
  const installerPath = path.join(projectRoot, "dist", `HyperSnatch-Setup-${expectedVersion}.exe`);
  const unpackedPath = path.join(projectRoot, "dist", "win-unpacked", "HyperSnatch.exe");

  if (!fs.existsSync(installerPath)) {
    throw new Error(`Signature boundary probe missing installer artifact: ${installerPath}`);
  }
  if (!fs.existsSync(unpackedPath)) {
    throw new Error(`Signature boundary probe missing unpacked app artifact: ${unpackedPath}`);
  }

  if (process.platform !== "win32") {
    return {
      skipped: true,
      reason: "non-windows host",
      installerPath,
      unpackedPath
    };
  }

  const installerSignature = getAuthenticodeSignature(installerPath);
  const unpackedSignature = getAuthenticodeSignature(unpackedPath);
  const statuses = [installerSignature.status, unpackedSignature.status];
  const normalizedStatuses = statuses.map((status) => String(status || "").toLowerCase());
  const hasSigner = Boolean(installerSignature.signerSubject || unpackedSignature.signerSubject);

  let boundaryClass = "mixed";
  if (statuses.every((status) => status === "Valid")) {
    boundaryClass = "signed";
  } else if (normalizedStatuses.every((status) => status === "notsigned" || status === "unknown") && !hasSigner) {
    boundaryClass = "unsigned-bounded";
  } else if (normalizedStatuses.includes("notsigned") || normalizedStatuses.includes("unknown")) {
    boundaryClass = "partially-signed";
  }

  return {
    skipped: false,
    expectedVersion,
    boundaryClass,
    installerPath,
    unpackedPath,
    installerSignature,
    unpackedSignature
  };
}

if (require.main === module) {
  try {
    const result = verifyBinarySignatureBoundary();
    console.log("[binary-signature-boundary] PASS");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`[binary-signature-boundary] FAIL: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  verifyBinarySignatureBoundary
};
