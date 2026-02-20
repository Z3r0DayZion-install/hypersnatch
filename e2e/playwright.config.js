/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: ".",
  timeout: 60_000,
  use: {
    headless: true
  }
};

module.exports = config;
