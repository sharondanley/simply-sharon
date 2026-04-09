require('dotenv').config({ quiet: true });

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  const email = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.TEST_ADMIN_PASSWORD || 'Admin123!';
  const displayName = process.env.TEST_ADMIN_NAME || 'Sharon Danley';

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await conn.execute(
      `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER email`
    );

    const hash = await bcrypt.hash(password, 12);
    const [rows] = await conn.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);

    if (rows.length) {
      await conn.execute(
        `UPDATE users
         SET name = ?, role = 'admin', password_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [displayName, hash, rows[0].id]
      );
      console.log('Updated existing admin user.');
    } else {
      await conn.execute(
        `INSERT INTO users (name, email, role, password_hash)
         VALUES (?, ?, 'admin', ?)`,
        [displayName, email, hash]
      );
      console.log('Created new admin user.');
    }

    console.log('--- TEST LOGIN ---');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('------------------');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Failed to seed admin:', err.message);
  process.exit(1);
});
