-- ============================================================================
-- CityScope New Features Migration
-- Run this in your Supabase SQL editor to enable:
--   SoundScope, SwarmVerify, CivicARService, CivicTimeLapse, GreenScope, CivicSOS
-- ============================================================================

-- ========================================================================
-- 1. SoundScope — Noise samples
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.noise_samples (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  latitude       DOUBLE PRECISION NOT NULL,
  longitude      DOUBLE PRECISION NOT NULL,
  db_level       REAL NOT NULL,
  peak_db        REAL NOT NULL,
  classification TEXT NOT NULL DEFAULT 'ambient',
  severity       TEXT NOT NULL DEFAULT 'normal',
  confidence     REAL NOT NULL DEFAULT 0,
  duration       INTEGER NOT NULL DEFAULT 0,
  spectral_snapshot JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS noise_samples_location_idx
  ON public.noise_samples (latitude, longitude);
CREATE INDEX IF NOT EXISTS noise_samples_created_idx
  ON public.noise_samples (created_at DESC);

ALTER TABLE public.noise_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "noise_samples_select" ON public.noise_samples
  FOR SELECT USING (true);
CREATE POLICY "noise_samples_insert" ON public.noise_samples
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ========================================================================
-- 2. SwarmVerify — Verification quests and verifications
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.verification_quests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id               UUID,
  issue_title            TEXT NOT NULL,
  issue_category         TEXT NOT NULL DEFAULT 'other',
  latitude               DOUBLE PRECISION NOT NULL,
  longitude              DOUBLE PRECISION NOT NULL,
  radius_m               INTEGER NOT NULL DEFAULT 500,
  required_verifications INTEGER NOT NULL DEFAULT 3,
  current_verifications  INTEGER NOT NULL DEFAULT 0,
  status                 TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','expired','cancelled')),
  created_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at             TIMESTAMPTZ NOT NULL,
  reward_points          INTEGER NOT NULL DEFAULT 15
);

CREATE INDEX IF NOT EXISTS vq_location_idx ON public.verification_quests (latitude, longitude);
CREATE INDEX IF NOT EXISTS vq_status_idx   ON public.verification_quests (status, expires_at);

ALTER TABLE public.verification_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vquests_select" ON public.verification_quests FOR SELECT USING (true);
CREATE POLICY "vquests_insert" ON public.verification_quests
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "vquests_update" ON public.verification_quests
  FOR UPDATE USING (true); -- service role updates counts

CREATE TABLE IF NOT EXISTS public.verifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id            UUID NOT NULL REFERENCES public.verification_quests(id) ON DELETE CASCADE,
  verifier_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verifier_name       TEXT NOT NULL,
  photo_url           TEXT,
  latitude            DOUBLE PRECISION NOT NULL,
  longitude           DOUBLE PRECISION NOT NULL,
  distance_from_issue INTEGER NOT NULL DEFAULT 0,
  evidence_hash       TEXT NOT NULL,
  is_valid            BOOLEAN NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS verif_quest_idx    ON public.verifications (quest_id);
CREATE INDEX IF NOT EXISTS verif_verifier_idx ON public.verifications (verifier_id);
-- Prevent duplicate verifications per user per quest
CREATE UNIQUE INDEX IF NOT EXISTS verif_unique_user_quest ON public.verifications (quest_id, verifier_id);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verifications_select" ON public.verifications FOR SELECT USING (true);
CREATE POLICY "verifications_insert" ON public.verifications
  FOR INSERT WITH CHECK (auth.uid() = verifier_id);

-- ========================================================================
-- 3. CivicTimeLapse — Monitoring points and timelapse captures
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.monitoring_points (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  category    TEXT NOT NULL DEFAULT 'road',
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mp_location_idx ON public.monitoring_points (latitude, longitude);

ALTER TABLE public.monitoring_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mp_select" ON public.monitoring_points FOR SELECT USING (true);
CREATE POLICY "mp_insert" ON public.monitoring_points
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS public.timelapse_captures (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitoring_point_id  UUID NOT NULL REFERENCES public.monitoring_points(id) ON DELETE CASCADE,
  photo_url            TEXT NOT NULL,
  captured_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  captured_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decay_score          REAL NOT NULL DEFAULT 50,
  ai_analysis          TEXT,
  tags                 TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS tc_point_idx   ON public.timelapse_captures (monitoring_point_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS tc_decay_idx   ON public.timelapse_captures (decay_score);

ALTER TABLE public.timelapse_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tc_select" ON public.timelapse_captures FOR SELECT USING (true);
CREATE POLICY "tc_insert" ON public.timelapse_captures
  FOR INSERT WITH CHECK (auth.uid() = captured_by OR captured_by IS NULL);

-- ========================================================================
-- 4. GreenScope — Tree registry and health reports
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.tree_registry (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species        TEXT NOT NULL DEFAULT 'Unknown',
  common_name    TEXT,
  latitude       DOUBLE PRECISION NOT NULL,
  longitude      DOUBLE PRECISION NOT NULL,
  height_m       REAL,
  canopy_m       REAL,
  health_status  TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy','stressed','diseased','dead','unknown')),
  ndvi_estimate  REAL DEFAULT 0.5,
  registered_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  adopted_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  photo_url      TEXT,
  ai_analysis    TEXT,
  tags           TEXT[] DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tr_location_idx ON public.tree_registry (latitude, longitude);
CREATE INDEX IF NOT EXISTS tr_health_idx   ON public.tree_registry (health_status);

ALTER TABLE public.tree_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tr_select" ON public.tree_registry FOR SELECT USING (true);
CREATE POLICY "tr_insert" ON public.tree_registry
  FOR INSERT WITH CHECK (auth.uid() = registered_by OR registered_by IS NULL);
CREATE POLICY "tr_update" ON public.tree_registry
  FOR UPDATE USING (auth.uid() = registered_by OR auth.uid() = adopted_by);

CREATE TABLE IF NOT EXISTS public.tree_health_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id     UUID NOT NULL REFERENCES public.tree_registry(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'healthy',
  notes       TEXT,
  photo_url   TEXT,
  ai_analysis TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tree_health_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thr_select" ON public.tree_health_reports FOR SELECT USING (true);
CREATE POLICY "thr_insert" ON public.tree_health_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by OR reported_by IS NULL);

-- ========================================================================
-- 5. CivicSOS — Emergency alerts
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT NOT NULL DEFAULT 'accident',
  title            TEXT NOT NULL,
  description      TEXT,
  severity         TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  latitude         DOUBLE PRECISION NOT NULL,
  longitude        DOUBLE PRECISION NOT NULL,
  radius_m         INTEGER NOT NULL DEFAULT 1000,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name  TEXT NOT NULL DEFAULT 'Anonymous',
  photo_url        TEXT,
  confirmed_count  INTEGER NOT NULL DEFAULT 1,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','expired')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS sos_location_idx ON public.sos_alerts (latitude, longitude);
CREATE INDEX IF NOT EXISTS sos_status_idx   ON public.sos_alerts (status, expires_at);
CREATE INDEX IF NOT EXISTS sos_severity_idx ON public.sos_alerts (severity, created_at DESC);

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sos_select" ON public.sos_alerts FOR SELECT USING (true);
CREATE POLICY "sos_insert" ON public.sos_alerts
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
CREATE POLICY "sos_update_own" ON public.sos_alerts
  FOR UPDATE USING (auth.uid() = created_by);
-- Allow anyone to confirm (increment confirmed_count)
CREATE POLICY "sos_confirm" ON public.sos_alerts
  FOR UPDATE USING (status = 'active');

-- Enable Realtime for CivicSOS live alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;

-- ========================================================================
-- 6. Storage buckets (run if they don't exist)
-- ========================================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('sos-photos', 'sos-photos', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('verification-photos', 'verification-photos', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('timelapse-photos', 'timelapse-photos', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('green-scope', 'green-scope', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "sos_photos_select" ON storage.objects FOR SELECT USING (bucket_id = 'sos-photos');
CREATE POLICY "sos_photos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sos-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "verif_photos_select" ON storage.objects FOR SELECT USING (bucket_id = 'verification-photos');
CREATE POLICY "verif_photos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'verification-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "timelapse_photos_select" ON storage.objects FOR SELECT USING (bucket_id = 'timelapse-photos');
CREATE POLICY "timelapse_photos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'timelapse-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "green_photos_select" ON storage.objects FOR SELECT USING (bucket_id = 'green-scope');
CREATE POLICY "green_photos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'green-scope' AND auth.uid() IS NOT NULL);
