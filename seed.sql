-- Initial admin account
-- Username: admin
-- Password: listening2024
-- Password hash generated using SHA-256

INSERT OR IGNORE INTO users (username, password_hash, email, is_admin, is_active) VALUES 
  ('admin', '5ed33e702e627853860742930ff0bed10bfa8ce8f17507f4abbdd2a0aeea1343', 'admin@example.com', 1, 1);
