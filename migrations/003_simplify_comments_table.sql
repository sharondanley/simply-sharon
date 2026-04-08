-- Migration 003: Comment replies, reactions, and verified author
-- Safe to re-run on MySQL 8.0+.

CREATE TABLE IF NOT EXISTS comments (
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
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE
    comments
ADD
    COLUMN IF NOT EXISTS parent_id INT NULL
AFTER
    post_id,
ADD
    COLUMN IF NOT EXISTS author_name VARCHAR(100) NULL
AFTER
    parent_id,
ADD
    COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
AFTER
    content,
ADD
    COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0
AFTER
    created_at,
ADD
    COLUMN IF NOT EXISTS hearts_count INT NOT NULL DEFAULT 0
AFTER
    likes_count,
ADD
    COLUMN IF NOT EXISTS is_verified_author TINYINT(1) NOT NULL DEFAULT 0
AFTER
    hearts_count;

UPDATE
    comments
SET
    author_name = 'Anonymous'
WHERE
    author_name IS NULL
    OR author_name = '';
