-- ============================================================================
-- PRAD — Passive Road Anomaly Detection — Database Migration
-- CityScope Extension
-- ============================================================================
-- Run this migration AFTER the main supabase-schema.sql has been applied.
-- Requires: uuid-ossp, postgis extensions (already enabled in main schema)
-- ============================================================================

-- ============================================================================
-- 1. TRIPS TABLE — Recording sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS trips (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time        TIMESTAMP WITH TIME ZONE,
    status          VARCHAR(20) NOT NULL DEFAULT 'recording'
                        CHECK (status IN ('recording', 'paused', 'completed')),
    route           JSONB DEFAULT '[]'::JSONB,
    anomaly_count   INTEGER NOT NULL DEFAULT 0,
    distance_km     DECIMAL(10, 3) DEFAULT 0,
    transport_mode  VARCHAR(20) DEFAULT 'vehicle'
                        CHECK (transport_mode IN ('stationary', 'walking', 'cycling', 'vehicle')),
    avg_speed       DECIMAL(6, 2) DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);

-- ============================================================================
-- 2. ROAD ANOMALIES TABLE — Individual detection events
-- ============================================================================
CREATE TABLE IF NOT EXISTS road_anomalies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    reporter_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    anomaly_type    VARCHAR(30) NOT NULL DEFAULT 'unknown'
                        CHECK (anomaly_type IN (
                            'pothole', 'speed_breaker', 'rough_road',
                            'manhole', 'railway_crossing', 'unknown'
                        )),
    severity        VARCHAR(20) NOT NULL DEFAULT 'medium'
                        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    confidence      DECIMAL(5, 4) NOT NULL DEFAULT 0.5
                        CHECK (confidence >= 0 AND confidence <= 1),
    location        JSONB NOT NULL,                       -- {latitude, longitude, address?}
    features        JSONB DEFAULT '{}'::JSONB,            -- AnomalyFeatures
    sensor_snapshot JSONB DEFAULT '[]'::JSONB,            -- SensorReading[]  ±0.5 s
    status          VARCHAR(20) NOT NULL DEFAULT 'detected'
                        CHECK (status IN (
                            'detected', 'classified', 'clustered',
                            'verified', 'resolved', 'dismissed'
                        )),
    verified_count  INTEGER NOT NULL DEFAULT 0,
    cluster_id      UUID,                                 -- FK added after cluster table
    device_info     JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_road_anomalies_trip_id      ON road_anomalies(trip_id);
CREATE INDEX IF NOT EXISTS idx_road_anomalies_reporter_id  ON road_anomalies(reporter_id);
CREATE INDEX IF NOT EXISTS idx_road_anomalies_anomaly_type ON road_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_road_anomalies_status       ON road_anomalies(status);
CREATE INDEX IF NOT EXISTS idx_road_anomalies_created_at   ON road_anomalies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_road_anomalies_location     ON road_anomalies USING GIN (location);
CREATE INDEX IF NOT EXISTS idx_road_anomalies_cluster_id   ON road_anomalies(cluster_id);

-- ============================================================================
-- 3. ANOMALY CLUSTERS TABLE — Aggregated detections
-- ============================================================================
CREATE TABLE IF NOT EXISTS anomaly_clusters (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    centroid_lat        DECIMAL(10, 7) NOT NULL,
    centroid_lng        DECIMAL(10, 7) NOT NULL,
    anomaly_type        VARCHAR(30) NOT NULL DEFAULT 'unknown',
    severity_score      DECIMAL(3, 2) NOT NULL DEFAULT 0.5
                            CHECK (severity_score >= 0 AND severity_score <= 1),
    detection_count     INTEGER NOT NULL DEFAULT 1,
    detection_radius_m  INTEGER NOT NULL DEFAULT 25,
    unique_reporters    INTEGER NOT NULL DEFAULT 1,
    status              VARCHAR(20) NOT NULL DEFAULT 'unverified'
                            CHECK (status IN (
                                'unverified', 'probable', 'verified',
                                'escalated', 'resolved'
                            )),
    issue_id            UUID REFERENCES issues(id) ON DELETE SET NULL,
    first_detected      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_detected       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add FK from road_anomalies → anomaly_clusters (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_road_anomalies_cluster'
    ) THEN
        ALTER TABLE road_anomalies
            ADD CONSTRAINT fk_road_anomalies_cluster
            FOREIGN KEY (cluster_id) REFERENCES anomaly_clusters(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_anomaly_clusters_location
    ON anomaly_clusters(centroid_lat, centroid_lng);
CREATE INDEX IF NOT EXISTS idx_anomaly_clusters_status
    ON anomaly_clusters(status);
CREATE INDEX IF NOT EXISTS idx_anomaly_clusters_issue_id
    ON anomaly_clusters(issue_id);

-- ============================================================================
-- 4. ROAD HEALTH SEGMENTS — Precomputed road quality for map overlays
-- ============================================================================
CREATE TABLE IF NOT EXISTS road_health_segments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_location    JSONB NOT NULL,                    -- {latitude, longitude}
    end_location      JSONB NOT NULL,
    health_score      DECIMAL(5, 2) NOT NULL DEFAULT 100
                          CHECK (health_score >= 0 AND health_score <= 100),
    anomaly_density   DECIMAL(8, 4) DEFAULT 0,           -- anomalies per km
    segment_length_m  INTEGER NOT NULL DEFAULT 0,
    last_updated      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_road_health_segments_score
    ON road_health_segments(health_score);

-- ============================================================================
-- 5. TRIGGERS — auto-update updated_at
-- ============================================================================

-- Reuse existing trigger function update_updated_at_column()
-- (Defined in main supabase-schema.sql)

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_road_anomalies_updated_at ON road_anomalies;
CREATE TRIGGER update_road_anomalies_updated_at
    BEFORE UPDATE ON road_anomalies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_anomaly_clusters_updated_at ON anomaly_clusters;
CREATE TRIGGER update_anomaly_clusters_updated_at
    BEFORE UPDATE ON anomaly_clusters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_road_health_segments_updated_at ON road_health_segments;
CREATE TRIGGER update_road_health_segments_updated_at
    BEFORE UPDATE ON road_health_segments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. TRIGGER — Auto-increment trip anomaly_count on anomaly insert
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_trip_anomaly_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trips
    SET anomaly_count = anomaly_count + 1
    WHERE id = NEW.trip_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_trip_anomaly_count ON road_anomalies;
CREATE TRIGGER trigger_increment_trip_anomaly_count
    AFTER INSERT ON road_anomalies
    FOR EACH ROW
    EXECUTE FUNCTION increment_trip_anomaly_count();

-- ============================================================================
-- 7. FUNCTION — Find or create cluster for a new anomaly
-- ============================================================================
CREATE OR REPLACE FUNCTION find_or_create_cluster(
    p_anomaly_id   UUID,
    p_lat          DECIMAL,
    p_lng          DECIMAL,
    p_anomaly_type VARCHAR,
    p_severity     VARCHAR,
    p_reporter_id  UUID,
    p_radius_m     INTEGER DEFAULT 25,
    p_min_count    INTEGER DEFAULT 3
)
RETURNS UUID AS $$
DECLARE
    v_cluster_id  UUID;
    v_count       INTEGER;
    v_reporters   INTEGER;
BEGIN
    -- Find existing cluster within radius
    SELECT id INTO v_cluster_id
    FROM anomaly_clusters
    WHERE anomaly_type = p_anomaly_type
      AND status NOT IN ('resolved', 'escalated')
      AND ABS(centroid_lat - p_lat) < (p_radius_m::DECIMAL / 111000)
      AND ABS(centroid_lng - p_lng) < (p_radius_m::DECIMAL / (111000 * COS(RADIANS(p_lat))))
    ORDER BY
        SQRT(POWER(centroid_lat - p_lat, 2) + POWER(centroid_lng - p_lng, 2))
    LIMIT 1;

    IF v_cluster_id IS NOT NULL THEN
        -- Update existing cluster
        UPDATE anomaly_clusters SET
            detection_count  = detection_count + 1,
            last_detected    = NOW(),
            -- Running average centroid
            centroid_lat     = (centroid_lat * detection_count + p_lat) / (detection_count + 1),
            centroid_lng     = (centroid_lng * detection_count + p_lng) / (detection_count + 1),
            severity_score   = LEAST(1.0, severity_score + 0.05),
            unique_reporters = (
                SELECT COUNT(DISTINCT reporter_id)
                FROM road_anomalies
                WHERE cluster_id = v_cluster_id
            ) + 1
        WHERE id = v_cluster_id
        RETURNING detection_count INTO v_count;

        -- Promote cluster status based on count
        IF v_count >= p_min_count THEN
            UPDATE anomaly_clusters
            SET status = 'probable'
            WHERE id = v_cluster_id AND status = 'unverified';
        END IF;
    ELSE
        -- Create new cluster
        INSERT INTO anomaly_clusters (
            centroid_lat, centroid_lng, anomaly_type,
            severity_score, detection_count, detection_radius_m,
            unique_reporters, status
        )
        VALUES (
            p_lat, p_lng, p_anomaly_type,
            CASE p_severity
                WHEN 'critical' THEN 0.95
                WHEN 'high'   THEN 0.8
                WHEN 'medium' THEN 0.5
                ELSE 0.3
            END,
            1, p_radius_m, 1, 'unverified'
        )
        RETURNING id INTO v_cluster_id;
    END IF;

    -- Link anomaly to cluster
    UPDATE road_anomalies
    SET cluster_id = v_cluster_id, status = 'clustered'
    WHERE id = p_anomaly_id;

    RETURN v_cluster_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. ROW-LEVEL SECURITY
-- ============================================================================

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_health_segments ENABLE ROW LEVEL SECURITY;

-- Trips: users can CRUD their own, admins all
DROP POLICY IF EXISTS trips_select ON trips;
CREATE POLICY trips_select ON trips FOR SELECT USING (true);
DROP POLICY IF EXISTS trips_insert ON trips;
CREATE POLICY trips_insert ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS trips_update ON trips;
CREATE POLICY trips_update ON trips FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS trips_delete ON trips;
CREATE POLICY trips_delete ON trips FOR DELETE USING (auth.uid() = user_id);

-- Road anomalies: anyone can read, users insert their own
DROP POLICY IF EXISTS road_anomalies_select ON road_anomalies;
CREATE POLICY road_anomalies_select ON road_anomalies FOR SELECT USING (true);
DROP POLICY IF EXISTS road_anomalies_insert ON road_anomalies;
CREATE POLICY road_anomalies_insert ON road_anomalies FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS road_anomalies_update ON road_anomalies;
CREATE POLICY road_anomalies_update ON road_anomalies FOR UPDATE
    USING (auth.uid() = reporter_id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Clusters: public read, system/admin write
DROP POLICY IF EXISTS anomaly_clusters_select ON anomaly_clusters;
CREATE POLICY anomaly_clusters_select ON anomaly_clusters FOR SELECT USING (true);
DROP POLICY IF EXISTS anomaly_clusters_insert ON anomaly_clusters;
CREATE POLICY anomaly_clusters_insert ON anomaly_clusters FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anomaly_clusters_update ON anomaly_clusters;
CREATE POLICY anomaly_clusters_update ON anomaly_clusters FOR UPDATE USING (true);

-- Road health: public read, system write
DROP POLICY IF EXISTS road_health_select ON road_health_segments;
CREATE POLICY road_health_select ON road_health_segments FOR SELECT USING (true);
DROP POLICY IF EXISTS road_health_insert ON road_health_segments;
CREATE POLICY road_health_insert ON road_health_segments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS road_health_update ON road_health_segments;
CREATE POLICY road_health_update ON road_health_segments FOR UPDATE USING (true);

-- ============================================================================
-- 9. ENABLE REALTIME (optional — for live map updates)
-- ============================================================================

-- Idempotent: ignore if already added
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE road_anomalies;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE anomaly_clusters;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
