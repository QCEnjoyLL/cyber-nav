UPDATE settings
SET value = 'clean-surface', updated_at = CURRENT_TIMESTAMP
WHERE key = 'backgroundStyle' AND value = 'classic-grid';

UPDATE settings
SET value = '个人工作流、AI 工具与常用站点的聚合入口', updated_at = CURRENT_TIMESTAMP
WHERE key = 'subtitleZh' AND value = '个人工作流、AI 工具和灵感站点的赛博入口';

UPDATE settings
SET value = 'A calm personal hub for workflows, AI tools, and favorite sites', updated_at = CURRENT_TIMESTAMP
WHERE key = 'subtitleEn' AND value = 'A cyberpunk hub for workflows, AI tools, and inspiration';
