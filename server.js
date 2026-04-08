require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const publicDir = path.join(__dirname, 'public');
const uploadsDir = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(publicDir, 'uploads');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));
const port = Number(process.env.PORT || 8082);

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

function parseJsonArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function parseContentBlocks(value) {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // Fall through and expose the content as a single paragraph block.
    }

    return [{
        id: crypto.randomBytes(6).toString('hex'),
        type: 'paragraph',
        content: String(value),
    }];
}

function hydratePostRecord(row) {
    if (!row) return null;

    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle || null,
        summary: row.summary || null,
        thumbnailUrl: row.thumbnailUrl || null,
        topic: row.topic || null,
        episode: row.episode || null,
        publishedAt: row.publishedAt || null,
        createdAt: row.createdAt || null,
        updatedAt: row.updatedAt || null,
        authorName: row.authorName || row.author || 'Simply Sharon',
        hashtags: parseJsonArray(row.hashtags),
        blocks: parseContentBlocks(row.content),
        published: row.status ? row.status === 'published' : Boolean(row.publishedAt),
    };
}

async function fetchAdminPostById(id) {
    let rows;

    try {
        [rows] = await dbPromise.query(
            `SELECT p.id, p.slug, p.title, p.subtitle, p.excerpt AS summary, p.content,
                    p.featured_image_url AS thumbnailUrl, p.topic, p.episode, p.hashtags,
                    p.status, p.published_at AS publishedAt, p.created_at AS createdAt,
                    p.updated_at AS updatedAt, COALESCE(u.name, p.author, 'Simply Sharon') AS authorName
             FROM posts p
             LEFT JOIN users u ON u.id = p.author_id
             WHERE p.id = ? AND p.deleted_at IS NULL
             LIMIT 1`,
            [id]
        );
    } catch (err) {
        if (!String(err.message || '').includes('Unknown column')) throw err;
        [rows] = await dbPromise.query(
            `SELECT p.id, p.slug, p.title, NULL AS subtitle, p.excerpt AS summary, p.content,
                    p.featured_image_url AS thumbnailUrl, NULL AS topic, NULL AS episode, NULL AS hashtags,
                    p.status, p.published_at AS publishedAt, p.created_at AS createdAt,
                    p.updated_at AS updatedAt, COALESCE(u.name, p.author, 'Simply Sharon') AS authorName
             FROM posts p
             LEFT JOIN users u ON u.id = p.author_id
             WHERE p.id = ? AND p.deleted_at IS NULL
             LIMIT 1`,
            [id]
        );
    }

    return hydratePostRecord(rows[0]);
}

async function fetchPublicPostByField(field, value) {
    if (!['id', 'slug'].includes(field)) {
        throw new Error('Unsupported field lookup');
    }

    let rows;

    try {
        [rows] = await dbPromise.query(
            `SELECT p.id, p.slug, p.title, p.subtitle, p.excerpt AS summary, p.content,
                    p.featured_image_url AS thumbnailUrl, p.topic, p.episode, p.hashtags,
                    p.status, p.published_at AS publishedAt, p.created_at AS createdAt,
                    p.updated_at AS updatedAt, COALESCE(u.name, p.author, 'Simply Sharon') AS authorName
             FROM posts p
             LEFT JOIN users u ON u.id = p.author_id
             WHERE p.${field} = ? AND p.deleted_at IS NULL
             LIMIT 1`,
            [value]
        );
    } catch (err) {
        if (!String(err.message || '').includes('Unknown column')) throw err;
        [rows] = await dbPromise.query(
            `SELECT p.id, p.slug, p.title, NULL AS subtitle, p.excerpt AS summary, p.content,
                    p.featured_image_url AS thumbnailUrl, NULL AS topic, NULL AS episode, NULL AS hashtags,
                    p.status, p.published_at AS publishedAt, p.created_at AS createdAt,
                    p.updated_at AS updatedAt, COALESCE(u.name, p.author, 'Simply Sharon') AS authorName
             FROM posts p
             LEFT JOIN users u ON u.id = p.author_id
             WHERE p.${field} = ? AND p.deleted_at IS NULL
             LIMIT 1`,
            [value]
        );
    }

    return hydratePostRecord(rows[0]);
}

async function fetchPublicArchivePosts({ page, limit, search, year, month }) {
    const where = ['deleted_at IS NULL', 'published_at IS NOT NULL'];
    const params = [];
    const countParams = [];
    const trimmedSearch = search?.trim();
    const numericYear = Number(year);
    const numericMonth = Number(month);
    const offset = (page - 1) * limit;

    if (trimmedSearch) {
        where.push('(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)');
        const pattern = `%${trimmedSearch}%`;
        params.push(pattern, pattern, pattern);
        countParams.push(pattern, pattern, pattern);
    }

    if (Number.isInteger(numericYear) && numericYear > 0) {
        where.push('YEAR(COALESCE(published_at, created_at)) = ?');
        params.push(numericYear);
        countParams.push(numericYear);
    }

    if (Number.isInteger(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
        where.push('MONTH(COALESCE(published_at, created_at)) = ?');
        params.push(numericMonth);
        countParams.push(numericMonth);
    }

    const whereClause = where.join(' AND ');
    let items;

    try {
        [items] = await dbPromise.query(
            `SELECT id, slug, title, subtitle, excerpt AS summary,
                    featured_image_url AS thumbnailUrl, topic, episode,
                    published_at AS publishedAt, created_at AS createdAt,
                    updated_at AS updatedAt
             FROM posts
             WHERE ${whereClause}
             ORDER BY COALESCE(published_at, created_at) DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
    } catch (err) {
        if (!String(err.message || '').includes('Unknown column')) throw err;
        [items] = await dbPromise.query(
            `SELECT id, slug, title, NULL AS subtitle, excerpt AS summary,
                    featured_image_url AS thumbnailUrl, NULL AS topic, NULL AS episode,
                    published_at AS publishedAt, created_at AS createdAt,
                    updated_at AS updatedAt
             FROM posts
             WHERE ${whereClause}
             ORDER BY COALESCE(published_at, created_at) DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
    }

    const [[{ total }]] = await dbPromise.query(
        `SELECT COUNT(*) AS total FROM posts WHERE ${whereClause}`,
        countParams
    );

    return {
        items,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}

async function ensureCommentsTable() {
    await dbPromise.query(
        `CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            parent_id INT NULL,
            author_name VARCHAR(100) NOT NULL,
            content LONGTEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            likes_count INT NOT NULL DEFAULT 0,
            hearts_count INT NOT NULL DEFAULT 0,
            is_verified_author TINYINT(1) NOT NULL DEFAULT 0,
            INDEX idx_comments_post_id (post_id),
            INDEX idx_comments_parent_id (parent_id),
            CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci`
    );

    await dbPromise.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INT NULL');
    await dbPromise.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_name VARCHAR(100) NULL');
    await dbPromise.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    await dbPromise.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0');
    await dbPromise.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS hearts_count INT NOT NULL DEFAULT 0');
    await dbPromise.query('ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_verified_author TINYINT(1) NOT NULL DEFAULT 0');

    try {
        await dbPromise.query(
            `UPDATE comments
             SET author_name = COALESCE(NULLIF(author_name, ''), author, 'Anonymous')
             WHERE author_name IS NULL OR author_name = ''`
        );
    } catch {
        // Ignore if legacy `author` column is not present.
    }

    await dbPromise.query(
        `UPDATE comments
         SET author_name = 'Anonymous'
         WHERE author_name IS NULL OR author_name = ''`
    );
}

const DEFAULT_ADMIN_PERSONALIZATION = {
    displayName: 'Sharon Danley',
    profilePhotoUrl: '',
    inspirationQuote: 'Style is a way to say who you are without having to speak.',
    inspirationImageUrl: '',
};

async function ensureSiteSettingsTable() {
    await dbPromise.query(
        `CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value LONGTEXT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci`
    );
}

async function getSiteSettings(keys) {
    if (!Array.isArray(keys) || keys.length === 0) return {};
    const placeholders = keys.map(() => '?').join(', ');
    const [rows] = await dbPromise.query(
        `SELECT setting_key AS settingKey, setting_value AS settingValue
         FROM site_settings
         WHERE setting_key IN (${placeholders})`,
        keys
    );

    return rows.reduce((acc, row) => {
        acc[row.settingKey] = row.settingValue || '';
        return acc;
    }, {});
}

async function setSiteSetting(key, value) {
    await dbPromise.query(
        `INSERT INTO site_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value]
    );
}

function sanitizeSettingText(value, maxLength = 2000) {
    return String(value || '')
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .trim()
        .slice(0, maxLength);
}

async function getAdminPersonalization() {
    const settings = await getSiteSettings([
        'admin_display_name',
        'admin_profile_photo_url',
        'admin_inspiration_quote',
        'admin_inspiration_image_url',
    ]);

    return {
        displayName: settings.admin_display_name || DEFAULT_ADMIN_PERSONALIZATION.displayName,
        profilePhotoUrl: settings.admin_profile_photo_url || DEFAULT_ADMIN_PERSONALIZATION.profilePhotoUrl,
        inspirationQuote: settings.admin_inspiration_quote || DEFAULT_ADMIN_PERSONALIZATION.inspirationQuote,
        inspirationImageUrl: settings.admin_inspiration_image_url || DEFAULT_ADMIN_PERSONALIZATION.inspirationImageUrl,
    };
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

app.get('/api/blogcast/posts', async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 6), 50);
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const year = typeof req.query.year === 'string' ? req.query.year : '';
    const month = typeof req.query.month === 'string' ? req.query.month : '';

    try {
        const data = await fetchPublicArchivePosts({ page, limit, search, year, month });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/blogcast/posts/id/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) return res.status(400).json({ error: 'Invalid post ID' });

    try {
        const post = await fetchPublicPostByField('id', id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/blogcast/comments', async (req, res) => {
    const postId = parseInt(req.query.postId, 10);
    if (!postId || postId < 1) return res.status(400).json({ error: 'Invalid post ID' });

    try {
        const [rows] = await dbPromise.query(
            `SELECT id, post_id AS postId, parent_id AS parentId,
                    author_name AS authorName, content, created_at AS createdAt,
                    likes_count AS likesCount, hearts_count AS heartsCount,
                    is_verified_author AS isVerifiedAuthor
             FROM comments
             WHERE post_id = ?
             ORDER BY created_at ASC`,
            [postId]
        );
        res.json({ items: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/blogcast/comments', async (req, res) => {
    const postId = parseInt(req.body.postId, 10);
    const parentId = req.body.parentId ? parseInt(req.body.parentId, 10) : null;
    let authorName = String(req.body.authorName || '').trim();
    const content = String(req.body.content || '').trim();

    if (!postId || postId < 1) return res.status(400).json({ error: 'Invalid post ID' });
    if (!content) return res.status(400).json({ error: 'Comment content is required' });

    const safeContent = content
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/\son\w+\s*=\s*"[^"]*"/gi, '');

    let isVerifiedAuthor = 0;
    const token = req.cookies?.admin_token;
    if (token) {
        try {
            const admin = jwt.verify(token, JWT_SECRET);
            if (admin?.role === 'admin') {
                isVerifiedAuthor = 1;
                if (!authorName) {
                    authorName = String(admin.name || 'Verified Author').trim();
                }
            }
        } catch {
            // Ignore invalid token and continue as anonymous/non-admin.
        }
    }

    if (!authorName) return res.status(400).json({ error: 'Author name is required' });

    try {
        const [postRows] = await dbPromise.query(
            'SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL AND published_at IS NOT NULL LIMIT 1',
            [postId]
        );
        if (!postRows[0]) return res.status(404).json({ error: 'Post not found' });

        if (parentId) {
            const [parentRows] = await dbPromise.query(
                'SELECT id FROM comments WHERE id = ? AND post_id = ? LIMIT 1',
                [parentId, postId]
            );
            if (!parentRows[0]) return res.status(400).json({ error: 'Parent comment not found' });
        }

        const [result] = await dbPromise.query(
            `INSERT INTO comments (post_id, parent_id, author_name, content, is_verified_author)
             VALUES (?, ?, ?, ?, ?)`,
            [postId, parentId, authorName, safeContent, isVerifiedAuthor]
        );

        const [rows] = await dbPromise.query(
            `SELECT id, post_id AS postId, parent_id AS parentId,
                    author_name AS authorName, content, created_at AS createdAt,
                    likes_count AS likesCount, hearts_count AS heartsCount,
                    is_verified_author AS isVerifiedAuthor
             FROM comments
             WHERE id = ? LIMIT 1`,
            [result.insertId]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/blogcast/comments/:id/reaction', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const reaction = String(req.body?.reaction || '').trim().toLowerCase();

    if (!id || id < 1) return res.status(400).json({ error: 'Invalid comment ID' });
    if (!['like', 'heart'].includes(reaction)) {
        return res.status(400).json({ error: 'Invalid reaction type' });
    }

    try {
        const [result] = await dbPromise.query(
            reaction === 'like'
                ? 'UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?'
                : 'UPDATE comments SET hearts_count = hearts_count + 1 WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const [rows] = await dbPromise.query(
            `SELECT likes_count AS likesCount, hearts_count AS heartsCount
             FROM comments
             WHERE id = ? LIMIT 1`,
            [id]
        );

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/blogcast/posts/:slug', async (req, res) => {
    try {
        const post = await fetchPublicPostByField('slug', req.params.slug);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

app.get('/api/admin/personalization', authMiddleware, async (req, res) => {
    try {
        const personalization = await getAdminPersonalization();
        res.json(personalization);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/personalization', authMiddleware, async (req, res) => {
    const displayName = sanitizeSettingText(req.body?.displayName, 120) || DEFAULT_ADMIN_PERSONALIZATION.displayName;
    const profilePhotoUrl = sanitizeSettingText(req.body?.profilePhotoUrl, 2048);
    const inspirationQuote = sanitizeSettingText(req.body?.inspirationQuote, 1200) || DEFAULT_ADMIN_PERSONALIZATION.inspirationQuote;
    const inspirationImageUrl = sanitizeSettingText(req.body?.inspirationImageUrl, 2048);

    try {
        await Promise.all([
            setSiteSetting('admin_display_name', displayName),
            setSiteSetting('admin_profile_photo_url', profilePhotoUrl),
            setSiteSetting('admin_inspiration_quote', inspirationQuote),
            setSiteSetting('admin_inspiration_image_url', inspirationImageUrl),
        ]);

        res.json({
            displayName,
            profilePhotoUrl,
            inspirationQuote,
            inspirationImageUrl,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Admin post routes ─────────────────────────────────────────────────────────

app.get('/api/admin/posts', authMiddleware, async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const offset = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';
    const date = typeof req.query.date === 'string' ? req.query.date.trim() : '';

    try {
        let items, total;
        try {
            const where = ['deleted_at IS NULL'];
            const params = [];
            if (search) {
                where.push('(title LIKE ? OR subtitle LIKE ? OR topic LIKE ? OR hashtags LIKE ?)');
                const p = `%${search}%`;
                params.push(p, p, p, p);
            }
            if (status === 'published') {
                where.push("(status = 'published' OR published_at IS NOT NULL)");
            } else if (status === 'draft') {
                where.push("(status = 'draft' OR published_at IS NULL)");
            }
            if (date) {
                where.push('DATE(COALESCE(published_at, created_at)) = ?');
                params.push(date);
            }
            const wc = where.join(' AND ');
            [items] = await dbPromise.query(
                `SELECT id, slug, title, subtitle, featured_image_url AS thumbnailUrl,
                        topic, episode, published_at AS publishedAt, created_at AS createdAt
                 FROM posts WHERE ${wc} ORDER BY COALESCE(published_at, created_at) DESC, id DESC LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );
            [[{ total }]] = await dbPromise.query(
                `SELECT COUNT(*) AS total FROM posts WHERE ${wc}`, params
            );
        } catch (innerErr) {
            // Backward-compatible query for databases that have not run the metadata migration yet.
            if (!String(innerErr.message || '').includes('Unknown column')) throw innerErr;
            const where = ['deleted_at IS NULL'];
            const params = [];
            if (search) {
                where.push('title LIKE ?');
                params.push(`%${search}%`);
            }
            if (status === 'published') {
                where.push('published_at IS NOT NULL');
            } else if (status === 'draft') {
                where.push('published_at IS NULL');
            }
            if (date) {
                where.push('DATE(COALESCE(published_at, created_at)) = ?');
                params.push(date);
            }
            const wc = where.join(' AND ');
            [items] = await dbPromise.query(
                `SELECT id, slug, title, NULL AS subtitle, featured_image_url AS thumbnailUrl,
                        NULL AS topic, NULL AS episode, published_at AS publishedAt, created_at AS createdAt
                 FROM posts WHERE ${wc} ORDER BY COALESCE(published_at, created_at) DESC, id DESC LIMIT ? OFFSET ?`,
                [...params, limit, offset]
            );
            [[{ total }]] = await dbPromise.query(
                `SELECT COUNT(*) AS total FROM posts WHERE ${wc}`, params
            );
        }
        res.json({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(Number(total) / limit)) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/posts/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) return res.status(400).json({ error: 'Invalid post ID' });

    try {
        const post = await fetchAdminPostById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
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

app.put('/api/admin/posts/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { title, subtitle, summary, topic, episode, hashtags, blocks, thumbnailUrl, published } = req.body;

    if (!id || id < 1) return res.status(400).json({ error: 'Invalid post ID' });
    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const [existingRows] = await dbPromise.query(
            'SELECT slug, published_at AS publishedAt FROM posts WHERE id = ? AND deleted_at IS NULL LIMIT 1',
            [id]
        );
        const existing = existingRows[0];

        if (!existing) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const content = JSON.stringify(blocks || []);
        const status = published ? 'published' : 'draft';
        const normalizedEpisode = Number.isInteger(Number(episode)) && Number(episode) > 0
            ? parseInt(episode, 10)
            : null;
        const publishedAt = published ? (existing.publishedAt || new Date()) : null;

        try {
            await dbPromise.query(
                `UPDATE posts
                 SET title = ?, subtitle = ?, excerpt = ?, content = ?, featured_image_url = ?,
                     status = ?, published_at = ?, topic = ?, episode = ?, hashtags = ?
                 WHERE id = ? AND deleted_at IS NULL`,
                [
                    title.trim(),
                    subtitle?.trim() || null,
                    summary?.trim() || null,
                    content,
                    thumbnailUrl || null,
                    status,
                    publishedAt,
                    topic?.trim() || null,
                    normalizedEpisode,
                    hashtags?.length ? JSON.stringify(hashtags) : null,
                    id,
                ]
            );
        } catch (err) {
            if (!String(err.message || '').includes('Unknown column')) throw err;
            await dbPromise.query(
                `UPDATE posts
                 SET title = ?, excerpt = ?, content = ?, featured_image_url = ?,
                     status = ?, published_at = ?
                 WHERE id = ? AND deleted_at IS NULL`,
                [
                    title.trim(),
                    summary?.trim() || null,
                    content,
                    thumbnailUrl || null,
                    status,
                    publishedAt,
                    id,
                ]
            );
        }

        res.json({ ok: true, slug: existing.slug });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/posts/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    if (!id || id < 1) return res.status(400).json({ error: 'Invalid post ID' });

    try {
        const [result] = await dbPromise.query(
            'UPDATE posts SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Post not found or already deleted' });
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/admin/posts/:id/unlist', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) return res.status(400).json({ error: 'Invalid post ID' });

    try {
        const [result] = await dbPromise.query(
            "UPDATE posts SET published_at = NULL, status = 'draft' WHERE id = ? AND deleted_at IS NULL",
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/stats', authMiddleware, async (req, res) => {
    try {
        const [[{ total }]] = await dbPromise.query(
            'SELECT COUNT(*) AS total FROM posts WHERE deleted_at IS NULL'
        );
        const [[{ published }]] = await dbPromise.query(
            "SELECT COUNT(*) AS published FROM posts WHERE deleted_at IS NULL AND (status = 'published' OR published_at IS NOT NULL)"
        );
        const [[{ commentsTotal }]] = await dbPromise.query(
            'SELECT COUNT(*) AS commentsTotal FROM comments'
        );
        const [commentsByPost] = await dbPromise.query(
            `SELECT p.id AS postId, p.title AS postTitle, p.slug AS postSlug, COUNT(c.id) AS commentsCount
             FROM posts p
             LEFT JOIN comments c ON c.post_id = p.id
             WHERE p.deleted_at IS NULL
             GROUP BY p.id, p.title, p.slug
             ORDER BY commentsCount DESC, p.created_at DESC
             LIMIT 10`
        );
        res.json({
            total: Number(total),
            published: Number(published),
            drafts: Number(total) - Number(published),
            commentsTotal: Number(commentsTotal),
            commentsByPost,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/comments', authMiddleware, async (req, res) => {
    try {
        const [rows] = await dbPromise.query(
            `SELECT c.id, c.post_id AS postId, c.parent_id AS parentId,
                    c.author_name AS authorName, c.content, c.created_at AS createdAt,
                    c.likes_count AS likesCount, c.hearts_count AS heartsCount,
                    c.is_verified_author AS isVerifiedAuthor,
                    p.title AS postTitle, p.slug AS postSlug
             FROM comments c
             INNER JOIN posts p ON p.id = c.post_id
             WHERE p.deleted_at IS NULL
             ORDER BY p.id DESC, COALESCE(c.parent_id, c.id) ASC, c.parent_id IS NOT NULL ASC, c.created_at ASC`
        );
        res.json({ items: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/comments/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id || id < 1) return res.status(400).json({ error: 'Invalid comment ID' });

    try {
        const [result] = await dbPromise.query('DELETE FROM comments WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Thumbnail upload ──────────────────────────────────────────────────────────

app.post('/api/admin/upload/thumbnail', authMiddleware, async (req, res) => {
    const { dataBase64, contentType, filename } = req.body;

    if (!dataBase64 || !contentType) {
        return res.status(400).json({ error: 'Missing image data' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
        return res.status(400).json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' });
    }

    const originalBuffer = Buffer.from(dataBase64, 'base64');
    if (originalBuffer.length > 8 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image exceeds 8 MB limit' });
    }

    let buffer = originalBuffer;
    let ext = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1];
    try {
        // Normalize uploads to compressed WebP to minimize storage.
        buffer = await sharp(originalBuffer)
            .rotate()
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 78, effort: 4 })
            .toBuffer();
        ext = 'webp';
    } catch {
        // If sharp cannot process the input, keep original bytes.
    }

    const safeName = crypto.randomBytes(16).toString('hex') + '.' + ext;

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uploadsDir, safeName), buffer);
    console.log('[upload] saved thumbnail:', path.join(uploadsDir, safeName));
    res.json({ url: `/uploads/${safeName}` });
});

// ─── Admin page route ──────────────────────────────────────────────────────────

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/blogcast', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/blogcast/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/blog-post/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
    try {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        console.log('[startup] uploadsDir:', uploadsDir);
        await ensureCommentsTable();
        await ensureSiteSettingsTable();
    } catch (error) {
        console.error('Failed to ensure comments table:', error.message);
        process.exit(1);
    }

    const server = app.listen(port, () => {
        console.log(`Listening on port ${port}...`);
    });

    server.on('error', (error) => {
        console.error('Server failed to start:', error.message);
        process.exit(1);
    });
}

startServer();