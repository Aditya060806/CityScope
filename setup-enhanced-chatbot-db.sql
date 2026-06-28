-- 🤖 Enhanced Chatbot Database Setup
-- This script sets up the enhanced chatbot functionality with admin commands and conversation history

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
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
    executed_by UUID REFERENCES users(id) ON DELETE CASCADE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status command_status DEFAULT 'pending',
    result JSONB DEFAULT '{}',
    error_message TEXT,
    approval_notes TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice commands table
CREATE TABLE IF NOT EXISTS voice_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    command_text TEXT NOT NULL,
    intent intent_type,
    confidence DECIMAL(3,2) DEFAULT 0.0,
    language VARCHAR(10) DEFAULT 'en',
    entities JSONB DEFAULT '{}',
    status voice_command_status DEFAULT 'success',
    response_time_ms INTEGER,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Language preferences table
CREATE TABLE IF NOT EXISTS language_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    voice_enabled BOOLEAN DEFAULT true,
    wake_word_enabled BOOLEAN DEFAULT false,
    wake_word VARCHAR(50) DEFAULT 'hey cityscope',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    command_timeout INTEGER DEFAULT 5000,
    continuous_listening BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot responses table
CREATE TABLE IF NOT EXISTS bot_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intent intent_type NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    response_text TEXT NOT NULL,
    response_type VARCHAR(20) DEFAULT 'text',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(intent, language)
);

-- Voice command analytics view
CREATE OR REPLACE VIEW voice_command_analytics AS
SELECT 
    user_id,
    language,
    intent,
    COUNT(*) as total_commands,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_commands,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_commands,
    AVG(confidence) as avg_confidence,
    AVG(response_time_ms) as avg_response_time,
    MAX(executed_at) as last_used
FROM voice_commands
GROUP BY user_id, language, intent;

-- Chatbot conversation analytics view
CREATE OR REPLACE VIEW chatbot_analytics AS
SELECT 
    DATE(created_at) as date,
    language,
    intent,
    COUNT(*) as message_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(confidence) as avg_confidence
FROM chatbot_conversations
WHERE message_type = 'bot'
GROUP BY DATE(created_at), language, intent;

-- Admin command analytics view
CREATE OR REPLACE VIEW admin_command_analytics AS
SELECT 
    command_type,
    action,
    status,
    COUNT(*) as command_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_execution_time,
    COUNT(DISTINCT executed_by) as unique_executors
FROM admin_commands
GROUP BY command_type, action, status;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_created_at ON chatbot_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_intent ON chatbot_conversations(intent);

CREATE INDEX IF NOT EXISTS idx_admin_commands_executed_by ON admin_commands(executed_by);
CREATE INDEX IF NOT EXISTS idx_admin_commands_status ON admin_commands(status);
CREATE INDEX IF NOT EXISTS idx_admin_commands_created_at ON admin_commands(created_at);

CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_executed_at ON voice_commands(executed_at);
CREATE INDEX IF NOT EXISTS idx_voice_commands_intent ON voice_commands(intent);

-- Create functions for common operations

-- Function to get user language preference
CREATE OR REPLACE FUNCTION get_user_language_preference(user_uuid UUID)
RETURNS VARCHAR(10) AS $$
BEGIN
    RETURN (
        SELECT preferred_language 
        FROM language_preferences 
        WHERE user_id = user_uuid
    );
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'en';
END;
$$ LANGUAGE plpgsql;

-- Function to update voice command stats
CREATE OR REPLACE FUNCTION update_voice_command_stats(
    user_uuid UUID,
    command_type VARCHAR(100),
    command_language VARCHAR(10),
    success BOOLEAN,
    confidence DECIMAL(3,2),
    response_time_ms INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO voice_command_analytics (
        user_id, language, intent, total_commands, 
        successful_commands, failed_commands, avg_confidence, avg_response_time
    ) VALUES (
        user_uuid, command_language, command_type::intent_type,
        CASE WHEN success THEN 1 ELSE 0 END,
        CASE WHEN success THEN 1 ELSE 0 END,
        CASE WHEN NOT success THEN 1 ELSE 0 END,
        confidence, response_time_ms
    )
    ON CONFLICT (user_id, language, intent) 
    DO UPDATE SET
        total_commands = voice_command_analytics.total_commands + 1,
        successful_commands = voice_command_analytics.successful_commands + CASE WHEN success THEN 1 ELSE 0 END,
        failed_commands = voice_command_analytics.failed_commands + CASE WHEN NOT success THEN 1 ELSE 0 END,
        avg_confidence = (voice_command_analytics.avg_confidence * voice_command_analytics.total_commands + confidence) / (voice_command_analytics.total_commands + 1),
        avg_response_time = (voice_command_analytics.avg_response_time * voice_command_analytics.total_commands + response_time_ms) / (voice_command_analytics.total_commands + 1),
        last_used = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old chatbot data
CREATE OR REPLACE FUNCTION cleanup_chatbot_data(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old conversations
    DELETE FROM chatbot_conversations 
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old voice commands
    DELETE FROM voice_commands 
    WHERE executed_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Delete old admin commands (keep longer)
    DELETE FROM admin_commands 
    WHERE created_at < NOW() - INTERVAL '1 day' * (retention_days * 2);
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get chatbot session summary
CREATE OR REPLACE FUNCTION get_chatbot_session_summary(session_uuid VARCHAR(255))
RETURNS TABLE (
    session_id VARCHAR(255),
    user_id UUID,
    message_count INTEGER,
    intent_distribution JSONB,
    avg_confidence DECIMAL(3,2),
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.session_id,
        c.user_id,
        COUNT(*)::INTEGER as message_count,
        jsonb_object_agg(c.intent, intent_count) as intent_distribution,
        AVG(c.confidence) as avg_confidence,
        EXTRACT(EPOCH FROM (MAX(c.created_at) - MIN(c.created_at)))::INTEGER / 60 as duration_minutes,
        MIN(c.created_at) as created_at,
        MAX(c.created_at) as last_activity
    FROM (
        SELECT 
            session_id,
            user_id,
            intent,
            confidence,
            created_at,
            COUNT(*) as intent_count
        FROM chatbot_conversations
        WHERE session_id = session_uuid
        GROUP BY session_id, user_id, intent, confidence, created_at
    ) c
    GROUP BY c.session_id, c.user_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default bot responses
INSERT INTO bot_responses (intent, language, response_text, response_type) VALUES
('report-issue', 'en', 'I''ll help you report an issue. Please describe what you''re seeing and I''ll guide you through the process.', 'text'),
('search-issues', 'en', 'I can help you search for issues in your area. What type of problem are you looking for?', 'text'),
('help', 'en', 'I''m here to help! I can assist you with reporting issues, searching for problems, and more.', 'text'),
('change-language', 'en', 'I can help you change the language. Please select your preferred language.', 'text'),
('voice-commands', 'en', 'Voice commands are available! You can speak to me in your preferred language.', 'text'),
('general', 'en', 'I understand you''re looking for help. How can I assist you today?', 'text'),
('error', 'en', 'I''m sorry, I''m having trouble processing your request. Please try again.', 'text'),

-- Hindi responses
('report-issue', 'hi', 'मैं आपकी समस्या की रिपोर्ट करने में मदद करूंगा। कृपया बताएं कि आप क्या देख रहे हैं।', 'text'),
('search-issues', 'hi', 'मैं आपके क्षेत्र में समस्याओं की खोज में मदद कर सकता हूं। आप किस प्रकार की समस्या ढूंढ रहे हैं?', 'text'),
('help', 'hi', 'मैं यहां आपकी मदद के लिए हूं! मैं समस्याओं की रिपोर्ट करने और खोजने में सहायता कर सकता हूं।', 'text'),

-- Spanish responses
('report-issue', 'es', 'Te ayudo a reportar un problema. Por favor describe lo que estás viendo.', 'text'),
('search-issues', 'es', 'Puedo ayudarte a buscar problemas en tu área. ¿Qué tipo de problema buscas?', 'text'),
('help', 'es', '¡Estoy aquí para ayudar! Puedo asistirte con reportar problemas y más.', 'text');

-- Create RLS policies for security
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations" ON chatbot_conversations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create conversations" ON chatbot_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations" ON chatbot_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Admin commands policies
CREATE POLICY "Users can view own admin commands" ON admin_commands
    FOR SELECT USING (auth.uid() = executed_by);

CREATE POLICY "Admins can execute admin commands" ON admin_commands
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Voice commands policies
CREATE POLICY "Users can view own voice commands" ON voice_commands
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create voice commands" ON voice_commands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Language preferences policies
CREATE POLICY "Users can manage own preferences" ON language_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chatbot_conversations_updated_at
    BEFORE UPDATE ON chatbot_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_commands_updated_at
    BEFORE UPDATE ON admin_commands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_language_preferences_updated_at
    BEFORE UPDATE ON language_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_responses_updated_at
    BEFORE UPDATE ON bot_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON chatbot_conversations TO authenticated;
GRANT SELECT, INSERT ON admin_commands TO authenticated;
GRANT SELECT, INSERT ON voice_commands TO authenticated;
GRANT ALL ON language_preferences TO authenticated;
GRANT SELECT ON bot_responses TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_language_preference(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_voice_command_stats(UUID, VARCHAR, VARCHAR, BOOLEAN, DECIMAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_chatbot_data(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chatbot_session_summary(VARCHAR) TO authenticated;

-- Grant view access
GRANT SELECT ON voice_command_analytics TO authenticated;
GRANT SELECT ON chatbot_analytics TO authenticated;
GRANT SELECT ON admin_command_analytics TO authenticated;

-- Create a scheduled job to cleanup old data (if pg_cron is available)
-- SELECT cron.schedule('cleanup-chatbot-data', '0 2 * * *', 'SELECT cleanup_chatbot_data(90);');

-- Insert sample admin commands for testing
INSERT INTO admin_commands (command_type, action, description, executed_by, status, result) VALUES
('system', 'health_check', 'System health check', auth.uid(), 'executed', '{"status": "healthy", "uptime": 99.8}'),
('database', 'backup', 'Database backup', auth.uid(), 'executed', '{"backup_id": "backup_123", "size": "2.4GB"}'),
('analytics', 'generate_report', 'Generate analytics report', auth.uid(), 'executed', '{"report_id": "report_456", "type": "comprehensive"}');

COMMENT ON TABLE chatbot_conversations IS 'Stores all chatbot conversation messages with users';
COMMENT ON TABLE admin_commands IS 'Tracks admin commands executed through the chatbot';
COMMENT ON TABLE voice_commands IS 'Records voice commands processed by the chatbot';
COMMENT ON TABLE language_preferences IS 'User language and voice preferences for the chatbot';
COMMENT ON TABLE bot_responses IS 'Predefined bot responses for different intents and languages';

COMMENT ON FUNCTION get_user_language_preference(UUID) IS 'Gets the preferred language for a user';
COMMENT ON FUNCTION update_voice_command_stats(UUID, VARCHAR, VARCHAR, BOOLEAN, DECIMAL, INTEGER) IS 'Updates voice command statistics';
COMMENT ON FUNCTION cleanup_chatbot_data(INTEGER) IS 'Cleans up old chatbot data based on retention period';
COMMENT ON FUNCTION get_chatbot_session_summary(VARCHAR) IS 'Gets a summary of a chatbot session';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Enhanced Chatbot Database Setup Complete!';
    RAISE NOTICE 'Tables created: chatbot_conversations, admin_commands, voice_commands, language_preferences, bot_responses';
    RAISE NOTICE 'Views created: voice_command_analytics, chatbot_analytics, admin_command_analytics';
    RAISE NOTICE 'Functions created: get_user_language_preference, update_voice_command_stats, cleanup_chatbot_data, get_chatbot_session_summary';
    RAISE NOTICE 'RLS policies enabled for security';
    RAISE NOTICE 'Default bot responses inserted for English, Hindi, and Spanish';
END $$;
