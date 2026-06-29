# 🚀 Quick Fix Guide: Deployment Issues (406 Error + Foreign Key Constraint)

## 🚨 Problems

1. **406 Error**: `GET .../user_wallets?select=wallet_address&user_id=eq... 406 (Not Acceptable)`
   - The `user_wallets` table doesn't exist in your Supabase database

2. **Foreign Key Constraint Error**: When users try to report issues
   - Users exist in `auth.users` but not in `public.users` table
   - The `issues.reporter_id` foreign key fails because user doesn't exist

## ✅ Solution: Run the Fix Script

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project (the one with URL `oufvmqbthrvziasjpdng.supabase.co`)
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Fix Script

1. Open the file `fix-deployment-issues.sql` from your project
2. Copy the **entire contents**
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Verify Success

After running the script, you should see:
- ✅ Success messages in the SQL Editor output
- ✅ No errors

### Step 4: Test Your App

1. Refresh your deployed app
2. The 406 error should be gone
3. New users should be able to report issues without foreign key errors

## 🔍 What the Script Does

### 1. Creates `user_wallets` Table
- Fixes the 406 error
- Sets up proper indexes
- Configures Row Level Security (RLS)

### 2. Auto-Creates Users Table Entries
- Creates a trigger that automatically creates a `users` table entry when someone signs up
- Fixes the foreign key constraint issue
- Migrates any existing auth users that don't have a users table entry

### 3. Creates `blockchain_transactions` Table
- For blockchain features (optional but recommended)

### 4. Updates RLS Policies
- Ensures users can manage their own data
- Allows proper access control

## 🧪 Manual Verification

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_wallets', 'blockchain_transactions');

-- Check if trigger exists
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if users are being created properly
SELECT COUNT(*) as auth_users, 
       (SELECT COUNT(*) FROM users) as public_users
FROM auth.users;
```

## ⚠️ Important Notes

1. **No Data Loss**: This script only creates tables and adds triggers. It won't delete any existing data.

2. **Safe to Re-run**: The script uses `IF NOT EXISTS` and `ON CONFLICT` clauses, so it's safe to run multiple times.

3. **Backup First**: While the script is safe, it's always good practice to backup your database before running migrations.

4. **Test in Development First**: If possible, test this script on a development/staging database first.

## 🆘 Still Having Issues?

If you're still seeing errors after running the script:

1. **Check the SQL Editor Output**: Look for any error messages
2. **Verify Tables Exist**: Use the verification queries above
3. **Check RLS Policies**: Go to Authentication > Policies in Supabase dashboard
4. **Check Logs**: Go to Logs > Postgres Logs in Supabase dashboard

## 📞 Need Help?

- Check the Supabase documentation: https://supabase.com/docs
- Review the error messages in your browser console
- Check the Supabase dashboard logs

---

**Last Updated**: 2024
**Script Version**: 1.0
