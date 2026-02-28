import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto as crypto } from "node:crypto";
import {
  buildReleaseManifest,
  signReleaseManifest
} from "./release_utils.mjs";
import {
  importPrivateJwk,
  importPublicJwk,
  exportPrivateJwk,
  exportPublicJwk,
  generateSigningKeyPair
} from "./signing_utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "release");
const exportPrivate = String(process.env.HS_EXPORT_PRIVATE_KEY || "").toLowerCase() === "true";
const privateOutPath = process.env.HS_RELEASE_PRIVATE_KEY_OUT || path.join(outDir, "release_private_key.jwk.json");
const privateInPath = process.env.HS_RELEASE_PRIVATE_JWK_PATH || "";
const publicInPath = process.env.HS_RELEASE_PUBLIC_JWK_PATH || "";
const artifactPaths = [
  path.join(root, "HyperSnatch_Final_Fused.html"),
  path.join(root, "HyperSnatch_v1.0.1_source_only.zip"),
  path.join(root, "HyperSnatch_Architecture_Documentation.txt"),
  path.join(root, "HyperSnatch_Phase_Completion_Report.txt")
];

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const artifacts = [];
  for (const fullPath of artifactPaths) {
    const content = await fs.readFile(fullPath, "utf8");
    artifacts.push({ path: path.basename(fullPath), content });
  }

  const manifest = await buildReleaseManifest(artifacts, crypto);

  let privateKey;
  let publicKey;
  if (privateInPath && publicInPath) {
    const privateJwk = JSON.parse(await fs.readFile(privateInPath, "utf8"));
    const publicJwk = JSON.parse(await fs.readFile(publicInPath, "utf8"));
    privateKey = await importPrivateJwk(privateJwk, crypto);
    publicKey = await importPublicJwk(publicJwk, crypto);
  } else {
    const pair = await generateSigningKeyPair(crypto);
    privateKey = pair.privateKey;
    publicKey = pair.publicKey;
  }

  const signed = await signReleaseManifest(manifest, privateKey, "release-local", crypto);
  const publicJwk = await exportPublicJwk(publicKey, crypto);

  await fs.writeFile(path.join(outDir, "release_manifest.json"), JSON.stringify(signed, null, 2), "utf8");
  await fs.writeFile(path.join(outDir, "release_public_key.jwk.json"), JSON.stringify(publicJwk, null, 2), "utf8");
  if (exportPrivate) {
    const privateJwk = await exportPrivateJwk(privateKey, crypto);
    await fs.writeFile(privateOutPath, JSON.stringify(privateJwk, null, 2), "utf8");
    console.log("Generated release manifest and keys in", outDir, "(private key exported)");
  } else {
    try { await fs.unlink(privateOutPath); } catch { }
    console.log("Generated release manifest and public key in", outDir, "(private key NOT exported)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
