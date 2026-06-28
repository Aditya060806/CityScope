-- ============================================================================
-- STEP 2: Add verification_status to issues (separate from step 1)
-- Run AFTER step 1 succeeds.
-- ============================================================================

ALTER TABLE issues ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending_review';

-- Add the CHECK constraint separately (safe if column already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'issues' AND constraint_name = 'issues_verification_status_check'
  ) THEN
    ALTER TABLE issues ADD CONSTRAINT issues_verification_status_check
      CHECK (verification_status IN ('pending_review', 'approved', 'declined_fake', 'escalated'));
  END IF;
END $$;
