-- Migration 003: Simplify public blog comments
-- Safe to re-run on MySQL 8.0+.

CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_comments_post_id (post_id),
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE
    comments
ADD
    COLUMN IF NOT EXISTS author_name VARCHAR(100) NULL
AFTER
    post_id,
ADD
    COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
AFTER
    content;

UPDATE
    comments
SET
    author_name = 'Anonymous'
WHERE
    author_name IS NULL
    OR author_name = '';
