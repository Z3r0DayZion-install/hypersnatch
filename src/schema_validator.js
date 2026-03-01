// ==================== SCHEMA VALIDATOR ====================
"use strict";

const SchemaType = {
  BUNDLE: 'hs-tear-bundle-1',
  DATA: 'tear-v2',
  UNKNOWN: 'unknown'
};

const SCHEMAS = {
  [SchemaType.BUNDLE]: {
    required: ["format", "schemaVersion", "app", "appVersion", "manifest", "digest"],
    types: {
      format: "string",
      schemaVersion: "number",
      app: "string",
      appVersion: "string",
      manifest: "object",
      digest: "string"
    }
  },
  [SchemaType.DATA]: {
    required: ["format", "schemaVersion", "app", "appVersion", "kind", "createdAt", "kdf", "iterations", "salt", "iv", "digest", "data"],
    types: {
      format: "string",
      schemaVersion: "number",
      app: "string",
      appVersion: "string",
      kind: "string",
      createdAt: "string",
      kdf: "string",
      iterations: "number",
      salt: "string",
      iv: "string",
      digest: "string",
      data: "string"
    }
  }
};

/**
 * Validates a pack against its schema and returns detailed errors
 */
function validateWithErrors(pack) {
  const errors = [];
  
  if (!pack || typeof pack !== 'object') {
    return { valid: false, errors: [{ field: 'root', message: 'Pack must be an object' }] };
  }
  
  const type = getSchemaType(pack);
  if (type === SchemaType.UNKNOWN) {
    return { valid: false, errors: [{ field: 'format', message: `Unknown or missing format: ${pack.format}` }] };
  }
  
  const schema = SCHEMAS[type];
  
  // Check required fields
  for (const field of schema.required) {
    if (pack[field] === undefined || pack[field] === null) {
      errors.push({ field, message: 'Field is required' });
    } else {
      // Check types
      const actualType = typeof pack[field];
      const expectedType = schema.types[field];
      if (actualType !== expectedType) {
        errors.push({ field, message: `Expected ${expectedType}, got ${actualType}` });
      }
    }
  }
  
  // Format specific checks
  if (type === SchemaType.BUNDLE && pack.format !== SchemaType.BUNDLE) {
    errors.push({ field: 'format', message: `Expected ${SchemaType.BUNDLE}, got ${pack.format}` });
  }
  if (type === SchemaType.DATA && pack.format !== SchemaType.DATA) {
    errors.push({ field: 'format', message: `Expected ${SchemaType.DATA}, got ${pack.format}` });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Detects the schema type of a pack
 */
function getSchemaType(pack) {
  if (!pack || !pack.format) return SchemaType.UNKNOWN;
  if (pack.format === SchemaType.BUNDLE) return SchemaType.BUNDLE;
  if (pack.format === SchemaType.DATA) return SchemaType.DATA;
  return SchemaType.UNKNOWN;
}

module.exports = {
  validateWithErrors,
  getSchemaType,
  SchemaType
};
