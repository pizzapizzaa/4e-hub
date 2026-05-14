#!/usr/bin/env node
// Usage: node scripts/hash-password.js <plaintext-password>
// Outputs a scrypt hash in the format stored by the 4e-hub-cf worker (salt:hash)
// Use the output as the value for SUPER_ADMIN_PASSWORD_HASH

const { scryptSync, randomBytes } = require('crypto');

const plaintext = process.argv[2];
if (!plaintext) {
  console.error('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(plaintext, salt, 64).toString('hex');
console.log(`${salt}:${hash}`);
