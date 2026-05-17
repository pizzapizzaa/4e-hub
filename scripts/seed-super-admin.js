#!/usr/bin/env node
// Seed the system super admin user into Turso.
// Run once after creating the database:
//   node scripts/seed-super-admin.js
//
// Reads from .env — requires: TURSO_URL, TURSO_AUTH_TOKEN, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD_HASH
// Install dep: npm install @libsql/client dotenv

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@libsql/client');

const required = ['TURSO_URL', 'TURSO_AUTH_TOKEN', 'SUPER_ADMIN_EMAIL', 'SUPER_ADMIN_PASSWORD_HASH'];
for (const key of required) {
  if (!process.env[key]) { console.error(`Missing env var: ${key}`); process.exit(1); }
}

const db = createClient({
  url:       process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seed() {
  const id        = 'system-super-admin';
  const email     = process.env.SUPER_ADMIN_EMAIL;
  const hash      = process.env.SUPER_ADMIN_PASSWORD_HASH;
  const now       = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO users
        (id, email, password_hash, role, school_id, district_id, tenant_id,
         first_name, last_name, is_active, created_at)
      VALUES (?, ?, ?, 'super_admin', 'system', 'system', 'system',
        '4E', 'Admin', 1, ?)
      ON CONFLICT(email) DO UPDATE SET
        email         = excluded.email,
        password_hash = excluded.password_hash,
        role          = excluded.role,
        is_active     = 1`,
      args: [id, email, hash, now],
    });

  // Also attempt to update any existing user record with the same email
  // (handles cases where a different id already exists for that email).
  try {
    await db.execute({
      sql: `UPDATE users SET role = 'super_admin', password_hash = ?, is_active = 1 WHERE email = ?`,
      args: [hash, email],
    });
  } catch (err) {
    // ignore update errors; primary insert/ON CONFLICT should have handled most cases
  }

  console.log(`Super admin seeded: ${email} (id: ${id})`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
