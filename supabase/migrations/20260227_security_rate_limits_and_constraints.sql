-- Security hardening: rate limiting, input constraints, tightened RLS
-- Run this in the Supabase Dashboard SQL Editor

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. DATA VALIDATION CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- client_inquiries: constrain column values
ALTER TABLE client_inquiries
  ADD CONSTRAINT chk_ci_mobile CHECK (mobile ~ '^09[0-9]{9}$'),
  ADD CONSTRAINT chk_ci_status CHECK (status IN ('new', 'contacted', 'closed')),
  ADD CONSTRAINT chk_ci_age CHECK (age BETWEEN 18 AND 99),
  ADD CONSTRAINT chk_ci_first_name_len CHECK (char_length(first_name) <= 100),
  ADD CONSTRAINT chk_ci_last_name_len CHECK (char_length(last_name) <= 100),
  ADD CONSTRAINT chk_ci_message_len CHECK (message IS NULL OR char_length(message) <= 2000),
  ADD CONSTRAINT chk_ci_interests CHECK (
    array_to_string(interests, ',') ~* '^(life insurance|health coverage|emergency fund|retirement planning|investment/vul)(,(life insurance|health coverage|emergency fund|retirement planning|investment/vul))*$'
  );

-- quiz_leads: constrain column values
ALTER TABLE quiz_leads
  ADD CONSTRAINT chk_ql_status CHECK (status IN ('new', 'contacted', 'closed')),
  ADD CONSTRAINT chk_ql_score CHECK (score BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_ql_first_name_len CHECK (char_length(first_name) <= 100),
  ADD CONSTRAINT chk_ql_mobile CHECK (mobile IS NULL OR mobile ~ '^09[0-9]{9}$');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. RATE LIMITING VIA TRIGGER (per mobile number, 1 insert per 60 seconds)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Rate limiter for client_inquiries
CREATE OR REPLACE FUNCTION check_inquiry_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM client_inquiries
    WHERE mobile = NEW.mobile
      AND created_at > now() - INTERVAL '60 seconds'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before submitting again.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_inquiry_rate_limit
  BEFORE INSERT ON client_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION check_inquiry_rate_limit();

-- Rate limiter for quiz_leads (by mobile when provided)
CREATE OR REPLACE FUNCTION check_quiz_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mobile IS NOT NULL AND EXISTS (
    SELECT 1 FROM quiz_leads
    WHERE mobile = NEW.mobile
      AND created_at > now() - INTERVAL '60 seconds'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before submitting again.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_quiz_rate_limit
  BEFORE INSERT ON quiz_leads
  FOR EACH ROW
  EXECUTE FUNCTION check_quiz_rate_limit();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. TIGHTEN RLS UPDATE POLICIES (admin-only via allow-list)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create an admin lookup table so we don't hardcode UUIDs
CREATE TABLE IF NOT EXISTS app_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_admins ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage the admin table (no client access)
-- No policies = no client access; only service_role bypasses RLS

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop old permissive UPDATE policies
DROP POLICY IF EXISTS "Auth can update inquiries" ON client_inquiries;
DROP POLICY IF EXISTS "Auth can update quiz_leads" ON quiz_leads;

-- Create admin-only UPDATE policies
CREATE POLICY "Admin can update inquiries" ON client_inquiries
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can update quiz_leads" ON quiz_leads
  FOR UPDATE USING (is_admin());

-- Also tighten SELECT to admin-only (currently any authenticated user can read)
DROP POLICY IF EXISTS "Auth can read inquiries" ON client_inquiries;
DROP POLICY IF EXISTS "Authenticated can read leads" ON quiz_leads;

CREATE POLICY "Admin can read inquiries" ON client_inquiries
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin can read quiz_leads" ON quiz_leads
  FOR SELECT USING (is_admin());

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. SEED ADMIN USER (run after Kris has signed up)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this AFTER the migration above has been applied:
--
-- INSERT INTO app_admins (user_id)
-- SELECT id FROM auth.users WHERE email = 'kjpasiona@gmail.com'
-- ON CONFLICT DO NOTHING;
