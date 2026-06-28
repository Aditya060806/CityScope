-- ============================================================================
-- STEP 7: Update RLS for rewards / user_rewards (already existed in base schema)
-- Run AFTER step 6 succeeds.
-- ============================================================================

-- REWARDS — replace base schema policy with one that allows all to read
DROP POLICY IF EXISTS "Rewards are publicly readable" ON rewards;
DROP POLICY IF EXISTS "Rewards viewable by everyone" ON rewards;
CREATE POLICY "Rewards viewable by everyone" ON rewards FOR SELECT USING (true);
DROP POLICY IF EXISTS "Rewards editable by admins" ON rewards;
CREATE POLICY "Rewards editable by admins" ON rewards FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- USER REWARDS — replace base schema policy
DROP POLICY IF EXISTS "User rewards are readable by owner and admins" ON user_rewards;
DROP POLICY IF EXISTS "User rewards - own data" ON user_rewards;
CREATE POLICY "User rewards - own data" ON user_rewards FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "User rewards - insert own" ON user_rewards;
CREATE POLICY "User rewards - insert own" ON user_rewards FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "User rewards - admin access" ON user_rewards;
CREATE POLICY "User rewards - admin access" ON user_rewards FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
