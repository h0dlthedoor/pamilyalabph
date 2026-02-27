-- Add immunity test results and gap score to client inquiries
-- Run this in the Supabase Dashboard SQL Editor

ALTER TABLE client_inquiries
  ADD COLUMN IF NOT EXISTS immunity_json JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gap_score INTEGER DEFAULT NULL;

COMMENT ON COLUMN client_inquiries.immunity_json IS 'Financial Immunity Test results: {score, maxScore, diagnosis, answers[{q,a,pts}]}';
COMMENT ON COLUMN client_inquiries.gap_score IS 'Overall coverage gap score (0-100%)';
