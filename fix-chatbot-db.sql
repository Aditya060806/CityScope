-- 🔧 Fix Enhanced Chatbot Database
-- This script handles existing types and creates missing components

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types for chatbot functionality (only if they don't exist)
DO $$ 
BEGIN
    -- Create message_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
        CREATE TYPE message_type AS ENUM ('user', 'bot', 'system');
    END IF;
    
    -- Create intent_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'intent_type') THEN
        CREATE TYPE intent_type AS ENUM (
            'report-issue', 'search-issues', 'help', 'change-language', 'voice-commands',
            'admin-system-status', 'admin-user-analytics', 'admin-issue-analytics', 
            'admin-database', 'admin-users', 'admin-analytics', 'general', 'error'
        );
    END IF;
    
    -- Create admin_command_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_command_type') THEN
        CREATE TYPE admin_command_type AS ENUM ('system', 'database', 'user', 'analytics', 'maintenance');
    END IF;
    
    -- Create command_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'command_status') THEN
        CREATE TYPE command_status AS ENUM ('pending', 'approved', 'executed', 'rejected');
    END IF;
    
    -- Create voice_command_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voice_command_status') THEN
        CREATE TYPE voice_command_status AS ENUM ('success', 'failed', 'timeout', 'error');
    END IF;
END $$;

-- Chatbot conversations table
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Admin commands table
CREATE TABLE IF NOT EXISTS admin_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    command_type admin_command_type NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}',
    requires_approval BOOLEAN DEFAULT false,
    executed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status command_status DEFAULT 'pending',
    result JSONB DEFAULT '{}',
    error_message TEXT,
    approval_notes TEXT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice commands table
CREATE TABLE IF NOT EXISTS voice_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Language preferences table
CREATE TABLE IF NOT EXISTS language_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    voice_enabled BOOLEAN DEFAULT true,
    voice_speed DECIMAL(3,2) DEFAULT 1.0,
    voice_pitch DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot responses table
CREATE TABLE IF NOT EXISTS bot_responses (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_created_at ON chatbot_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_commands_executed_by ON admin_commands(executed_by);
CREATE INDEX IF NOT EXISTS idx_admin_commands_status ON admin_commands(status);
CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_session_id ON voice_commands(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_chatbot_conversations_updated_at ON chatbot_conversations;
CREATE TRIGGER update_chatbot_conversations_updated_at
    BEFORE UPDATE ON chatbot_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_language_preferences_updated_at ON language_preferences;
CREATE TRIGGER update_language_preferences_updated_at
    BEFORE UPDATE ON language_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bot_responses_updated_at ON bot_responses;
CREATE TRIGGER update_bot_responses_updated_at
    BEFORE UPDATE ON bot_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default bot responses
INSERT INTO bot_responses (intent, language, response_text, response_type) VALUES
('help', 'en', 'I''m here to help you with CityScope! I can assist with reporting issues, searching for problems, and providing information about the system.', 'text'),
('help', 'hi', 'मैं CityScope के साथ आपकी मदद के लिए यहाँ हूँ! मैं मुद्दों की रिपोर्टिंग, समस्याओं की खोज और सिस्टम के बारे में जानकारी प्रदान करने में सहायता कर सकता हूँ।', 'text'),
('report-issue', 'en', 'I''ll help you report an issue. Please describe what you''re seeing and I''ll guide you through the process.', 'text'),
('report-issue', 'hi', 'मैं आपको एक मुद्दे की रिपोर्ट करने में मदद करूंगा। कृपया बताएं कि आप क्या देख रहे हैं और मैं आपको प्रक्रिया के माध्यम से मार्गदर्शन करूंगा।', 'text'),
('search-issues', 'en', 'I can help you search for existing issues. What type of problem are you looking for?', 'text'),
('search-issues', 'hi', 'मैं आपको मौजूदा मुद्दों की खोज में मदद कर सकता हूँ। आप किस प्रकार की समस्या की तलाश कर रहे हैं?', 'text'),
('general', 'en', 'I understand. How can I assist you further?', 'text'),
('general', 'hi', 'मैं समझ गया। मैं आपकी और कैसे सहायता कर सकता हूँ?', 'text'),
('error', 'en', 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.', 'text'),
('error', 'hi', 'मुझे खेद है, लेकिन आपके अनुरोध को संसाधित करते समय एक त्रुटि आई। कृपया पुनः प्रयास करें या यदि समस्या बनी रहती है तो सहायता से संपर्क करें।', 'text')
ON CONFLICT (intent, language) DO NOTHING;

-- Create RLS policies
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for chatbot_conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON chatbot_conversations;
CREATE POLICY "Users can view their own conversations" ON chatbot_conversations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own conversations" ON chatbot_conversations;
CREATE POLICY "Users can insert their own conversations" ON chatbot_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for admin_commands
DROP POLICY IF EXISTS "Admins can view all admin commands" ON admin_commands;
CREATE POLICY "Admins can view all admin commands" ON admin_commands
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can insert admin commands" ON admin_commands;
CREATE POLICY "Admins can insert admin commands" ON admin_commands
    FOR INSERT WITH CHECK (
        auth.uid() = executed_by AND
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS policies for voice_commands
DROP POLICY IF EXISTS "Users can view their own voice commands" ON voice_commands;
CREATE POLICY "Users can view their own voice commands" ON voice_commands
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own voice commands" ON voice_commands;
CREATE POLICY "Users can insert their own voice commands" ON voice_commands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for language_preferences
DROP POLICY IF EXISTS "Users can view their own language preferences" ON language_preferences;
CREATE POLICY "Users can view their own language preferences" ON language_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own language preferences" ON language_preferences;
CREATE POLICY "Users can insert their own language preferences" ON language_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own language preferences" ON language_preferences;
CREATE POLICY "Users can update their own language preferences" ON language_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for bot_responses (public read)
DROP POLICY IF EXISTS "Anyone can view bot responses" ON bot_responses;
CREATE POLICY "Anyone can view bot responses" ON bot_responses
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Enhanced Chatbot Database Setup Complete!';
    RAISE NOTICE '📊 Tables created: chatbot_conversations, admin_commands, voice_commands, language_preferences, bot_responses';
    RAISE NOTICE '🔒 RLS policies enabled for security';
    RAISE NOTICE '🌍 Multi-language bot responses inserted';
    RAISE NOTICE '🚀 Ready to use the enhanced chatbot!';
END $$;
