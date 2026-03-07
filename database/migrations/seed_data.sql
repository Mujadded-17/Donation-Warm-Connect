USE donation_app_cse3100;

-- Insert admin user
-- Password: Admin@12345
-- This hash is generated using bcrypt
INSERT INTO user (name, email, pass_hash, phone, address, user_type, profile_url, created_at)
VALUES (
  'Silvia Admin',
  'silviaadmin@gmail.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  NULL,
  NULL,
  'admin',
  NULL,
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = 'Silvia Admin',
  pass_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  user_type = 'admin';

-- Sample categories
INSERT INTO category (name, icon) VALUES
('Clothing', 'clothing'),
('Food', 'food'),
('Electronics', 'electronics'),
('Books', 'books'),
('Furniture', 'furniture'),
('Toys', 'toys'),
('Other', 'other')
ON DUPLICATE KEY UPDATE name = name;
