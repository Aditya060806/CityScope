-- ============================================================================
-- CityScope: Database Migration
-- The single-file migration had persistent errors in Supabase SQL Editor.
-- Use these separate step files instead — run each one individually:
--
--   migration-step1-columns.sql       → ADD COLUMN on users + issues
--   migration-step2-verification.sql  → verification_status + CHECK constraint
--   migration-step3-tables.sql        → CREATE new tables (partners, comments, etc.)
--   migration-step4-patch-existing.sql → ALTER existing rewards/user_rewards/user_activities
--   migration-step5-triggers.sql      → updated_at triggers
--   migration-step6-rls.sql           → RLS for new tables
--   migration-step7-rewards-rls.sql   → RLS update for rewards/user_rewards
--
-- Run them in order 1 → 7, one at a time.
-- If one fails, it tells you exactly which section is the problem.
-- ============================================================================


-- ============================================================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Users table: add bio, location_text, phone, preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_text VARCHAR(255) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"notifications": true, "publicProfile": true, "locationSharing": false}'::jsonb;

-- Issues table: add resolution_notes, verification_status
ALTER TABLE issues ADD COLUMN IF NOT EXISTS resolution_notes TEXT DEFAULT '';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending_review' 
  CHECK (verification_status IN ('pending_review', 'approved', 'declined_fake', 'escalated'));

-- ============================================================================
-- 2. PARTNERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type VARCHAR(50) NOT NULL DEFAULT 'artisan' CHECK (type IN ('artisan', 'recycler', 'eco-innovator', 'corporate', 'government')),
  image_url TEXT DEFAULT '',
  website_url VARCHAR(500) DEFAULT '',
  contact_link VARCHAR(500) DEFAULT '',
  instagram_url VARCHAR(500) DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  specialties TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  total_rewards_offered INTEGER DEFAULT 0,
  total_redemptions INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);

-- ============================================================================
-- 3. REWARDS TABLE
-- (Table may already exist from base schema — add missing columns safely)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category VARCHAR(50) NOT NULL DEFAULT 'recognition',
  points_required INTEGER NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  stock_quantity INTEGER DEFAULT -1,
  redeemed_count INTEGER DEFAULT 0,
  expiry_days INTEGER DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  terms_conditions TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if the table already existed with a different schema
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT -1;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS redeemed_count INTEGER DEFAULT 0;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS expiry_days INTEGER DEFAULT NULL;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS terms_conditions TEXT DEFAULT '';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_rewards_partner_id ON rewards(partner_id);
CREATE INDEX IF NOT EXISTS idx_rewards_points ON rewards(points_required);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON rewards(is_active);

-- ============================================================================
-- 4. USER REWARDS (Redemptions) TABLE
-- (Table may already exist from base schema — add missing columns safely)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE NOT NULL,
  points_spent INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  voucher_code VARCHAR(100),
  partner_contact_info JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already existed
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(100);
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS partner_contact_info JSONB DEFAULT '{}';
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);

-- ============================================================================
-- 5. USER WALLETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  chain_id INTEGER DEFAULT 8453,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(wallet_address);

-- ============================================================================
-- 6. BLOCKCHAIN TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_wallet_address VARCHAR(42) NOT NULL,
  issue_id UUID REFERENCES issues(id),
  reward_id UUID REFERENCES rewards(id),
  action_type VARCHAR(50) NOT NULL,
  points_amount INTEGER NOT NULL DEFAULT 0,
  tx_hash VARCHAR(66) UNIQUE,
  block_number BIGINT,
  chain_id INTEGER DEFAULT 8453,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'reverted')),
  gas_used VARCHAR(50),
  gas_price VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_tx_user ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON blockchain_transactions(status);

-- ============================================================================
-- 7. PUSH SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL DEFAULT '{}',
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON push_subscriptions(user_id);

-- ============================================================================
-- 8. ISSUE COMMENTS TABLE (New Feature)
-- ============================================================================

CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false, -- Admin/department response
  parent_id UUID REFERENCES issue_comments(id) ON DELETE CASCADE, -- Threaded replies
  upvotes INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_user ON issue_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_parent ON issue_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_created ON issue_comments(created_at);

-- ============================================================================
-- 9. USER MESSAGES TABLE (New Feature)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  sender_name VARCHAR(255) NOT NULL DEFAULT '',
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_name VARCHAR(255) NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_messages_sender ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_receiver ON user_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_read ON user_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_user_messages_created ON user_messages(created_at);

-- ============================================================================
-- 10. ADMIN ACTIONS TABLE (New Feature)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) NOT NULL,
  admin_name VARCHAR(255) NOT NULL DEFAULT '',
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('approve', 'approved', 'decline', 'declined_fake', 'flag_fake', 'escalate', 'escalated', 'reassign', 'close', 'reopen')),
  reason TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_issue ON admin_actions(issue_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);

-- ============================================================================
-- 11. USER ACTIVITIES TABLE (ensure it exists with all needed columns)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'report_submitted',
  description TEXT NOT NULL DEFAULT '',
  points INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if this table already existed with a different schema
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
-- Note: base schema uses points_change; we add points separately above.
-- Both columns may coexist; the app reads from 'points'.

CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at);

-- ============================================================================
-- 12. REALTIME — enable via Supabase Dashboard (two ways):
--
-- OPTION A — Table Editor (recommended):
--   1. Go to Supabase Dashboard → Table Editor
--   2. Click each table: issue_comments, user_messages, admin_actions, partners
--   3. Toggle "Realtime" ON in the top-right of the table view
--
-- OPTION B — Database → Replication (only if your publication is NOT FOR ALL TABLES):
--   If that page shows individual tables, toggle them on there.
--   If it only shows "All Tables", realtime is already enabled everywhere.
-- ============================================================================

-- ============================================================================
-- 13. TRIGGERS FOR updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rewards_updated_at ON rewards;
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_push_subs_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subs_updated_at BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_issue_comments_updated_at ON issue_comments;
CREATE TRIGGER update_issue_comments_updated_at BEFORE UPDATE ON issue_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON user_wallets;
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Partners: readable by all, writable by admins
DROP POLICY IF EXISTS "Partners viewable by everyone" ON partners;
CREATE POLICY "Partners viewable by everyone" ON partners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Partners editable by admins" ON partners;
CREATE POLICY "Partners editable by admins" ON partners FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Rewards: readable by all, writable by admins
-- (drop base-schema policy name too if it exists)
DROP POLICY IF EXISTS "Rewards are publicly readable" ON rewards;
DROP POLICY IF EXISTS "Rewards viewable by everyone" ON rewards;
CREATE POLICY "Rewards viewable by everyone" ON rewards FOR SELECT USING (true);
DROP POLICY IF EXISTS "Rewards editable by admins" ON rewards;
CREATE POLICY "Rewards editable by admins" ON rewards FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- User rewards: users see their own, admins see all
-- (drop base-schema policy name too if it exists)
DROP POLICY IF EXISTS "User rewards are readable by owner and admins" ON user_rewards;
DROP POLICY IF EXISTS "User rewards - own data" ON user_rewards;
CREATE POLICY "User rewards - own data" ON user_rewards FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "User rewards - insert own" ON user_rewards;
CREATE POLICY "User rewards - insert own" ON user_rewards FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "User rewards - admin access" ON user_rewards;
CREATE POLICY "User rewards - admin access" ON user_rewards FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Issue comments: readable by all, users write their own
DROP POLICY IF EXISTS "Comments viewable by everyone" ON issue_comments;
CREATE POLICY "Comments viewable by everyone" ON issue_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Comments - users write own" ON issue_comments;
CREATE POLICY "Comments - users write own" ON issue_comments FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Comments - users update own" ON issue_comments;
CREATE POLICY "Comments - users update own" ON issue_comments FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Comments - admin manage" ON issue_comments;
CREATE POLICY "Comments - admin manage" ON issue_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- User messages: users see their own sent/received
DROP POLICY IF EXISTS "Messages - see own" ON user_messages;
CREATE POLICY "Messages - see own" ON user_messages FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);
DROP POLICY IF EXISTS "Messages - send own" ON user_messages;
CREATE POLICY "Messages - send own" ON user_messages FOR INSERT WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "Messages - update own received" ON user_messages;
CREATE POLICY "Messages - update own received" ON user_messages FOR UPDATE USING (receiver_id = auth.uid());

-- Admin actions: only admins
DROP POLICY IF EXISTS "Admin actions - admin only read" ON admin_actions;
CREATE POLICY "Admin actions - admin only read" ON admin_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);
DROP POLICY IF EXISTS "Admin actions - admin only write" ON admin_actions;
CREATE POLICY "Admin actions - admin only write" ON admin_actions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- User activities: users see own, admins see all
-- (drop base-schema policy names too)
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;
DROP POLICY IF EXISTS "Admins can view all activities" ON user_activities;
DROP POLICY IF EXISTS "Activities - own data" ON user_activities;
CREATE POLICY "Activities - own data" ON user_activities FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Activities - insert own" ON user_activities;
CREATE POLICY "Activities - insert own" ON user_activities FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Activities - admin access" ON user_activities;
CREATE POLICY "Activities - admin access" ON user_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Push subscriptions: users manage own
DROP POLICY IF EXISTS "Push subs - own data" ON push_subscriptions;
CREATE POLICY "Push subs - own data" ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- User wallets: users manage own
DROP POLICY IF EXISTS "Wallets - own data" ON user_wallets;
CREATE POLICY "Wallets - own data" ON user_wallets FOR ALL USING (user_id = auth.uid());

-- Blockchain txns: users see own, admins see all
DROP POLICY IF EXISTS "Blockchain - own data" ON blockchain_transactions;
CREATE POLICY "Blockchain - own data" ON blockchain_transactions FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Blockchain - admin access" ON blockchain_transactions;
CREATE POLICY "Blockchain - admin access" ON blockchain_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- Done! All tables created with indexes, triggers, realtime, and RLS policies
-- ============================================================================
