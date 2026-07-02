INSERT INTO settings (key, value, updated_at) VALUES
  ('titleZh', '橙子导航', CURRENT_TIMESTAMP),
  ('titleEn', 'Orange Nav', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = CURRENT_TIMESTAMP;
