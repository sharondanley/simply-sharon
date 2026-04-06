require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const port = Number(process.env.PORT || 8081);

const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    connectTimeout: 10000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

const dbPromise = db.promise();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function authMiddleware(req, res, next) {
    const token = req.cookies?.admin_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    try {
        req.adminUser = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.clearCookie('admin_token');
        res.status(401).json({ error: 'Invalid or expired session' });
    }
}

// ─── Public routes ─────────────────────────────────────────────────────────────

const getPosts = (req, res) => {
    const limit = Math.min(Number(req.query.limit || 10), 100);
    const sql = "SELECT * FROM posts WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ?";
    db.query(sql, [limit], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
};

app.get("/api/posts", getPosts);
app.get("/posts", getPosts);
app.get("/blog_articles", getPosts);

app.get("/health", (req, res) => {
    res.json({ ok: true });
});

// ─── Auth routes ───────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const [rows] = await dbPromise.query(
            'SELECT id, name, email, role, password_hash FROM users WHERE email = ? OR name = ? LIMIT 1',
            [username, username]
        );
        const user = rows[0];

        if (!user || !user.password_hash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('admin_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ name: user.name, email: user.email, role: user.role });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
    const token = req.cookies?.admin_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const user = jwt.verify(token, JWT_SECRET);
        res.json({ name: user.name, email: user.email, role: user.role });
    } catch {
        res.clearCookie('admin_token');
        res.status(401).json({ error: 'Invalid session' });
    }
});

// ─── Admin post routes ─────────────────────────────────────────────────────────

app.get('/api/admin/posts', authMiddleware, async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;

    try {
        let items;
        try {
            [items] = await dbPromise.query(
                `SELECT id, slug, title, subtitle, featured_image_url AS thumbnailUrl,
                        topic, episode, published_at AS publishedAt
                 FROM posts
                 WHERE deleted_at IS NULL
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );
        } catch (err) {
            // Backward-compatible query for databases that have not run the metadata migration yet.
            if (!String(err.message || '').includes('Unknown column')) throw err;
            [items] = await dbPromise.query(
                `SELECT id, slug, title, NULL AS subtitle, featured_image_url AS thumbnailUrl,
                        NULL AS topic, NULL AS episode, published_at AS publishedAt
                 FROM posts
                 WHERE deleted_at IS NULL
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );
        }
        const [[{ total }]] = await dbPromise.query(
            'SELECT COUNT(*) AS total FROM posts WHERE deleted_at IS NULL'
        );
        res.json({ items, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/posts', authMiddleware, async (req, res) => {
    const { title, subtitle, summary, topic, episode, hashtags, blocks, thumbnailUrl, published } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const baseSlug = slugify(title.trim());
    const slug = baseSlug + '-' + Date.now();
    const content = JSON.stringify(blocks || []);
    const status = published ? 'published' : 'draft';
    const publishedAt = published ? new Date() : null;

    try {
        let result;
        try {
            [result] = await dbPromise.query(
                `INSERT INTO posts
                   (title, subtitle, slug, excerpt, content, featured_image_url,
                    status, published_at, topic, episode, hashtags, author_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    title.trim(),
                    subtitle?.trim() || null,
                    slug,
                    summary?.trim() || null,
                    content,
                    thumbnailUrl || null,
                    status,
                    publishedAt,
                    topic?.trim() || null,
                    episode ? parseInt(episode) : null,
                    hashtags?.length ? JSON.stringify(hashtags) : null,
                    req.adminUser.id,
                ]
            );
        } catch (err) {
            // Backward-compatible insert for older schemas without subtitle/topic/episode/hashtags.
            if (!String(err.message || '').includes('Unknown column')) throw err;
            [result] = await dbPromise.query(
                `INSERT INTO posts
                   (title, slug, excerpt, content, featured_image_url, status, published_at, author_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    title.trim(),
                    slug,
                    summary?.trim() || null,
                    content,
                    thumbnailUrl || null,
                    status,
                    publishedAt,
                    req.adminUser.id,
                ]
            );
        }
        res.status(201).json({ slug, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/posts/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: 'Invalid post ID' });

    try {
        await dbPromise.query(
            'UPDATE posts SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Thumbnail upload ──────────────────────────────────────────────────────────

app.post('/api/admin/upload/thumbnail', authMiddleware, (req, res) => {
    const { dataBase64, contentType, filename } = req.body;

    if (!dataBase64 || !contentType) {
        return res.status(400).json({ error: 'Missing image data' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
        return res.status(400).json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' });
    }

    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image exceeds 5 MB limit' });
    }

    const ext = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1];
    const safeName = crypto.randomBytes(16).toString('hex') + '.' + ext;
    const uploadsDir = path.join(__dirname, 'public', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadsDir, safeName), buffer);
    res.json({ url: `/uploads/${safeName}` });
});

// ─── Admin page route ──────────────────────────────────────────────────────────

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});

server.on("error", (error) => {
    console.error("Server failed to start:", error.message);
    process.exit(1);
});