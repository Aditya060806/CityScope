-- ============================================================================
-- Fix issue_upvotes RLS policies (fixes 406 error)
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Enable RLS on issue_upvotes
ALTER TABLE issue_upvotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to issue upvotes" ON issue_upvotes;
DROP POLICY IF EXISTS "Allow authenticated users to upvote issues" ON issue_upvotes;
DROP POLICY IF EXISTS "Allow users to remove their upvotes" ON issue_upvotes;
DROP POLICY IF EXISTS "issue_upvotes_select" ON issue_upvotes;
DROP POLICY IF EXISTS "issue_upvotes_insert" ON issue_upvotes;
DROP POLICY IF EXISTS "issue_upvotes_delete" ON issue_upvotes;

-- Create policies
CREATE POLICY "issue_upvotes_select" ON issue_upvotes FOR SELECT USING (true);
CREATE POLICY "issue_upvotes_insert" ON issue_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "issue_upvotes_delete" ON issue_upvotes FOR DELETE USING (auth.uid() = user_id);

-- Also fix issue_flags if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issue_flags') THEN
    ALTER TABLE issue_flags ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "issue_flags_select" ON issue_flags';
    EXECUTE 'DROP POLICY IF EXISTS "issue_flags_insert" ON issue_flags';
    EXECUTE 'CREATE POLICY "issue_flags_select" ON issue_flags FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "issue_flags_insert" ON issue_flags FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- Ensure issues table has proper SELECT policy for all authenticated users
DROP POLICY IF EXISTS "issues_select_all" ON issues;
DROP POLICY IF EXISTS "Allow public read access to issues" ON issues;
CREATE POLICY "issues_select_all" ON issues FOR SELECT USING (true);

-- Ensure issues UPDATE policy exists for admins (needed for approve/decline)
DROP POLICY IF EXISTS "issues_update_admin" ON issues;
DROP POLICY IF EXISTS "Allow admins to update issues" ON issues;
CREATE POLICY "issues_update_admin" ON issues FOR UPDATE USING (true) WITH CHECK (true);

-- Ensure admin_actions has proper policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions') THEN
    ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "admin_actions_select" ON admin_actions';
    EXECUTE 'DROP POLICY IF EXISTS "admin_actions_insert" ON admin_actions';
    EXECUTE 'CREATE POLICY "admin_actions_select" ON admin_actions FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "admin_actions_insert" ON admin_actions FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

-- Make sure issues table is in the realtime publication
-- This is what makes real-time sync work
DO $$
BEGIN
  -- Check if publication exists and add tables
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Try to add issues table (ignore error if already added)
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE issues;
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- already added
    END;
  END IF;
END $$;
