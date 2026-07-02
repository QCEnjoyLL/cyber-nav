INSERT INTO settings (key, value, updated_at) VALUES
  ('backgroundStyle', 'classic-grid', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO NOTHING;
