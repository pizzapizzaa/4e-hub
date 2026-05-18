require('dotenv').config({ path: './.env' });
const { createClient } = require('@libsql/client');
(async () => {
  try {
    const db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN });
    const email = process.env.SUPER_ADMIN_EMAIL;
    if (!email) { console.error('SUPER_ADMIN_EMAIL missing'); process.exit(2); }
    const upd = await db.execute({ sql: 'UPDATE users SET role = ?, is_active = 1 WHERE email = ?', args: ['super_admin', email] });
    console.log('UPDATE result:', JSON.stringify(upd));
    const changes = upd?.rowsAffected ?? upd?.changes ?? 0;
    if (changes === 0) {
      const hash = process.env.SUPER_ADMIN_PASSWORD_HASH || '';
      const now = new Date().toISOString();
      const sql = 'INSERT INTO users (id, email, password_hash, role, school_id, district_id, tenant_id, first_name, last_name, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const ins = await db.execute({ sql, args: ['system-super-admi      const ins = await dbmin', 'system', 'system', 'system', '4E', 'Admin      const ins = await db.execute({ sql, args: [' J     tringify(ins));
                                                                                                     r.m                                            );
