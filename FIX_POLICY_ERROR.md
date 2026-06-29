# 🔧 Fix: "Policy Already Exists" Error

## Problem

When running `blockchain-schema-migration.sql`, you're getting:
```
ERROR: 42710: policy "Users can view own wallet" for table "user_wallets" already exists
```

This happens when the migration was partially run before, leaving some policies in place.

## ✅ Quick Fix (Option 1: Recommended)

1. **Run the fix script first:**
   - Open Supabase SQL Editor
   - Copy and run the contents of `fix-existing-policies.sql`
   - This will safely drop any existing policies

2. **Then run the full migration:**
   - Run `blockchain-schema-migration.sql` again
   - It will now create all policies correctly

## ✅ Option 2: Use Updated Migration Script

The `blockchain-schema-migration.sql` has been updated to handle existing policies automatically. 

**Just run the updated migration script directly** - it will drop existing policies before creating new ones.

## ✅ Option 3: Manual Fix

If you prefer to fix manually, run this in Supabase SQL Editor:

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own wallet" ON user_wallets;
DROP POLICY IF EXISTS "Users can manage own wallet" ON user_wallets;
DROP POLICY IF EXISTS "Users can view own transactions" ON blockchain_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON blockchain_transactions;
DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
DROP POLICY IF EXISTS "System can insert activities" ON user_activities;
```

Then run the migration script again.

## 🔍 Verify Everything Works

After running the migration, verify with:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_wallets', 'blockchain_transactions', 'user_activities');

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('user_wallets', 'blockchain_transactions', 'user_activities')
ORDER BY tablename, policyname;
```

You should see:
- ✅ 3 tables
- ✅ 6 policies (2 per table)

## ✅ What Changed

The migration script has been updated to be **idempotent** (safe to run multiple times):
- ✅ Drops existing policies before creating new ones
- ✅ Uses `DROP TRIGGER IF EXISTS` for triggers
- ✅ Uses `CREATE OR REPLACE` for functions

## 🎯 Next Steps

1. Run `fix-existing-policies.sql` (or the updated migration script)
2. Verify tables and policies were created
3. Refresh your app
4. The 406 error should be gone!
