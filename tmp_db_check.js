const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    env[key] = value;
  }
  return env;
}

(async () => {
  const env = loadEnv(path.join(__dirname, '.env'));
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: Number(env.DB_PORT || 3306),
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  const queries = {
    posts: `SELECT id, title, slug, status, published_at, deleted_at FROM posts ORDER BY id DESC LIMIT 20`,
    comments: `SELECT id, post_id, parent_id, author_name, status, LEFT(content, 80) AS snippet FROM comments ORDER BY id DESC LIMIT 50`,
    postCountActive: `SELECT COUNT(*) AS count FROM posts WHERE deleted_at IS NULL`,
    commentCountAll: `SELECT COUNT(*) AS count FROM comments`,
    commentCountOnActivePosts: `SELECT COUNT(*) AS count FROM comments c INNER JOIN posts p ON p.id = c.post_id WHERE p.deleted_at IS NULL`,
    commentsByPost: `SELECT p.id, p.title, p.deleted_at, COUNT(c.id) AS comment_count FROM posts p LEFT JOIN comments c ON c.post_id = p.id GROUP BY p.id, p.title, p.deleted_at ORDER BY p.id DESC LIMIT 20`,
  };

  for (const [name, sql] of Object.entries(queries)) {
    const [rows] = await conn.query(sql);
    console.log(`\n--- ${name} ---`);
    console.log(JSON.stringify(rows, null, 2));
  }

  await conn.end();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
