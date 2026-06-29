# 🔧 Fix: Profile Changes Not Getting Saved

## Problem

When you try to update your profile, the changes don't get saved. This is because the `users` table is missing an UPDATE RLS (Row Level Security) policy.

## ✅ Quick Fix

Run this SQL script in your Supabase SQL Editor:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** (left sidebar)

2. **Run the Fix Script**
   - Copy the entire contents of `fix-users-update-policy.sql`
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter / Cmd+Enter)

3. **Verify**
   - The script will show the policy that was created
   - Try updating your profile again - it should work now!

## 🔍 What This Does

The script adds an UPDATE policy to the `users` table that allows users to update their own profiles:

```sql
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

This policy ensures:
- ✅ Users can only update their own profile (not others)
- ✅ The user ID must match the authenticated user's ID
- ✅ Security is maintained through RLS

## 🆘 Still Not Working?

If updates still fail after running the script:

1. **Check if policy exists:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users' AND cmd = 'UPDATE';
   ```

2. **Check browser console** for any error messages

3. **Verify you're logged in** - RLS policies require authentication

4. **Check the error message** in the browser console - it will tell you if it's still a policy issue

## 📝 Note

The code has been updated to only update the `name` field (the only field that exists in the base users table schema). If you need to update other fields like `bio` or `location`, you'll need to add those columns to the database schema first.
