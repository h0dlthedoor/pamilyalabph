-- Client inquiry form submissions
-- Run this in the Supabase Dashboard SQL Editor
CREATE TABLE client_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  age INTEGER NOT NULL,
  interests TEXT[] DEFAULT '{}',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE client_inquiries ENABLE ROW LEVEL SECURITY;

-- Anon can submit
CREATE POLICY "Anyone can insert inquiries" ON client_inquiries
  FOR INSERT WITH CHECK (true);

-- Authenticated (Kris) can read + update
CREATE POLICY "Auth can read inquiries" ON client_inquiries
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth can update inquiries" ON client_inquiries
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE INDEX idx_client_inquiries_created_at ON client_inquiries(created_at DESC);
