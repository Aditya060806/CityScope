-- Check if user_activities table exists and create if needed
DO $$
BEGIN
    -- Check if the table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activities') THEN
        -- Create the table
        CREATE TABLE user_activities (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            type VARCHAR(50) NOT NULL CHECK (type IN ('issue_reported', 'issue_resolved', 'reward_claimed', 'level_up', 'badge_earned')),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            points_change INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add indexes
        CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
        CREATE INDEX idx_user_activities_type ON user_activities(type);
        CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

        -- Enable RLS
        ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

        -- Add RLS policies
        CREATE POLICY "Users can view their own activities" ON user_activities FOR SELECT USING (
            auth.uid() = user_id
        );

        CREATE POLICY "Users can insert their own activities" ON user_activities FOR INSERT WITH CHECK (
            auth.uid() = user_id
        );

        CREATE POLICY "Admins can view all activities" ON user_activities FOR SELECT USING (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        );

        RAISE NOTICE 'user_activities table created successfully';
    ELSE
        RAISE NOTICE 'user_activities table already exists';
    END IF;
END $$;
