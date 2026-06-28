-- ============================================================================
-- Report Workflow Foundation
-- Adds report lookup token support and admin workflow search foundations.
-- ============================================================================

-- 1) Denormalized token field for quick issue search
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS report_token VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_issues_report_token ON issues(report_token);

-- 2) Report token registry table
CREATE TABLE IF NOT EXISTS report_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  reporter_email TEXT NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  token_type VARCHAR(20) NOT NULL DEFAULT 'lookup',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_report_tokens_issue_id ON report_tokens(issue_id);
CREATE INDEX IF NOT EXISTS idx_report_tokens_reporter_email ON report_tokens(reporter_email);
CREATE INDEX IF NOT EXISTS idx_report_tokens_created_at ON report_tokens(created_at DESC);

-- 3) RLS policies
ALTER TABLE report_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Report tokens - admin read" ON report_tokens;
CREATE POLICY "Report tokens - admin read"
ON report_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
  )
);

DROP POLICY IF EXISTS "Report tokens - reporter insert own" ON report_tokens;
CREATE POLICY "Report tokens - reporter insert own"
ON report_tokens
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM issues
    WHERE issues.id = report_tokens.issue_id
      AND issues.reporter_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Report tokens - reporter read own" ON report_tokens;
CREATE POLICY "Report tokens - reporter read own"
ON report_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM issues
    WHERE issues.id = report_tokens.issue_id
      AND issues.reporter_id = auth.uid()
  )
);

-- 4) Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE report_tokens;
