import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto as crypto } from "node:crypto";
import { auditReleaseArtifacts } from "../HyperSnatch_Modular_Source/src/release_audit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(__dirname, "..");
const releaseDir = path.join(workspace, "release");

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(releaseDir, "release_manifest.json"), "utf8"));
  const artifacts = [];
  for (const item of manifest.items || []) {
    artifacts.push({
      path: item.path,
      content: await fs.readFile(path.join(workspace, item.path), "utf8")
    });
  }
  const audit = await auditReleaseArtifacts(manifest, artifacts, crypto);
  if (!audit.ok) {
    console.error(JSON.stringify(audit, null, 2));
    process.exit(2);
  }
  console.log("Release artifact audit passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
