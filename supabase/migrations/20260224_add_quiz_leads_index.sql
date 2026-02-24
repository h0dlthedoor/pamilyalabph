-- Index on quiz_leads for faster advisor dashboard queries
CREATE INDEX IF NOT EXISTS idx_quiz_leads_created_at ON quiz_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_score ON quiz_leads(score);
