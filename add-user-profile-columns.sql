-- Add missing columns to users table for profile functionality
-- Run this in your Supabase SQL Editor

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS issues_reported INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS issues_resolved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"notifications": true, "email_updates": true, "location_sharing": true, "theme": "system"}';

-- Update existing users to have default values
UPDATE users 
SET 
    total_points = COALESCE(total_points, 1000),
    level = COALESCE(level, 1),
    issues_reported = COALESCE(issues_reported, 0),
    issues_resolved = COALESCE(issues_resolved, 0),
    preferences = COALESCE(preferences, '{"notifications": true, "email_updates": true, "location_sharing": true, "theme": "system"}')
WHERE total_points IS NULL OR level IS NULL OR issues_reported IS NULL OR issues_resolved IS NULL OR preferences IS NULL;
