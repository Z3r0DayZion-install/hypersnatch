"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const auditScript = path.join(__dirname, "..", "tests", "final_sovereign_audit.js");
const env = {
  ...process.env,
  HYPERSNATCH_AUDIT_PROFILE: "strict",
  HYPERSNATCH_AUDIT_RELEASE_TYPE: "stable",
  HYPERSNATCH_AUDIT_REQUIRE_HASH: "1",
  HYPERSNATCH_AUDIT_REQUIRE_CLI: "1"
};

const result = spawnSync(process.execPath, [auditScript], {
  stdio: "inherit",
  env
});

if (typeof result.status !== "number") {
  process.exit(1);
}

process.exit(result.status);
