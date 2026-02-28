"use strict";

const crypto = require("crypto");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");
const buildDir = path.join(root, "build");

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function findSigntool() {
  if (process.env.SIGNTOOL_PATH && exists(process.env.SIGNTOOL_PATH)) return process.env.SIGNTOOL_PATH;

  const where = spawnSync("where", ["signtool"], { encoding: "utf8", shell: true });
  if (where.status === 0) {
    const first = String(where.stdout || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)[0];
    if (first && exists(first)) return first;
  }

  const kitsRoot = "C:/Program Files (x86)/Windows Kits/10/bin";
  if (exists(kitsRoot)) {
    const entries = fs.readdirSync(kitsRoot).filter((n) => /^\d+\.\d+\.\d+\.\d+$/.test(n));
    entries.sort((a, b) => (a < b ? 1 : -1));
    for (const ver of entries) {
      const cand = path.join(kitsRoot, ver, "x64", "signtool.exe");
      if (exists(cand)) return cand;
    }
  }

  return null;
}

function runOrThrow(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: false });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${path.basename(cmd)} failed (exit ${r.status})`);
}

function parseArgs(argv) {
  const out = { pre: false, post: false };
  for (const a of argv) {
    if (a === "--pre") out.pre = true;
    if (a === "--post") out.post = true;
  }
  if (!out.pre && !out.post) {
    out.pre = true;
    out.post = true;
  }
  return out;
}

function version() {
  try {
    // eslint-disable-next-line global-require
    const v = require(path.join(root, "VERSION.json"));
    return v?.version || "unknown";
  } catch {
    return "unknown";
  }
}

function listElectronInstallerCandidates() {
  if (!exists(distDir)) return [];
  return fs
    .readdirSync(distDir)
    .filter((n) => /^HyperSnatch-Setup-.*\.exe$/i.test(n))
    .map((n) => path.join(distDir, n))
    .filter((p) => exists(p));
}

function listArtifacts(phases) {
  const out = new Set();

  if (phases.pre) {
    // Must be signed BEFORE electron-builder runs so the installer ships the signed binary.
    out.add(path.join(buildDir, "hs-core.exe"));
  }

  if (phases.post) {
    // Optional standalone CLI binary.
    out.add(path.join(distDir, "hypersnatch.exe"));

    if (process.env.HYPERSNATCH_SIGN_ELECTRON === "1") {
      // WARNING: signing the installer AFTER electron-builder may invalidate differential update data.
      for (const inst of listElectronInstallerCandidates()) out.add(inst);
      out.add(path.join(distDir, "win-unpacked", "HyperSnatch.exe"));
      out.add(path.join(distDir, "win-unpacked", "resources", "hs-core.exe"));
    }
  }

  return Array.from(out).filter((p) => exists(p));
}

function signingIdentityArgs() {
  const thumb = (process.env.HYPERSNATCH_SIGN_THUMBPRINT || process.env.HYPERSNATCH_SIGN_SHA1 || "").trim();
  const subject = (process.env.HYPERSNATCH_SIGN_SUBJECT || "").trim();

  if (thumb) {
    const args = ["/sha1", thumb, "/s", "My"];
    if (process.env.HYPERSNATCH_SIGN_MACHINE_STORE === "1") args.push("/sm");
    return { mode: "store", args };
  }

  if (subject) {
    const args = ["/n", subject, "/s", "My"];
    if (process.env.HYPERSNATCH_SIGN_MACHINE_STORE === "1") args.push("/sm");
    return { mode: "store", args };
  }

  const pfxPath = process.env.HYPERSNATCH_SIGN_PFX || process.env.SIGN_PFX;
  const pfxPass =
    process.env.HYPERSNATCH_SIGN_PFX_PASSWORD ||
    process.env.HYPERSNATCH_SIGN_PFX_PASS ||
    process.env.SIGN_PFX_PASSWORD;

  if (!pfxPath) throw new Error("Missing signing identity (set HYPERSNATCH_SIGN_THUMBPRINT or HYPERSNATCH_SIGN_PFX)");
  if (!exists(pfxPath)) throw new Error(`Signing cert not found: ${pfxPath}`);
  if (!pfxPass) throw new Error("Missing signing cert password (set HYPERSNATCH_SIGN_PFX_PASSWORD)");

  return { mode: "pfx", args: ["/f", pfxPath, "/p", pfxPass] };
}

function sha512Base64File(filePath) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha512");
    const s = fs.createReadStream(filePath);
    s.on("data", (chunk) => h.update(chunk));
    s.on("error", reject);
    s.on("end", () => resolve(h.digest("base64")));
  });
}

async function updateLatestYmlForInstaller(installerPath) {
  const ymlPath = path.join(distDir, "latest.yml");
  if (!exists(ymlPath) || !exists(installerPath)) return;

  const st = fs.statSync(installerPath);
  const sha512 = await sha512Base64File(installerPath);

  let yml = fs.readFileSync(ymlPath, "utf8");

  // Update ALL sha512 entries in latest.yml to the current installer value.
  yml = yml.replace(/sha512:\s*[A-Za-z0-9+/=]+/g, `sha512: ${sha512}`);
  // Update ALL size entries.
  yml = yml.replace(/size:\s*\d+/g, `size: ${st.size}`);
  // Refresh releaseDate (non-deterministic by nature for updater feeds).
  yml = yml.replace(/releaseDate:\s*'[^']*'/g, `releaseDate: '${new Date().toISOString()}'`);

  fs.writeFileSync(ymlPath, yml, "utf8");
}

async function main() {
  if (process.platform !== "win32") {
    console.log("ℹ️ sign_windows: skipped (non-Windows)");
    return;
  }

  if (process.env.HYPERSNATCH_SIGN !== "1") {
    console.log("ℹ️ sign_windows: skipped (set HYPERSNATCH_SIGN=1)");
    return;
  }

  const phases = parseArgs(process.argv.slice(2));

  const signtool = findSigntool();
  if (!signtool) {
    throw new Error("signtool.exe not found (install Windows SDK or set SIGNTOOL_PATH)");
  }

  const id = signingIdentityArgs();

  const timestampUrl = process.env.HYPERSNATCH_SIGN_TIMESTAMP_URL || "";
  const withTimestamp = timestampUrl && timestampUrl !== "0";

  const artifacts = listArtifacts(phases);
  if (artifacts.length === 0) {
    console.warn("⚠️ No artifacts found to sign for requested phase(s).");
    console.warn("- pre expects: build/hs-core.exe (run `npm run hs-core:prepare`) ");
    console.warn("- post expects: dist/hypersnatch.exe (run `npm run build:exe`) ");
    return;
  }

  console.log(`🔏 Signing ${artifacts.length} artifact(s) with ${path.basename(signtool)} (${id.mode})…`);

  for (const filePath of artifacts) {
    const args = ["sign", "/fd", "SHA256", ...id.args, "/v"];
    if (withTimestamp) {
      args.push("/tr", timestampUrl, "/td", "SHA256");
    }
    args.push(filePath);

    console.log(`\n▶️ signtool ${args.map((a) => (a.includes(" ") ? `\"${a}\"` : a)).join(" ")}`);
    runOrThrow(signtool, args);
  }

  // If we post-signed the installer, update latest.yml so its sha512 matches.
  if (phases.post && process.env.HYPERSNATCH_SIGN_ELECTRON === "1") {
    const inst = listElectronInstallerCandidates()
      .filter((p) => p.endsWith(`HyperSnatch-Setup-${version()}.exe`))
      .concat(listElectronInstallerCandidates())[0];

    if (inst && exists(inst)) {
      await updateLatestYmlForInstaller(inst);
      console.log("✅ Updated dist/latest.yml sha512/size for signed installer.");
    }
  }

  console.log("✅ Signing complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
