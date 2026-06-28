-- ============================================================================
-- STEP 3: Create new tables (partners, wallets, blockchain, push, comments, messages, admin_actions)
-- Run AFTER step 2 succeeds.
-- ============================================================================

-- PARTNERS
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type VARCHAR(50) NOT NULL DEFAULT 'artisan',
  image_url TEXT DEFAULT '',
  website_url VARCHAR(500) DEFAULT '',
  contact_link VARCHAR(500) DEFAULT '',
  instagram_url VARCHAR(500) DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  specialties TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);

-- USER WALLETS
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

-- BLOCKCHAIN TRANSACTIONS
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
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_tx_user ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);

-- PUSH SUBSCRIPTIONS
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

-- ISSUE COMMENTS
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES issue_comments(id) ON DELETE CASCADE,
  upvotes INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_user ON issue_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_parent ON issue_comments(parent_id);

-- USER MESSAGES
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

-- ADMIN ACTIONS
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) NOT NULL,
  admin_name VARCHAR(255) NOT NULL DEFAULT '',
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  action_type VARCHAR(30) NOT NULL,
  reason TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_issue ON admin_actions(issue_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);
