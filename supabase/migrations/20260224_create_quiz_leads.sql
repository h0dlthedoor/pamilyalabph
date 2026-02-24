-- Quiz lead capture table
-- Run this in the Supabase Dashboard SQL Editor
CREATE TABLE IF NOT EXISTS quiz_leads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name  TEXT NOT NULL,
  mobile      TEXT,
  score       INT NOT NULL,
  answers_json JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE quiz_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (lead capture from public quiz)
CREATE POLICY "Allow anonymous inserts" ON quiz_leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- Only authenticated users (Kris) can read leads
CREATE POLICY "Authenticated can read leads" ON quiz_leads
  FOR SELECT TO authenticated
  USING (true);
