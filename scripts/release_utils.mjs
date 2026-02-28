/**
 * HyperSnatch Release Utilities (Phase 2 Refinement)
 */

export async function buildReleaseManifest(artifacts, crypto) {
    const items = [];
    for (const art of artifacts) {
        const encoder = new TextEncoder();
        const data = encoder.encode(art.content);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hash = Buffer.from(hashBuffer).toString("hex");
        items.push({
            path: art.path,
            hash
        });
    }

    return {
        format: "hs-release-manifest-v1",
        timestamp: new Date().toISOString(),
        items
    };
}

export async function signReleaseManifest(manifest, privateKey, signerId, crypto) {
    const signedManifest = { ...manifest, signerId };
    const canonical = JSON.stringify(signedManifest);
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);

    const signatureBuffer = await crypto.subtle.sign(
        {
            name: "ECDSA",
            hash: { name: "SHA-256" },
        },
        privateKey,
        data
    );

    signedManifest.signature = Buffer.from(signatureBuffer).toString("hex");
    return signedManifest;
}

export async function verifyReleaseManifest(manifest, publicKey, crypto) {
    const { signature, ...rest } = manifest;
    if (!signature) return false;

    const canonical = JSON.stringify(rest);
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);
    const sigBuffer = Buffer.from(signature, "hex");

    return await crypto.subtle.verify(
        {
            name: "ECDSA",
            hash: { name: "SHA-256" },
        },
        publicKey,
        sigBuffer,
        data
    );
}

export async function auditReleaseArtifacts(manifest, artifacts, crypto) {
    const problems = [];
    const manifestItems = manifest.items || [];

    for (const art of artifacts) {
        const item = manifestItems.find(i => i.path === art.path);
        if (!item) {
            problems.push(`Artifact ${art.path} not found in manifest`);
            continue;
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(art.content);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const actualHash = Buffer.from(hashBuffer).toString("hex");

        if (actualHash !== item.hash) {
            problems.push(`Hash mismatch for ${art.path}: expected ${item.hash}, got ${actualHash}`);
        }
    }

    // Also check if any manifest items are missing from the provided artifacts
    for (const item of manifestItems) {
        if (!artifacts.find(a => a.path === item.path)) {
            problems.push(`Manifest item ${item.path} missing from artifacts`);
        }
    }

    return {
        ok: problems.length === 0,
        problems
    };
}
