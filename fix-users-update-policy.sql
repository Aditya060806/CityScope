-- Fix: Add UPDATE policy for users table
-- Run this in your Supabase SQL Editor to allow users to update their own profiles

-- Drop existing policy if it exists (to allow re-running)
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create UPDATE policy for users table
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND policyname = 'Users can update own profile';
