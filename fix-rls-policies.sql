-- Fix RLS policies for CityScope
-- Run this in your Supabase SQL editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view public profiles" ON users;
DROP POLICY IF EXISTS "Users can create issues" ON issues;
DROP POLICY IF EXISTS "Users can update own issues" ON issues;

-- Create more permissive policies for development
-- Users table policies
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to update own profile" ON users FOR UPDATE USING (auth.uid() = id::uuid OR auth.role() = 'service_role');

-- Issues table policies  
CREATE POLICY "Allow public read access to issues" ON issues FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create issues" ON issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to update own issues" ON issues FOR UPDATE USING (auth.uid() = reporter_id::uuid OR auth.role() = 'service_role');

-- Departments table policies
CREATE POLICY "Allow public read access to departments" ON departments FOR SELECT USING (true);

-- Notifications table policies
CREATE POLICY "Allow users to view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id::uuid);
CREATE POLICY "Allow system to create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Chat messages policies
CREATE POLICY "Allow public read access to chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- Voice recordings policies
CREATE POLICY "Allow public read access to voice recordings" ON voice_recordings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create recordings" ON voice_recordings FOR INSERT WITH CHECK (true);

-- Issue flags and upvotes policies
CREATE POLICY "Allow public read access to issue flags" ON issue_flags FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to flag issues" ON issue_flags FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to issue upvotes" ON issue_upvotes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to upvote issues" ON issue_upvotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to remove their upvotes" ON issue_upvotes FOR DELETE USING (auth.uid() = user_id::uuid);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_upvotes ENABLE ROW LEVEL SECURITY;