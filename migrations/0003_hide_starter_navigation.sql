UPDATE links
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN ('openai', 'cloudflare', 'github', 'figma');

UPDATE categories
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN ('ai', 'dev', 'cloud', 'design');
