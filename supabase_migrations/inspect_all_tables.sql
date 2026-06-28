-- ============================================================
-- Inspect all tables that CityScope app depends on.
-- Run in Supabase SQL Editor and share the output.
-- ============================================================

SELECT
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c
  ON c.table_schema = t.table_schema AND c.table_name = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'issues',
    'issue_upvotes',
    'issue_comments',
    'sos_alerts',
    'road_anomalies',
    'trips',
    'anomaly_clusters',
    'sound_scope_reports',
    'noise_samples'
  )
ORDER BY t.table_name, c.ordinal_position;

-- ============================================================
-- Inspect policies for runtime-critical tables.
-- ============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'issues',
    'issue_upvotes',
    'issue_comments',
    'sos_alerts',
    'road_anomalies',
    'trips',
    'anomaly_clusters',
    'sound_scope_reports',
    'noise_samples'
  )
ORDER BY tablename, policyname;
