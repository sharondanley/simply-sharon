-- Create posts table (enhanced)
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt VARCHAR(500),
    content LONGTEXT NOT NULL,
    author VARCHAR(100) DEFAULT 'Anonymous',
    author_id INT NULL,
    featured_image_url VARCHAR(500),
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    canonical_url VARCHAR(500),
    og_image_url VARCHAR(500),
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Create users table (authors/editors)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('admin', 'editor') DEFAULT 'editor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Add author foreign key (optional)
ALTER TABLE
    posts
ADD
    CONSTRAINT fk_posts_author_id FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE
SET
    NULL;
-- Create images table (for post images)
CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    caption VARCHAR(500),
    position_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Create comments table (for interactions)
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_created_at (created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Create reactions table (likes/reactions)
CREATE TABLE IF NOT EXISTS reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    reaction_type VARCHAR(50) DEFAULT 'like',
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    UNIQUE KEY unique_reaction (post_id, ip_address, reaction_type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Join table for post categories
CREATE TABLE IF NOT EXISTS post_categories (
    post_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Join table for post tags
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Post revisions table
CREATE TABLE IF NOT EXISTS post_revisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    excerpt VARCHAR(500),
    content LONGTEXT NOT NULL,
    featured_image_url VARCHAR(500),
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    canonical_url VARCHAR(500),
    og_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE
    SET
        NULL,
        INDEX idx_post_id (post_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Post slug history table (for redirects)
CREATE TABLE IF NOT EXISTS post_slug_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    old_slug VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_old_slug (old_slug),
    INDEX idx_post_id (post_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Post views table (analytics)
CREATE TABLE IF NOT EXISTS post_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_created_at (created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Create indexes for faster queries
CREATE INDEX idx_status ON posts(status);
CREATE INDEX idx_published_at ON posts(published_at DESC);
CREATE INDEX idx_slug ON posts(slug);
CREATE INDEX idx_deleted_at ON posts(deleted_at);
-- Sample data
INSERT INTO
    posts (
        title,
        slug,
        excerpt,
        content,
        author,
        featured_image_url,
        status,
        published_at
    )
VALUES
    (
        'Welcome to Sharon\'s Blog',
        'welcome-to-sharons-blog',
        'This is your first blog post. Learn how to manage your content!',
        'This is your first blog post. Edit it to add your own content! You can now upload images and manage your posts easily.',
        'Sharon',
        'https://via.placeholder.com/800x400?text=Welcome',
        'published',
        NOW()
    ),
    (
        'Getting Started',
        'getting-started',
        'Learn how to use this blog editor dashboard.',
        'Learn how to use this blog backend to manage your posts. Create, edit, delete, and hide posts as needed.',
        'Admin',
        'https://via.placeholder.com/800x400?text=Getting+Started',
        'published',
        NOW()
    );
-- Sample image data
INSERT INTO
    images (
        post_id,
        image_url,
        alt_text,
        caption,
        position_order
    )
VALUES
    (
        1,
        'https://via.placeholder.com/600x400?text=Blog+Image+1',
        'Sample image 1',
        'First sample image',
        1
    ),
    (
        2,
        'https://via.placeholder.com/600x400?text=Blog+Image+2',
        'Sample image 2',
        'Getting started guide image',
        1
    );
-- Sample comment data
INSERT INTO
    comments (post_id, author_name, content)
VALUES
    (
        1,
        'John Reader',
        'Great first post!'
    ),
    (
        1,
        'Jane Follower',
        'Love the blog!'
    );