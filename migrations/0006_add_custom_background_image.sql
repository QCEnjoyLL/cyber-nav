INSERT INTO settings (key, value, updated_at) VALUES
  ('customBackgroundImage', '', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO NOTHING;
