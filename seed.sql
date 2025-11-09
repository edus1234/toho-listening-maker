-- Initial admin account
-- Username: toho
-- Password: toho
-- Password hash generated using SHA-256

INSERT OR IGNORE INTO users (username, password_hash, email, is_admin, is_active) VALUES 
  ('toho', 'fd320c091b8cbb3868facf567061a3c8460e76f72915f5cacff9c270be3441df', 'toho@example.com', 1, 1);
