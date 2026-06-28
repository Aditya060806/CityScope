-- 🆓 Free Multilingual Bot Database Setup
-- Run this script in your Supabase SQL editor

-- 1. Create bot_conversations table
CREATE TABLE IF NOT EXISTS bot_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('user', 'bot', 'system')),
    content TEXT NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    intent VARCHAR(100),
    confidence DECIMAL(3,2) DEFAULT 0.0,
    entities JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create voice_commands table
CREATE TABLE IF NOT EXISTS voice_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    command_text TEXT NOT NULL,
    intent VARCHAR(100) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    language VARCHAR(10) NOT NULL,
    entities JSONB DEFAULT '{}',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    response_time_ms INTEGER,
    error_message TEXT
);

-- 3. Create language_preferences table
CREATE TABLE IF NOT EXISTS language_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    voice_enabled BOOLEAN DEFAULT true,
    wake_word_enabled BOOLEAN DEFAULT true,
    wake_word VARCHAR(100) DEFAULT 'hey cityscope',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    command_timeout INTEGER DEFAULT 5000,
    continuous_listening BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create bot_responses table
CREATE TABLE IF NOT EXISTS bot_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intent VARCHAR(100) NOT NULL,
    language VARCHAR(10) NOT NULL,
    response_text TEXT NOT NULL,
    response_type VARCHAR(50) DEFAULT 'text' CHECK (response_type IN ('text', 'voice', 'action')),
    confidence_threshold DECIMAL(3,2) DEFAULT 0.5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(intent, language)
);

-- 5. Create voice_command_stats table
CREATE TABLE IF NOT EXISTS voice_command_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    command_type VARCHAR(100) NOT NULL,
    language VARCHAR(10) NOT NULL,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    avg_confidence DECIMAL(3,2) DEFAULT 0.0,
    avg_response_time_ms INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, command_type, language)
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bot_conversations_user_id ON bot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_conversations_session_id ON bot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_bot_conversations_created_at ON bot_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_intent ON voice_commands(intent);
CREATE INDEX IF NOT EXISTS idx_voice_commands_executed_at ON voice_commands(executed_at);
CREATE INDEX IF NOT EXISTS idx_language_preferences_user_id ON language_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_responses_intent_language ON bot_responses(intent, language);
CREATE INDEX IF NOT EXISTS idx_voice_command_stats_user_id ON voice_command_stats(user_id);

-- 7. Insert default bot responses
INSERT INTO bot_responses (intent, language, response_text, response_type) VALUES
-- English responses
('greeting', 'en', 'Hello! How can I help you today?', 'text'),
('help', 'en', 'I can help you report issues, search for problems, change language, and more. What would you like to do?', 'text'),
('report-issue', 'en', 'I''ll help you report an issue. Please describe what you''re seeing.', 'text'),
('search-issues', 'en', 'Let me search for issues in your area. What type of problem are you looking for?', 'text'),
('change-language', 'en', 'I can help you change the language. What language would you prefer?', 'text'),
('voice-commands', 'en', 'Here are the voice commands you can use: "Report issue", "Search problems", "Get help", "Change language"', 'text'),
('goodbye', 'en', 'Goodbye! Feel free to come back anytime if you need help.', 'text'),

-- Hindi responses
('greeting', 'hi', 'नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूं?', 'text'),
('help', 'hi', 'मैं आपकी समस्याएं रिपोर्ट करने, समस्याएं खोजने, भाषा बदलने और अधिक में मदद कर सकता हूं। आप क्या करना चाहते हैं?', 'text'),
('report-issue', 'hi', 'मैं आपकी समस्या रिपोर्ट करने में मदद करूंगा। कृपया बताएं कि आप क्या देख रहे हैं।', 'text'),
('search-issues', 'hi', 'मैं आपके क्षेत्र में समस्याएं खोजूंगा। आप किस प्रकार की समस्या खोज रहे हैं?', 'text'),
('change-language', 'hi', 'मैं आपकी भाषा बदलने में मदद कर सकता हूं। आप कौन सी भाषा पसंद करेंगे?', 'text'),
('voice-commands', 'hi', 'यहां वॉइस कमांड हैं जो आप उपयोग कर सकते हैं: "समस्या रिपोर्ट करें", "समस्याएं खोजें", "मदद लें", "भाषा बदलें"', 'text'),
('goodbye', 'hi', 'अलविदा! अगर आपको मदद की जरूरत हो तो कभी भी वापस आ सकते हैं।', 'text'),

-- Spanish responses
('greeting', 'es', '¡Hola! ¿Cómo puedo ayudarte hoy?', 'text'),
('help', 'es', 'Puedo ayudarte a reportar problemas, buscar problemas, cambiar idioma y más. ¿Qué te gustaría hacer?', 'text'),
('report-issue', 'es', 'Te ayudo a reportar un problema. Por favor describe lo que estás viendo.', 'text'),
('search-issues', 'es', 'Déjame buscar problemas en tu área. ¿Qué tipo de problema estás buscando?', 'text'),
('change-language', 'es', 'Puedo ayudarte a cambiar el idioma. ¿Qué idioma prefieres?', 'text'),
('voice-commands', 'es', 'Aquí están los comandos de voz que puedes usar: "Reportar problema", "Buscar problemas", "Obtener ayuda", "Cambiar idioma"', 'text'),
('goodbye', 'es', '¡Adiós! No dudes en volver si necesitas ayuda.', 'text'),

-- French responses
('greeting', 'fr', 'Bonjour! Comment puis-je vous aider aujourd''hui?', 'text'),
('help', 'fr', 'Je peux vous aider à signaler des problèmes, rechercher des problèmes, changer de langue et plus. Que souhaitez-vous faire?', 'text'),
('report-issue', 'fr', 'Je vais vous aider à signaler un problème. Veuillez décrire ce que vous voyez.', 'text'),
('search-issues', 'fr', 'Laissez-moi rechercher des problèmes dans votre région. Quel type de problème recherchez-vous?', 'text'),
('change-language', 'fr', 'Je peux vous aider à changer de langue. Quelle langue préférez-vous?', 'text'),
('voice-commands', 'fr', 'Voici les commandes vocales que vous pouvez utiliser: "Signaler un problème", "Rechercher des problèmes", "Obtenir de l''aide", "Changer de langue"', 'text'),
('goodbye', 'fr', 'Au revoir! N''hésitez pas à revenir si vous avez besoin d''aide.', 'text')

ON CONFLICT (intent, language) DO UPDATE SET
    response_text = EXCLUDED.response_text,
    updated_at = NOW();

-- 8. Create RLS (Row Level Security) policies
ALTER TABLE bot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_command_stats ENABLE ROW LEVEL SECURITY;

-- Bot conversations policies
CREATE POLICY "Users can view their own bot conversations" ON bot_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bot conversations" ON bot_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bot conversations" ON bot_conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Voice commands policies
CREATE POLICY "Users can view their own voice commands" ON voice_commands
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice commands" ON voice_commands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Language preferences policies
CREATE POLICY "Users can view their own language preferences" ON language_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own language preferences" ON language_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own language preferences" ON language_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Voice command stats policies
CREATE POLICY "Users can view their own voice command stats" ON voice_command_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice command stats" ON voice_command_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice command stats" ON voice_command_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Bot responses are public (no RLS needed)
-- Anyone can read bot responses

-- 9. Create functions for common operations
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_voice_command_stats(
    user_uuid UUID,
    command_type VARCHAR(100),
    command_language VARCHAR(10),
    success BOOLEAN,
    confidence DECIMAL(3,2),
    response_time_ms INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO voice_command_stats (
        user_id, command_type, language, success_count, failure_count, 
        avg_confidence, avg_response_time_ms, last_used
    ) VALUES (
        user_uuid, command_type, command_language,
        CASE WHEN success THEN 1 ELSE 0 END,
        CASE WHEN success THEN 0 ELSE 1 END,
        confidence, response_time_ms, NOW()
    )
    ON CONFLICT (user_id, command_type, language) DO UPDATE SET
        success_count = voice_command_stats.success_count + CASE WHEN success THEN 1 ELSE 0 END,
        failure_count = voice_command_stats.failure_count + CASE WHEN success THEN 0 ELSE 1 END,
        avg_confidence = (voice_command_stats.avg_confidence + confidence) / 2,
        avg_response_time_ms = (voice_command_stats.avg_response_time_ms + response_time_ms) / 2,
        last_used = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bot_conversations_updated_at
    BEFORE UPDATE ON bot_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_language_preferences_updated_at
    BEFORE UPDATE ON language_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_responses_updated_at
    BEFORE UPDATE ON bot_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_command_stats_updated_at
    BEFORE UPDATE ON voice_command_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert default language preferences for existing users
INSERT INTO language_preferences (user_id, preferred_language, voice_enabled, wake_word_enabled)
SELECT 
    id, 
    'en', 
    true, 
    true
FROM users 
WHERE id NOT IN (SELECT user_id FROM language_preferences);

-- 12. Create a view for bot conversation history
CREATE OR REPLACE VIEW bot_conversation_history AS
SELECT 
    bc.id,
    bc.user_id,
    bc.session_id,
    bc.message_type,
    bc.content,
    bc.language,
    bc.intent,
    bc.confidence,
    bc.entities,
    bc.metadata,
    bc.created_at,
    u.name as user_name,
    u.email as user_email
FROM bot_conversations bc
LEFT JOIN users u ON bc.user_id = u.id
ORDER BY bc.created_at DESC;

-- 13. Create a view for voice command analytics
CREATE OR REPLACE VIEW voice_command_analytics AS
SELECT 
    vcs.command_type,
    vcs.language,
    COUNT(*) as total_users,
    SUM(vcs.success_count + vcs.failure_count) as total_commands,
    SUM(vcs.success_count) as successful_commands,
    SUM(vcs.failure_count) as failed_commands,
    AVG(vcs.avg_confidence) as avg_confidence,
    AVG(vcs.avg_response_time_ms) as avg_response_time,
    MAX(vcs.last_used) as last_used
FROM voice_command_stats vcs
GROUP BY vcs.command_type, vcs.language
ORDER BY total_commands DESC;

-- 14. Grant necessary permissions
GRANT SELECT ON bot_conversation_history TO authenticated;
GRANT SELECT ON voice_command_analytics TO authenticated;
GRANT SELECT ON bot_responses TO authenticated;

-- 15. Create indexes for the views
CREATE INDEX IF NOT EXISTS idx_bot_conversation_history_user_id ON bot_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_command_analytics_command_type ON voice_command_stats(command_type, language);

-- 🎉 Database setup complete!
-- Your multilingual bot database is now ready to use.

-- To verify the setup, run these queries:
-- SELECT COUNT(*) FROM bot_conversations;
-- SELECT COUNT(*) FROM voice_commands;
-- SELECT COUNT(*) FROM language_preferences;
-- SELECT COUNT(*) FROM bot_responses;
-- SELECT COUNT(*) FROM voice_command_stats;
