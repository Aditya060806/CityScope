-- 🔍 Debug Enhanced Chatbot Database Setup
-- This script helps identify and fix the session_id issue

-- Step 1: Check if any existing tables have session_id conflicts
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE column_name = 'session_id' 
AND table_schema = 'public';

-- Step 2: Check if any existing types conflict
SELECT typname, typtype 
FROM pg_type 
WHERE typname IN ('message_type', 'intent_type', 'admin_command_type', 'command_status', 'voice_command_status');

-- Step 3: Check if any existing tables conflict
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chatbot_conversations', 'admin_commands', 'voice_commands', 'language_preferences', 'bot_responses');

-- Step 4: If conflicts exist, drop them first
-- Uncomment the lines below if you want to start fresh:

-- DROP TABLE IF EXISTS bot_responses CASCADE;
-- DROP TABLE IF EXISTS language_preferences CASCADE;
-- DROP TABLE IF EXISTS voice_commands CASCADE;
-- DROP TABLE IF EXISTS admin_commands CASCADE;
-- DROP TABLE IF EXISTS chatbot_conversations CASCADE;

-- Step 5: Create types safely
DO $$ 
BEGIN
    -- Create message_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
        CREATE TYPE message_type AS ENUM ('user', 'bot', 'system');
        RAISE NOTICE 'Created message_type enum';
    ELSE
        RAISE NOTICE 'message_type enum already exists';
    END IF;
    
    -- Create intent_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intent_type') THEN
        CREATE TYPE intent_type AS ENUM (
            'report-issue', 'search-issues', 'help', 'change-language', 'voice-commands',
            'admin-system-status', 'admin-user-analytics', 'admin-issue-analytics', 
            'admin-database', 'admin-users', 'admin-analytics', 'general', 'error'
        );
        RAISE NOTICE 'Created intent_type enum';
    ELSE
        RAISE NOTICE 'intent_type enum already exists';
    END IF;
    
    -- Create admin_command_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_command_type') THEN
        CREATE TYPE admin_command_type AS ENUM ('system', 'database', 'user', 'analytics', 'maintenance');
        RAISE NOTICE 'Created admin_command_type enum';
    ELSE
        RAISE NOTICE 'admin_command_type enum already exists';
    END IF;
    
    -- Create command_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'command_status') THEN
        CREATE TYPE command_status AS ENUM ('pending', 'approved', 'executed', 'rejected');
        RAISE NOTICE 'Created command_status enum';
    ELSE
        RAISE NOTICE 'command_status enum already exists';
    END IF;
    
    -- Create voice_command_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voice_command_status') THEN
        CREATE TYPE voice_command_status AS ENUM ('success', 'failed', 'timeout', 'error');
        RAISE NOTICE 'Created voice_command_status enum';
    ELSE
        RAISE NOTICE 'voice_command_status enum already exists';
    END IF;
END $$;

-- Step 6: Create tables one by one with error handling
DO $$
BEGIN
    -- Create chatbot_conversations table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chatbot_conversations') THEN
        CREATE TABLE chatbot_conversations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID,
            session_id VARCHAR(255) NOT NULL,
            message_type message_type NOT NULL,
            content TEXT NOT NULL,
            language VARCHAR(10) DEFAULT 'en',
            intent intent_type,
            confidence DECIMAL(3,2) DEFAULT 0.0,
            entities JSONB DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            is_admin_command BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created chatbot_conversations table';
    ELSE
        RAISE NOTICE 'chatbot_conversations table already exists';
    END IF;
    
    -- Create admin_commands table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_commands') THEN
        CREATE TABLE admin_commands (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            command_type admin_command_type NOT NULL,
            action VARCHAR(100) NOT NULL,
            description TEXT,
            parameters JSONB DEFAULT '{}',
            requires_approval BOOLEAN DEFAULT false,
            executed_by UUID,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status command_status DEFAULT 'pending',
            result JSONB DEFAULT '{}',
            error_message TEXT,
            approval_notes TEXT,
            approved_by UUID,
            approved_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created admin_commands table';
    ELSE
        RAISE NOTICE 'admin_commands table already exists';
    END IF;
    
    -- Create voice_commands table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_commands') THEN
        CREATE TABLE voice_commands (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID,
            session_id VARCHAR(255) NOT NULL,
            command_text TEXT NOT NULL,
            intent intent_type,
            confidence DECIMAL(3,2) DEFAULT 0.0,
            language VARCHAR(10) DEFAULT 'en',
            entities JSONB DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            status voice_command_status DEFAULT 'success',
            processing_time_ms INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created voice_commands table';
    ELSE
        RAISE NOTICE 'voice_commands table already exists';
    END IF;
    
    -- Create language_preferences table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'language_preferences') THEN
        CREATE TABLE language_preferences (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID UNIQUE,
            preferred_language VARCHAR(10) DEFAULT 'en',
            voice_enabled BOOLEAN DEFAULT true,
            voice_speed DECIMAL(3,2) DEFAULT 1.0,
            voice_pitch DECIMAL(3,2) DEFAULT 1.0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created language_preferences table';
    ELSE
        RAISE NOTICE 'language_preferences table already exists';
    END IF;
    
    -- Create bot_responses table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bot_responses') THEN
        CREATE TABLE bot_responses (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            intent intent_type NOT NULL,
            language VARCHAR(10) NOT NULL,
            response_text TEXT NOT NULL,
            response_type VARCHAR(50) DEFAULT 'text',
            metadata JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(intent, language)
        );
        RAISE NOTICE 'Created bot_responses table';
    ELSE
        RAISE NOTICE 'bot_responses table already exists';
    END IF;
    
    RAISE NOTICE '✅ All tables created successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating tables: %', SQLERRM;
        RAISE;
END $$;
