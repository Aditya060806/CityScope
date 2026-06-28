-- ============================================================================
-- STEP 6: RLS policies for NEW tables only (partners, wallets, blockchain,
--         push_subscriptions, issue_comments, user_messages, admin_actions)
-- Run AFTER step 3 succeeds.
-- NOTE: rewards / user_rewards / user_activities already have RLS from base schema.
-- ============================================================================

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- PARTNERS
DROP POLICY IF EXISTS "Partners viewable by everyone" ON partners;
CREATE POLICY "Partners viewable by everyone" ON partners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Partners editable by admins" ON partners;
CREATE POLICY "Partners editable by admins" ON partners FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ISSUE COMMENTS
DROP POLICY IF EXISTS "Comments viewable by everyone" ON issue_comments;
CREATE POLICY "Comments viewable by everyone" ON issue_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Comments - users write own" ON issue_comments;
CREATE POLICY "Comments - users write own" ON issue_comments FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Comments - users update own" ON issue_comments;
CREATE POLICY "Comments - users update own" ON issue_comments FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Comments - admin manage" ON issue_comments;
CREATE POLICY "Comments - admin manage" ON issue_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- USER MESSAGES
DROP POLICY IF EXISTS "Messages - see own" ON user_messages;
CREATE POLICY "Messages - see own" ON user_messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
DROP POLICY IF EXISTS "Messages - send own" ON user_messages;
CREATE POLICY "Messages - send own" ON user_messages FOR INSERT WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "Messages - update own received" ON user_messages;
CREATE POLICY "Messages - update own received" ON user_messages FOR UPDATE USING (receiver_id = auth.uid());

-- ADMIN ACTIONS
DROP POLICY IF EXISTS "Admin actions - admin only read" ON admin_actions;
CREATE POLICY "Admin actions - admin only read" ON admin_actions FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator')));
DROP POLICY IF EXISTS "Admin actions - admin only write" ON admin_actions;
CREATE POLICY "Admin actions - admin only write" ON admin_actions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

-- PUSH SUBSCRIPTIONS
DROP POLICY IF EXISTS "Push subs - own data" ON push_subscriptions;
CREATE POLICY "Push subs - own data" ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- USER WALLETS
DROP POLICY IF EXISTS "Wallets - own data" ON user_wallets;
CREATE POLICY "Wallets - own data" ON user_wallets FOR ALL USING (user_id = auth.uid());

-- BLOCKCHAIN TRANSACTIONS
DROP POLICY IF EXISTS "Blockchain - own data" ON blockchain_transactions;
CREATE POLICY "Blockchain - own data" ON blockchain_transactions FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Blockchain - admin access" ON blockchain_transactions;
CREATE POLICY "Blockchain - admin access" ON blockchain_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
