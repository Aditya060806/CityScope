-- ============================================================================
-- STEP 1: Add columns to existing tables
-- Run this first. Each statement is independent.
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_text VARCHAR(255) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"notifications": true, "publicProfile": true, "locationSharing": false}'::jsonb;

ALTER TABLE issues ADD COLUMN IF NOT EXISTS resolution_notes TEXT DEFAULT '';
