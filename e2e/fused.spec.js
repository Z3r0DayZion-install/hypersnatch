const { test, expect } = require("@playwright/test");
const path = require("path");

const pageUrl = "file:///" + path.resolve(__dirname, "..", "HyperSnatch_Final_Fused.html").replace(/\\/g, "/");

async function openFresh(page) {
  await page.goto(pageUrl + "?skipHandshake=1");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

test("decode queue flow renders decoded output", async ({ page }) => {
  await openFresh(page);
  await page.fill("#inbox", "https://emload.com/file/abc123");
  await page.click("#decodeBtn");
  await expect(page.locator("#decodedTable")).toContainText("https://cdn.emload.com/stream/abc123.mp4");
});

test("trust policy toggles persist in UI state", async ({ page }) => {
  await openFresh(page);
  const requireSig = page.locator("#policyRequireSigToggle");
  const tofu = page.locator("#policyTofuToggle");
  await requireSig.uncheck();
  await tofu.uncheck();
  await expect(requireSig).not.toBeChecked();
  await expect(tofu).not.toBeChecked();
});

test("self-test report is produced", async ({ page }) => {
  await openFresh(page);
  await page.click("#selfTestBtn");
  await expect(page.locator("#selfTestTable")).toContainText("PASS");
});

test("basic tier blocks kshared and advanced tier unlock enables it", async ({ page }) => {
  await openFresh(page);
  await page.fill("#inbox", "https://kshared.com/file/abc");
  await page.click("#decodeBtn");
  await expect(page.locator("#deferredTable")).toContainText("Tier gate");

  await page.fill("#tierKey", "hyperfounder");
  await page.click("#unlockBtn");
  await expect(page.locator("#tierView")).toContainText("advanced");

  await page.fill("#inbox", "https://kshared.com/file/abc");
  await page.click("#decodeBtn");
  await expect(page.locator("#decodedTable")).toContainText("https://dl.kshared.com/content/abc");
});

test("export and import guardrails surface expected errors", async ({ page }) => {
  await openFresh(page);
  await page.click("#exportTearBtn");
  await expect(page.locator("#logBox")).toContainText("Passphrase required");

  await page.fill("#passphrase", "pw");
  await page.click("#importBtn");
  await expect(page.locator("#logBox")).toContainText("No import file selected");
});

test("unsigned encrypted import is rejected when policy requires signatures", async ({ page }) => {
  await openFresh(page);
  await page.fill("#passphrase", "pw");
  const unsignedPack = {
    format: "tear-v2",
    schemaVersion: 2,
    app: "HyperSnatch",
    kind: "tear",
    createdAt: new Date().toISOString(),
    kdf: "PBKDF2-SHA256",
    iterations: 120000,
    salt: "AA==",
    iv: "AA==",
    digest: "AA==",
    data: "AA=="
  };
  await page.setInputFiles("#importFile", {
    name: "unsigned.tear",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(unsignedPack))
  });
  await page.click("#importBtn");
  await expect(page.locator("#logBox")).toContainText("Unsigned imports are blocked by policy");
});

test("trust rotate and revoke require key ids", async ({ page }) => {
  await openFresh(page);
  await page.click("#trustRotateBtn");
  await page.click("#trustRevokeBtn");
  await expect(page.locator("#logBox")).toContainText("Rotate failed: KeyId required");
  await expect(page.locator("#logBox")).toContainText("Revoke failed: KeyId required");
});

test("export/import signed tear roundtrip", async ({ page }) => {
  await openFresh(page);
  await page.fill("#inbox", "https://emload.com/file/roundtrip");
  await page.click("#decodeBtn");
  await expect(page.locator("#decodedTable")).toContainText("https://cdn.emload.com/stream/roundtrip.mp4");
  await page.fill("#passphrase", "roundtrip-pass");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click("#exportTearBtn")
  ]);
  const dlPath = await download.path();
  await page.setInputFiles("#importFile", dlPath);
  await page.click("#importBtn");
  await expect(page.locator("#logBox")).toContainText("Imported tear payload");
});

test("telemetry panels and trust rotation respond to activity", async ({ page }) => {
  await openFresh(page);
  await page.fill("#inbox", "https://emload.com/file/telemetry");
  await page.click("#decodeBtn");
  await page.fill("#passphrase", "telemetry-pass");
  await Promise.all([
    page.waitForEvent("download"),
    page.click("#exportTearBtn")
  ]);
  await page.waitForSelector("#trustTable td", { timeout: 20000 });
  const rawKeyId = await page.locator("#trustTable td").first().textContent();
  const keyId = rawKeyId?.trim() || "";
  expect(keyId).not.toBe("");
  await page.fill("#trustRotateKeyId", keyId);
  page.on("dialog", dialog => dialog.accept());
  await page.click("#trustRotateBtn");
  await expect(page.locator("#logBox")).toContainText("Rotated active key");
  await expect(page.locator("#replayPanel")).toContainText("decoded");
  await expect(page.locator("#circuitPanel")).toContainText("success");
  await expect(page.locator("#ledgerPanel")).toContainText("Audit Ledger");
});
