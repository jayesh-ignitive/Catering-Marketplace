/**
 * Creates a platform admin user (role admin, email pre-verified).
 * Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running.
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
const fullName = (process.env.ADMIN_FULL_NAME || 'Platform Admin').trim();

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  process.exit(1);
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: process.env.DB_NAME || 'catering',
  });

  const [rows] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (Array.isArray(rows) && rows.length > 0) {
    console.log('Admin already exists:', email);
    await conn.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = randomUUID();
  await conn.query(
    `INSERT INTO users (id, email, password_hash, full_name, role, email_verified_at, email_verification_token, email_verification_expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'admin', CURRENT_TIMESTAMP(6), NULL, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))`,
    [id, email, passwordHash, fullName],
  );
  console.log('Admin user created:', email);
  await conn.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
