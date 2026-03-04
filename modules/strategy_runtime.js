"use strict";

const fs = require("fs");
const path = require("path");

const STRATEGIES_DIR = path.join(__dirname, "strategies");

function listStrategies() {
  if (!fs.existsSync(STRATEGIES_DIR)) {
    return [];
  }
  return fs.readdirSync(STRATEGIES_DIR)
    .filter((file) => file.endsWith(".js"))
    .sort();
}

function getStrategyPath(strategyName) {
  const safeName = path.basename(String(strategyName || ""));
  if (!safeName || safeName === "." || safeName === "..") {
    throw new Error("Invalid strategy name");
  }
  const strategyPath = path.join(STRATEGIES_DIR, safeName);
  if (!strategyPath.startsWith(STRATEGIES_DIR)) {
    throw new Error("Path traversal blocked");
  }
  if (!fs.existsSync(strategyPath)) {
    throw new Error(`Strategy not found: ${safeName}`);
  }
  return strategyPath;
}

function loadStrategy(strategyName) {
  const strategyPath = getStrategyPath(strategyName);
  const loaded = require(strategyPath);
  if (!loaded || typeof loaded !== "object") {
    throw new Error(`Invalid strategy module: ${strategyName}`);
  }
  return loaded;
}

module.exports = {
  listStrategies,
  loadStrategy
};
