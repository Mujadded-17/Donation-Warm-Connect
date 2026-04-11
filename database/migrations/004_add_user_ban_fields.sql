ALTER TABLE user
  ADD COLUMN is_banned TINYINT(1) NOT NULL DEFAULT 0 AFTER profile_url,
  ADD COLUMN ban_reason VARCHAR(255) NULL AFTER is_banned,
  ADD COLUMN banned_at DATETIME NULL AFTER ban_reason;