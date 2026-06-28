-- ============================================================================
-- CityScope Flutter Parity: temporary cleanup for issues policy conflicts
-- Date: 2026-03-25
-- Purpose:
--   Resolve overlapping/conflicting policies on public.issues while app is in
--   temporary permissive unblock mode.
-- ============================================================================

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Remove known legacy/conflicting policies detected in inspect output
DROP POLICY IF EXISTS "Admins can update all issues" ON public.issues;
DROP POLICY IF EXISTS "Allow authenticated users to create issues" ON public.issues;
DROP POLICY IF EXISTS "Allow users to update own issues" ON public.issues;
DROP POLICY IF EXISTS "Issues are publicly readable" ON public.issues;
DROP POLICY IF EXISTS "issues_select_all" ON public.issues;
DROP POLICY IF EXISTS "issues_update_admin" ON public.issues;

-- Add one deterministic temporary permissive policy for parity debugging
DROP POLICY IF EXISTS "issues_all_permissive" ON public.issues;
CREATE POLICY "issues_all_permissive"
  ON public.issues
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional sanity check
-- SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname='public' AND tablename='issues'
-- ORDER BY policyname;
