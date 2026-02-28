import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto as crypto } from "node:crypto";
import { generateSigningKeyPair, exportPublicJwk, signText } from "./signing_utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");

function run(cmd, cwd = root) {
  const out = execSync(cmd, { cwd, stdio: "pipe", encoding: "utf8" });
  return out.trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeFileSafe(targetPath, text, retries = 5) {
  const tmp = `${targetPath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let lastErr = null;
  for (let i = 0; i < retries; i += 1) {
    try {
      await fs.writeFile(tmp, text, "utf8");
      await fs.rename(tmp, targetPath);
      return;
    } catch (err) {
      lastErr = err;
      try { await fs.unlink(tmp); } catch { }
      if (!(err && (err.code === "EPERM" || err.code === "EBUSY" || err.code === "EACCES"))) {
        throw err;
      }
      await sleep(120 * (i + 1));
    }
  }
  throw lastErr || new Error(`Unable to write ${targetPath}`);
}

async function main() {
  const steps = [];
  const startedAt = new Date().toISOString();

  steps.push({ step: "unit-tests", output: run("npm test", root) });
  steps.push({ step: "e2e-tests", output: run("npx playwright test --config playwright.config.js fused.spec.js", path.join(root, "e2e")) });
  steps.push({ step: "release-generate", output: run("node scripts/release_manifest_generate.mjs", root) });
  steps.push({ step: "release-verify", output: run("node scripts/release_manifest_verify.mjs", root) });
  steps.push({ step: "release-audit", output: run("node scripts/release_manifest_audit.mjs", root) });

  const report = {
    format: "hs-release-gate-report-v1",
    startedAt,
    finishedAt: new Date().toISOString(),
    ok: true,
    steps
  };
  const reportText = JSON.stringify(report, null, 2);
  const pair = await generateSigningKeyPair(crypto);
  const signature = await signText(reportText, pair.privateKey, crypto);
  const publicJwk = await exportPublicJwk(pair.publicKey, crypto);
  await fs.mkdir(releaseDir, { recursive: true });
  await writeFileSafe(path.join(releaseDir, "release_gate_report.json"), reportText);
  await writeFileSafe(path.join(releaseDir, "release_gate_report.sig.txt"), signature);
  await writeFileSafe(path.join(releaseDir, "release_gate_report.public.jwk.json"), JSON.stringify(publicJwk, null, 2));
  console.log("Release gate passed and signed report emitted");
}

main().catch(async (err) => {
  const fail = {
    format: "hs-release-gate-report-v1",
    finishedAt: new Date().toISOString(),
    ok: false,
    error: err.message || String(err)
  };
  await fs.mkdir(releaseDir, { recursive: true });
  await writeFileSafe(path.join(releaseDir, "release_gate_report.json"), JSON.stringify(fail, null, 2));
  console.error(err.message || String(err));
  process.exit(1);
});
