import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto as crypto } from "node:crypto";
import { importPublicJwk } from "./signing_utils.mjs";
import { verifyReleaseManifest, auditReleaseArtifacts } from "./release_utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(__dirname, "..");
const root = path.join(workspace, "release");

async function main() {
  const manifestPath = path.join(root, "release_manifest.json");
  const publicKeyPath = path.join(root, "release_public_key.jwk.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const pubJwk = JSON.parse(await fs.readFile(publicKeyPath, "utf8"));
  const pub = await importPublicJwk(pubJwk, crypto);
  const ok = await verifyReleaseManifest(manifest, pub, crypto);
  if (!ok) {
    console.error("Manifest signature verification failed");
    process.exit(2);
  }
  const artifacts = [];
  for (const item of manifest.items || []) {
    const full = path.join(workspace, item.path);
    const content = await fs.readFile(full, "utf8");
    artifacts.push({ path: item.path, content });
  }
  const audit = await auditReleaseArtifacts(manifest, artifacts, crypto);
  if (!audit.ok) {
    console.error("Artifact audit failed", JSON.stringify(audit, null, 2));
    process.exit(3);
  }
  console.log("Manifest signature verification passed");
  console.log("Artifact checksum audit passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
