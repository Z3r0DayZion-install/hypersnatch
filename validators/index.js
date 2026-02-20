// ==================== VALIDATOR SELECTION ====================
"use strict";

const validators = {
  mock: require('./mockValidator.js'),
  localServer: require('./localServerValidator.js'),
  allowlist: require('./allowlistHttpValidator.js') // Optional - requires explicit enable
};

function getValidator(mode = 'mock') {
  const validator = validators[mode];
  if (!validator) {
    throw new Error(`Unknown validator mode: ${mode}. Available modes: ${Object.keys(validators).join(', ')}`);
  }
  return validator;
}

module.exports = { getValidator };
