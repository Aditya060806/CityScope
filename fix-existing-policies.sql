-- Quick Fix: Drop existing policies to allow migration to complete
-- Run this if you're getting "policy already exists" errors

-- ============================================================================
-- Drop existing policies (safe to run multiple times)
-- ============================================================================

-- User Wallets Policies
DROP POLICY IF EXISTS "Users can view own wallet" ON user_wallets;
DROP POLICY IF EXISTS "Users can manage own wallet" ON user_wallets;

-- Blockchain Transactions Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON blockchain_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON blockchain_transactions;

-- User Activities Policies
DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
DROP POLICY IF EXISTS "System can insert activities" ON user_activities;

-- ============================================================================
-- Now run blockchain-schema-migration.sql again
-- ============================================================================

-- After dropping policies, run the full migration script again
-- It will recreate the policies correctly
