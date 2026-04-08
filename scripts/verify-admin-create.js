const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const port = process.env.VERIFY_PORT || process.env.PORT || '8091';
  const baseUrl = `http://127.0.0.1:${port}`;

  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const [admins] = await db.query(
      "SELECT id, name, email, role FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
    );

    if (!admins.length) {
      throw new Error('No admin user found in users table.');
    }

    const admin = admins[0];
    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const cookieHeader = `admin_token=${token}`;

    const thumbnailPayload = {
      filename: 'verify-thumb.png',
      contentType: 'image/png',
      dataBase64:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlAbwAAAABJRU5ErkJggg==',
    };

    const uploadRes = await fetch(`${baseUrl}/api/admin/upload/thumbnail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify(thumbnailPayload),
    });

    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok || !uploadData.url) {
      throw new Error(`Thumbnail upload failed: ${uploadRes.status} ${JSON.stringify(uploadData)}`);
    }

    const unique = Date.now();
    const createPayload = {
      title: `UI Migration Verification ${unique}`,
      subtitle: 'Automated verification post',
      summary: 'Created to verify migrated frontend compatibility and thumbnail URL persistence.',
      topic: 'Verification',
      episode: null,
      hashtags: ['verification', 'migration'],
      thumbnailUrl: uploadData.url,
      published: false,
      blocks: [
        {
          id: `blk-${unique}`,
          type: 'paragraph',
          content: '<p>This post was created by the verification script.</p>',
        },
      ],
    };

    const createRes = await fetch(`${baseUrl}/api/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify(createPayload),
    });

    const createData = await createRes.json().catch(() => ({}));
    if (!createRes.ok || !createData.id) {
      throw new Error(`Post creation failed: ${createRes.status} ${JSON.stringify(createData)}`);
    }

    const [rows] = await db.query(
      'SELECT id, slug, title, featured_image_url AS thumbnailUrl, status FROM posts WHERE id = ? LIMIT 1',
      [createData.id]
    );

    const post = rows[0];
    if (!post) {
      throw new Error('Created post was not found in the database.');
    }

    const result = {
      baseUrl,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      uploadedThumbnailUrl: uploadData.url,
      createdPost: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        status: post.status,
        thumbnailUrl: post.thumbnailUrl,
      },
      thumbnailPersistedAsUrl: typeof post.thumbnailUrl === 'string' && post.thumbnailUrl.startsWith('/uploads/'),
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
