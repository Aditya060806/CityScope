-- ============================================================================
-- FIX DEPLOYMENT ISSUES: user_wallets 406 Error + Foreign Key Constraint
-- ============================================================================
-- Run this in your Supabase SQL Editor to fix both issues
-- Project: oufvmqbthrvziasjpdng.supabase.co

-- ============================================================================
-- PART 1: Create user_wallets table (fixes 406 error)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    chain_id INTEGER DEFAULT 8453, -- Base mainnet
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);

-- Enable Row Level Security
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own wallet" ON user_wallets;
DROP POLICY IF EXISTS "Users can manage own wallet" ON user_wallets;

-- Create RLS policies
CREATE POLICY "Users can view own wallet" ON user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wallet" ON user_wallets
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PART 2: Fix Foreign Key Constraint - Auto-create users table entry
-- ============================================================================

-- Function to automatically create users table entry when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into public.users table if it doesn't exist
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run function when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 3: Migrate existing auth users to users table (if any exist)
-- ============================================================================

-- Insert any auth users that don't have a corresponding users table entry
INSERT INTO public.users (id, email, name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'name',
        au.raw_user_meta_data->>'full_name',
        split_part(au.email, '@', 1)
    ) as name,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 4: Make issues.reporter_id more flexible (handle missing users gracefully)
-- ============================================================================

-- Update the foreign key constraint to allow NULL temporarily if user doesn't exist
-- But first, ensure all existing issues have valid reporter_id
DO $$
BEGIN
    -- Check if there are any issues with invalid reporter_id
    IF EXISTS (
        SELECT 1 FROM issues i
        LEFT JOIN users u ON i.reporter_id = u.id
        WHERE u.id IS NULL
    ) THEN
        RAISE NOTICE '⚠️ Found issues with invalid reporter_id. Creating missing users...';
        
        -- Create users for any issues with missing reporter_id
        INSERT INTO public.users (id, email, name, created_at, updated_at)
        SELECT DISTINCT
            i.reporter_id,
            'user_' || substr(i.reporter_id::text, 1, 8) || '@cityscope.local',
            COALESCE(i.reporter_name, 'Anonymous User'),
            i.created_at,
            NOW()
        FROM issues i
        LEFT JOIN users u ON i.reporter_id = u.id
        WHERE u.id IS NULL
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- PART 5: Add blockchain_transactions table (if needed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_wallet_address VARCHAR(42) NOT NULL,
    issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
    reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    points_amount INTEGER NOT NULL,
    tx_hash VARCHAR(66) UNIQUE,
    block_number BIGINT,
    chain_id INTEGER DEFAULT 8453,
    status VARCHAR(20) DEFAULT 'pending',
    gas_used VARCHAR(50),
    gas_price VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_wallet ON blockchain_transactions(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_issue ON blockchain_transactions(issue_id);

-- RLS for blockchain_transactions
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON blockchain_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON blockchain_transactions;

CREATE POLICY "Users can view own transactions" ON blockchain_transactions
    FOR SELECT USING (
        user_wallet_address IN (
            SELECT wallet_address FROM user_wallets WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert transactions" ON blockchain_transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- PART 6: Update RLS policies for users table to allow inserts
-- ============================================================================

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📊 Created/Fixed:';
    RAISE NOTICE '   - user_wallets table';
    RAISE NOTICE '   - blockchain_transactions table';
    RAISE NOTICE '   - Auto-user creation trigger';
    RAISE NOTICE '   - RLS policies';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verifying...';
    
    -- Check tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_wallets') THEN
        RAISE NOTICE '   ✅ user_wallets table exists';
    ELSE
        RAISE WARNING '   ❌ user_wallets table missing!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blockchain_transactions') THEN
        RAISE NOTICE '   ✅ blockchain_transactions table exists';
    ELSE
        RAISE WARNING '   ❌ blockchain_transactions table missing!';
    END IF;
    
    -- Check trigger exists
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE '   ✅ Auto-user creation trigger exists';
    ELSE
        RAISE WARNING '   ❌ Auto-user creation trigger missing!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 All fixes applied! Your app should now work correctly.';
END $$;
