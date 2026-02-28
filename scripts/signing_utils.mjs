/**
 * HyperSnatch Signing Utilities (Phase 2 Refinement)
 * Provides ECDSA-based signing using WebCrypto for build scripts.
 */

export async function generateSigningKeyPair(crypto) {
    return await crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        true,
        ["sign", "verify"]
    );
}

export async function exportPublicJwk(publicKey, crypto) {
    return await crypto.subtle.exportKey("jwk", publicKey);
}

export async function exportPrivateJwk(privateKey, crypto) {
    return await crypto.subtle.exportKey("jwk", privateKey);
}

export async function importPublicJwk(jwk, crypto) {
    return await crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        true,
        ["verify"]
    );
}

export async function importPrivateJwk(jwk, crypto) {
    return await crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        true,
        ["sign"]
    );
}

export async function signText(text, privateKey, crypto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const signature = await crypto.subtle.sign(
        {
            name: "ECDSA",
            hash: { name: "SHA-256" },
        },
        privateKey,
        data
    );
    return Buffer.from(signature).toString("hex");
}

export async function verifyText(text, signature, publicKey, crypto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
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
