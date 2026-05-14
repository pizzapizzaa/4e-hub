require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');

// Remove comment lines, split on semicolons, filter empty
const stmts = sql
  .split('\n')
  .filter(line => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

async function run() {
  for (const stmt of stmts) {
    await db.execute(stmt + ';');
  }
  console.log('Schema applied:', stmts.length, 'statements');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
