-- ============================================================================
-- STEP 4: Patch existing rewards / user_rewards / user_activities tables
-- These tables already exist from base schema. We add missing columns only.
-- Run AFTER step 3 succeeds.
-- ============================================================================

-- REWARDS — add columns missing from base schema
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT -1;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS redeemed_count INTEGER DEFAULT 0;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS expiry_days INTEGER;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS terms_conditions TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_rewards_partner_id ON rewards(partner_id);

-- USER REWARDS — add columns missing from base schema
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(100);
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS partner_contact_info JSONB DEFAULT '{}';

-- USER ACTIVITIES — add columns missing from base schema
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
