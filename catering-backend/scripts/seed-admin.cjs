/**
 * Create or update the platform admin user (role admin, email pre-verified).
 *
 * Required in .env (or environment):
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 * Optional:
 *   ADMIN_FULL_NAME
 *
 * Usage:
 *   npm run seed:admin
 *   npm run seed:admin -- --reset   # force password + admin role on existing email
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
const fullName = (process.env.ADMIN_FULL_NAME || 'Platform Admin').trim();
const forceReset =
  process.argv.includes('--reset') ||
  ['true', '1', 'yes', 'on'].includes(
    (process.env.ADMIN_SEED_RESET || '').trim().toLowerCase(),
  );

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env (not IN_EMAIL).');
  process.exit(1);
}

if (password.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters.');
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

  const passwordHash = await bcrypt.hash(password, 12);
  const [rows] = await conn.query(
    'SELECT id, role, email_verified_at FROM users WHERE email = ? LIMIT 1',
    [email],
  );

  if (Array.isArray(rows) && rows.length > 0) {
    const existing = rows[0];
    if (!forceReset && existing.role === 'admin' && existing.email_verified_at) {
      console.log(
        'Admin already exists:',
        email,
        '(use --reset or ADMIN_SEED_RESET=true to update password)',
      );
      await conn.end();
      return;
    }

    await conn.query(
      `UPDATE users SET
         password_hash = ?,
         full_name = ?,
         role = 'admin',
         email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP(6)),
         email_verification_token = NULL,
         email_verification_expires_at = NULL,
         email_verification_otp_hash = NULL,
         updated_at = CURRENT_TIMESTAMP(6)
       WHERE id = ?`,
      [passwordHash, fullName, existing.id],
    );
    console.log('Admin user updated:', email, forceReset ? '(password reset)' : '(promoted to admin)');
    await conn.end();
    return;
  }

  const id = randomUUID();
  await conn.query(
    `INSERT INTO users (
       id, email, password_hash, full_name, role,
       email_verified_at, email_verification_token, email_verification_expires_at,
       email_verification_otp_hash, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, 'admin', CURRENT_TIMESTAMP(6), NULL, NULL, NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))`,
    [id, email, passwordHash, fullName],
  );
  console.log('Admin user created:', email);
  await conn.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
