-- admin_actions uses admin_id instead of user_id
-- Run this alone in a separate SQL Editor execution
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
