-- ============================================================================
-- CityScope Flutter Parity Consolidated Migration (Temporary Permissive Mode)
-- Date: 2026-03-25
-- Purpose:
--   1) Consolidate ad-hoc fixes into one idempotent migration.
--   2) Align schema with current app service contracts.
--   3) Keep permissive RLS temporarily for unblock/debugging.
--
-- IMPORTANT:
--   - This migration is intentionally permissive for fast stabilization.
--   - After parity is restored, apply a strict RLS hardening migration.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 0) Prerequisites
-- --------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------------------------
-- 1) TRIPS
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  status text NOT NULL DEFAULT 'recording',
  route jsonb NOT NULL DEFAULT '[]'::jsonb,
  anomaly_count integer NOT NULL DEFAULT 0,
  distance_km double precision NOT NULL DEFAULT 0,
  transport_mode text NOT NULL DEFAULT 'vehicle',
  avg_speed double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS start_time timestamptz DEFAULT now();
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS end_time timestamptz;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS status text DEFAULT 'recording';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS route jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS anomaly_count integer DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS distance_km double precision DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS transport_mode text DEFAULT 'vehicle';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS avg_speed double precision DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);

-- --------------------------------------------------------------------------
-- 2) ROAD ANOMALIES
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.road_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid,
  reporter_id uuid NOT NULL,
  anomaly_type text NOT NULL DEFAULT 'unknown',
  severity text NOT NULL DEFAULT 'medium',
  confidence double precision NOT NULL DEFAULT 0.5,
  location jsonb NOT NULL DEFAULT '{}'::jsonb,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  sensor_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'detected',
  verified_count integer NOT NULL DEFAULT 0,
  cluster_id uuid,
  device_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS trip_id uuid;
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS reporter_id uuid;
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS anomaly_type text DEFAULT 'unknown';
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS severity text DEFAULT 'medium';
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS confidence double precision DEFAULT 0.5;
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS location jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS sensor_snapshot jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS status text DEFAULT 'detected';
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS verified_count integer DEFAULT 0;
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS cluster_id uuid;
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS device_info jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.road_anomalies ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_road_anomalies_trip_id ON public.road_anomalies(trip_id);
CREATE INDEX IF NOT EXISTS idx_road_anomalies_reporter_id ON public.road_anomalies(reporter_id);
CREATE INDEX IF NOT EXISTS idx_road_anomalies_created_at ON public.road_anomalies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_road_anomalies_cluster_id ON public.road_anomalies(cluster_id);

-- --------------------------------------------------------------------------
-- 3) ANOMALY CLUSTERS
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anomaly_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centroid_lat double precision NOT NULL DEFAULT 0,
  centroid_lng double precision NOT NULL DEFAULT 0,
  anomaly_type text NOT NULL DEFAULT 'unknown',
  severity_score double precision NOT NULL DEFAULT 0.5,
  detection_count integer NOT NULL DEFAULT 1,
  detection_radius_m double precision NOT NULL DEFAULT 25,
  unique_reporters integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'unverified',
  issue_id uuid,
  first_detected timestamptz NOT NULL DEFAULT now(),
  last_detected timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS centroid_lat double precision DEFAULT 0;
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS centroid_lng double precision DEFAULT 0;
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS anomaly_type text DEFAULT 'unknown';
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS severity_score double precision DEFAULT 0.5;
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS detection_count integer DEFAULT 1;
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS detection_radius_m double precision DEFAULT 25;
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS unique_reporters integer DEFAULT 1;
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS status text DEFAULT 'unverified';
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS issue_id uuid;
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS first_detected timestamptz DEFAULT now();
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS last_detected timestamptz DEFAULT now();
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.anomaly_clusters ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_anomaly_clusters_location ON public.anomaly_clusters(centroid_lat, centroid_lng);
CREATE INDEX IF NOT EXISTS idx_anomaly_clusters_status ON public.anomaly_clusters(status);
CREATE INDEX IF NOT EXISTS idx_anomaly_clusters_issue_id ON public.anomaly_clusters(issue_id);

-- --------------------------------------------------------------------------
-- 4) NOISE SAMPLES (used by SoundScopeService)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.noise_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  latitude double precision NOT NULL DEFAULT 0,
  longitude double precision NOT NULL DEFAULT 0,
  db_level double precision NOT NULL DEFAULT 0,
  peak_db double precision NOT NULL DEFAULT 0,
  classification text NOT NULL DEFAULT 'unknown',
  severity text NOT NULL DEFAULT 'low',
  confidence double precision NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 0,
  spectral_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS latitude double precision DEFAULT 0;
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS longitude double precision DEFAULT 0;
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS db_level double precision DEFAULT 0;
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS peak_db double precision DEFAULT 0;
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS classification text DEFAULT 'unknown';
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS severity text DEFAULT 'low';
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS confidence double precision DEFAULT 0;
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS duration integer DEFAULT 0;
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS spectral_snapshot jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.noise_samples ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_noise_samples_created_at ON public.noise_samples(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_noise_samples_lat_lng ON public.noise_samples(latitude, longitude);

-- --------------------------------------------------------------------------
-- 5) SOUND SCOPE REPORTS (summary table used by Flutter experiments)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sound_scope_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  avg_db double precision NOT NULL DEFAULT 0,
  max_db double precision NOT NULL DEFAULT 0,
  min_db double precision NOT NULL DEFAULT 0,
  zone_type text NOT NULL DEFAULT 'Residential',
  violations integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  classification text NOT NULL DEFAULT 'Unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sound_scope_reports ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.sound_scope_reports ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.sound_scope_reports ADD COLUMN IF NOT EXISTS avg_db double precision DEFAULT 0;
ALTER TABLE public.sound_scope_reports ADD COLUMN IF NOT EXISTS max_db double precision DEFAULT 0;
ALTER TABLE public.sound_scope_reports ADD COLUMN IF NOT EXISTS min_db double precision DEFAULT 0;
ALTER TABLE public.sound_scope_reports ADD COLUMN IF NOT EXISTS zone_type text DEFAULT 'Residential';
ALTER TABLE public.sound_scope_reports ADD COLUMN IF NOT EXISTS violations integer DEFAULT 0;
ALTER TABLE public.sound_scope_reports ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0;
ALTER TABLE public.sound_scope_reports ADD COLUMN IF NOT EXISTS classification text DEFAULT 'Unknown';
ALTER TABLE public.sound_scope_reports ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- --------------------------------------------------------------------------
-- 6) SOS ALERTS
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'accident',
  title text NOT NULL DEFAULT 'Emergency Alert',
  description text,
  severity text NOT NULL DEFAULT 'medium',
  latitude double precision NOT NULL DEFAULT 0,
  longitude double precision NOT NULL DEFAULT 0,
  radius_m integer NOT NULL DEFAULT 1000,
  created_by uuid,
  created_by_name text NOT NULL DEFAULT 'Anonymous',
  photo_url text,
  confirmed_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);

ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS type text DEFAULT 'accident';
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS title text DEFAULT 'Emergency Alert';
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS severity text DEFAULT 'medium';
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS latitude double precision DEFAULT 0;
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS longitude double precision DEFAULT 0;
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS radius_m integer DEFAULT 1000;
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS created_by_name text DEFAULT 'Anonymous';
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS confirmed_count integer DEFAULT 1;
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.sos_alerts ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT now() + interval '24 hours';

CREATE INDEX IF NOT EXISTS idx_sos_alerts_status_expires ON public.sos_alerts(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_location ON public.sos_alerts(latitude, longitude);

-- --------------------------------------------------------------------------
-- 7) ISSUE UPVOTES
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issue_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(issue_id, user_id)
);

ALTER TABLE public.issue_upvotes ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.issue_upvotes ADD COLUMN IF NOT EXISTS issue_id uuid;
ALTER TABLE public.issue_upvotes ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.issue_upvotes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_issue_upvotes_issue_id ON public.issue_upvotes(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_upvotes_user_id ON public.issue_upvotes(user_id);

-- --------------------------------------------------------------------------
-- 8) ISSUE COMMENTS
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issue_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT 'Anonymous',
  user_avatar text,
  content text NOT NULL DEFAULT '',
  parent_id uuid,
  is_official boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.issue_comments ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.issue_comments ADD COLUMN IF NOT EXISTS issue_id uuid;
ALTER TABLE public.issue_comments ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.issue_comments ADD COLUMN IF NOT EXISTS user_name text DEFAULT 'Anonymous';
ALTER TABLE public.issue_comments ADD COLUMN IF NOT EXISTS user_avatar text;
ALTER TABLE public.issue_comments ADD COLUMN IF NOT EXISTS content text DEFAULT '';
ALTER TABLE public.issue_comments ADD COLUMN IF NOT EXISTS parent_id uuid;
ALTER TABLE public.issue_comments ADD COLUMN IF NOT EXISTS is_official boolean DEFAULT false;
ALTER TABLE public.issue_comments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.issue_comments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON public.issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_parent_id ON public.issue_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_created_at ON public.issue_comments(created_at DESC);

-- --------------------------------------------------------------------------
-- 9) Trigger helpers for updated_at
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at_now()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trips_updated_at ON public.trips;
CREATE TRIGGER trg_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_now();

DROP TRIGGER IF EXISTS trg_road_anomalies_updated_at ON public.road_anomalies;
CREATE TRIGGER trg_road_anomalies_updated_at
BEFORE UPDATE ON public.road_anomalies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_now();

DROP TRIGGER IF EXISTS trg_anomaly_clusters_updated_at ON public.anomaly_clusters;
CREATE TRIGGER trg_anomaly_clusters_updated_at
BEFORE UPDATE ON public.anomaly_clusters
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_now();

DROP TRIGGER IF EXISTS trg_issue_comments_updated_at ON public.issue_comments;
CREATE TRIGGER trg_issue_comments_updated_at
BEFORE UPDATE ON public.issue_comments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_now();

-- --------------------------------------------------------------------------
-- 10) PRAD RPCs used by RoadAnomalyService
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_or_create_cluster(
  p_anomaly_id uuid,
  p_lat numeric,
  p_lng numeric,
  p_anomaly_type text,
  p_severity text,
  p_reporter_id uuid,
  p_radius_m integer DEFAULT 25,
  p_min_count integer DEFAULT 3
)
RETURNS uuid AS $$
DECLARE
  v_cluster_id uuid;
BEGIN
  SELECT id INTO v_cluster_id
  FROM public.anomaly_clusters
  WHERE anomaly_type = p_anomaly_type
    AND status NOT IN ('resolved', 'escalated')
    AND ABS(centroid_lat - p_lat::double precision) < (p_radius_m::double precision / 111000.0)
    AND ABS(centroid_lng - p_lng::double precision) < (p_radius_m::double precision / (111000.0 * COS(RADIANS(p_lat::double precision))))
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_cluster_id IS NULL THEN
    INSERT INTO public.anomaly_clusters (
      centroid_lat, centroid_lng, anomaly_type, severity_score, detection_count, detection_radius_m, unique_reporters, status
    )
    VALUES (
      p_lat::double precision,
      p_lng::double precision,
      COALESCE(p_anomaly_type, 'unknown'),
      CASE p_severity WHEN 'critical' THEN 0.95 WHEN 'high' THEN 0.8 WHEN 'medium' THEN 0.5 ELSE 0.3 END,
      1,
      p_radius_m,
      1,
      'unverified'
    )
    RETURNING id INTO v_cluster_id;
  ELSE
    UPDATE public.anomaly_clusters
    SET
      detection_count = detection_count + 1,
      last_detected = now(),
      unique_reporters = unique_reporters + 1,
      status = CASE WHEN detection_count + 1 >= p_min_count THEN 'probable' ELSE status END
    WHERE id = v_cluster_id;
  END IF;

  UPDATE public.road_anomalies
  SET cluster_id = v_cluster_id,
      status = 'clustered'
  WHERE id = p_anomaly_id;

  RETURN v_cluster_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.verify_anomaly_cluster(
  p_cluster_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE public.anomaly_clusters
  SET
    status = 'verified',
    detection_count = detection_count + 1,
    updated_at = now(),
    last_detected = now()
  WHERE id = p_cluster_id;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- 11) Temporary permissive RLS policies
-- --------------------------------------------------------------------------
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noise_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_scope_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'trips', 'road_anomalies', 'anomaly_clusters', 'noise_samples',
        'sound_scope_reports', 'sos_alerts', 'issue_upvotes', 'issue_comments'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
  END LOOP;
END $$;

CREATE POLICY trips_all_permissive ON public.trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY road_anomalies_all_permissive ON public.road_anomalies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY anomaly_clusters_all_permissive ON public.anomaly_clusters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY noise_samples_all_permissive ON public.noise_samples FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY sound_scope_reports_all_permissive ON public.sound_scope_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY sos_alerts_all_permissive ON public.sos_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY issue_upvotes_all_permissive ON public.issue_upvotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY issue_comments_all_permissive ON public.issue_comments FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------------
-- 12) Realtime registration
-- --------------------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.road_anomalies;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.anomaly_clusters;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --------------------------------------------------------------------------
-- 13) Post-run diagnostics (run manually after migration)
-- --------------------------------------------------------------------------
-- SELECT table_name, column_name, data_type FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'trips', 'road_anomalies', 'anomaly_clusters', 'noise_samples',
--     'sound_scope_reports', 'sos_alerts', 'issue_upvotes', 'issue_comments'
--   )
-- ORDER BY table_name, ordinal_position;
--
-- SELECT schemaname, tablename, policyname, permissive, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'trips', 'road_anomalies', 'anomaly_clusters', 'noise_samples',
--     'sound_scope_reports', 'sos_alerts', 'issue_upvotes', 'issue_comments'
--   )
-- ORDER BY tablename, policyname;
