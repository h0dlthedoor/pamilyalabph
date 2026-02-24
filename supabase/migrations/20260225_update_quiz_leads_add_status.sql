-- Add status column to quiz_leads for admin tracking
-- Run this in the Supabase Dashboard SQL Editor
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';

CREATE POLICY "Auth can update quiz_leads" ON quiz_leads
  FOR UPDATE USING (auth.uid() IS NOT NULL);
