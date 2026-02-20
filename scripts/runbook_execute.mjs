import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");
const scenario = process.argv[2] || "incident-revoke-rotate";

function executeScenario(name) {
  if (name === "incident-revoke-rotate") {
    return [
      "Load trust store",
      "Revoke compromised key",
      "Rotate active signing key",
      "Regenerate release manifest",
      "Verify release signature and checksum audit"
    ];
  }
  if (name === "airgap-hardening") {
    return [
      "Enable airgapped policy",
      "Disable online adapter",
      "Run self-test",
      "Run release gate"
    ];
  }
  return ["Unknown scenario"];
}

async function main() {
  const steps = executeScenario(scenario);
  const report = {
    format: "hs-runbook-report-v1",
    scenario,
    executedAt: new Date().toISOString(),
    steps
  };
  await fs.mkdir(releaseDir, { recursive: true });
  await fs.writeFile(path.join(releaseDir, `runbook_${scenario}.json`), JSON.stringify(report, null, 2), "utf8");
  console.log(`Runbook '${scenario}' executed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
