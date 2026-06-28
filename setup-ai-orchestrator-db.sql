-- 🤖 AI Chat Orchestrator Database Setup
-- Run this script in your Supabase SQL editor

-- 1. Create orchestrator_agents table
CREATE TABLE IF NOT EXISTS orchestrator_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'vision-analyzer', 'data-retriever', 'civic-classifier', 'feedback-summarizer',
        'language-translator', 'voice-processor', 'analytics-engine', 'notification-manager',
        'user-manager', 'system-optimizer', 'security-monitor', 'workflow-coordinator'
    )),
    capabilities JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'busy', 'error', 'maintenance')),
    priority INTEGER NOT NULL DEFAULT 1,
    performance JSONB NOT NULL DEFAULT '{}',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create orchestrator_tasks table
CREATE TABLE IF NOT EXISTS orchestrator_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'image-analysis', 'text-classification', 'language-translation', 'voice-transcription',
        'data-query', 'user-management', 'notification-send', 'analytics-compute',
        'workflow-execute', 'system-optimize', 'security-scan'
    )),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'processing', 'completed', 'failed', 'cancelled')),
    assigned_agent_id UUID REFERENCES orchestrator_agents(id),
    input_data JSONB NOT NULL DEFAULT '{}',
    output_data JSONB,
    metadata JSONB NOT NULL DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create orchestrator_responses table
CREATE TABLE IF NOT EXISTS orchestrator_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES orchestrator_tasks(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES orchestrator_agents(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'voice', 'action', 'visual', 'data', 'system')),
    content TEXT NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    actions JSONB DEFAULT '[]',
    suggestions JSONB DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create admin_commands table
CREATE TABLE IF NOT EXISTS admin_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'user-permission-update', 'system-config-change', 'agent-management',
        'content-moderation', 'analytics-reset', 'backup-create', 'optimization-run', 'security-scan'
    )),
    parameters JSONB NOT NULL DEFAULT '{}',
    requires_approval BOOLEAN DEFAULT false,
    executed_by UUID REFERENCES users(id),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'rejected')),
    approval_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create orchestrator_performance table
CREATE TABLE IF NOT EXISTS orchestrator_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES orchestrator_agents(id),
    date DATE NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    avg_confidence DECIMAL(3,2) DEFAULT 0.0,
    system_load DECIMAL(3,2) DEFAULT 0.0,
    memory_usage DECIMAL(3,2) DEFAULT 0.0,
    error_rate DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, date)
);

-- 6. Create orchestrator_config table
CREATE TABLE IF NOT EXISTS orchestrator_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create orchestrator_workflows table
CREATE TABLE IF NOT EXISTS orchestrator_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orchestrator_agents_type ON orchestrator_agents(type);
CREATE INDEX IF NOT EXISTS idx_orchestrator_agents_status ON orchestrator_agents(status);
CREATE INDEX IF NOT EXISTS idx_orchestrator_tasks_type ON orchestrator_tasks(type);
CREATE INDEX IF NOT EXISTS idx_orchestrator_tasks_status ON orchestrator_tasks(status);
CREATE INDEX IF NOT EXISTS idx_orchestrator_tasks_agent ON orchestrator_tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_tasks_created ON orchestrator_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_orchestrator_responses_task ON orchestrator_responses(task_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_responses_agent ON orchestrator_responses(agent_id);
CREATE INDEX IF NOT EXISTS idx_admin_commands_type ON admin_commands(type);
CREATE INDEX IF NOT EXISTS idx_admin_commands_status ON admin_commands(status);
CREATE INDEX IF NOT EXISTS idx_orchestrator_performance_agent ON orchestrator_performance(agent_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_performance_date ON orchestrator_performance(date);
CREATE INDEX IF NOT EXISTS idx_orchestrator_config_key ON orchestrator_config(key);
CREATE INDEX IF NOT EXISTS idx_orchestrator_workflows_name ON orchestrator_workflows(name);

-- 9. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orchestrator_agents_updated_at
    BEFORE UPDATE ON orchestrator_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orchestrator_tasks_updated_at
    BEFORE UPDATE ON orchestrator_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orchestrator_config_updated_at
    BEFORE UPDATE ON orchestrator_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orchestrator_workflows_updated_at
    BEFORE UPDATE ON orchestrator_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Insert default agents
INSERT INTO orchestrator_agents (name, type, capabilities, status, priority) VALUES
('Vision Analyzer', 'vision-analyzer', '[
    {
        "id": "image-classification",
        "name": "Image Classification",
        "description": "Analyzes images to classify civic issues",
        "inputTypes": ["image/jpeg", "image/png", "image/webp"],
        "outputTypes": ["issue-category", "confidence-score"],
        "parameters": {"model": "civic-issue-classifier", "confidence_threshold": 0.7}
    }
]', 'active', 1),

('Data Retriever', 'data-retriever', '[
    {
        "id": "issue-search",
        "name": "Issue Search",
        "description": "Searches and retrieves civic issues",
        "inputTypes": ["search-query", "location", "filters"],
        "outputTypes": ["issue-list", "analytics-data"],
        "parameters": {"max_results": 100, "include_analytics": true}
    }
]', 'active', 2),

('Civic Classifier', 'civic-classifier', '[
    {
        "id": "issue-categorization",
        "name": "Issue Categorization",
        "description": "Categorizes civic issues automatically",
        "inputTypes": ["text", "image", "location"],
        "outputTypes": ["category", "priority", "department"],
        "parameters": {"use_ml": true, "confidence_threshold": 0.8}
    }
]', 'active', 1),

('Language Translator', 'language-translator', '[
    {
        "id": "text-translation",
        "name": "Text Translation",
        "description": "Translates text between supported languages",
        "inputTypes": ["text"],
        "outputTypes": ["translated-text"],
        "parameters": {"supported_languages": ["en", "hi", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar", "bn", "ta", "te"]}
    }
]', 'active', 3),

('Voice Processor', 'voice-processor', '[
    {
        "id": "voice-transcription",
        "name": "Voice Transcription",
        "description": "Converts speech to text",
        "inputTypes": ["audio/wav", "audio/mp3", "audio/webm"],
        "outputTypes": ["transcribed-text", "confidence-score"],
        "parameters": {"language_detection": true, "real_time": true}
    }
]', 'active', 2),

('Analytics Engine', 'analytics-engine', '[
    {
        "id": "data-analysis",
        "name": "Data Analysis",
        "description": "Analyzes system and user data",
        "inputTypes": ["analytics-query", "time-range", "metrics"],
        "outputTypes": ["analytics-report", "insights", "recommendations"],
        "parameters": {"real_time": true, "caching": true}
    }
]', 'active', 2),

('User Manager', 'user-manager', '[
    {
        "id": "user-operations",
        "name": "User Operations",
        "description": "Manages user accounts and permissions",
        "inputTypes": ["user-id", "permissions", "role"],
        "outputTypes": ["user-profile", "permission-status"],
        "parameters": {"audit_log": true, "role_based_access": true}
    }
]', 'active', 1),

('Workflow Coordinator', 'workflow-coordinator', '[
    {
        "id": "workflow-execution",
        "name": "Workflow Execution",
        "description": "Coordinates complex multi-step workflows",
        "inputTypes": ["workflow-definition", "parameters"],
        "outputTypes": ["workflow-result", "execution-log"],
        "parameters": {"parallel_execution": true, "error_handling": true}
    }
]', 'active', 1)

ON CONFLICT (id) DO NOTHING;

-- 11. Insert default configuration
INSERT INTO orchestrator_config (key, value, description, category) VALUES
('system.max_concurrent_tasks', '{"value": 100}', 'Maximum number of concurrent tasks', 'performance'),
('system.task_timeout_ms', '{"value": 30000}', 'Default task timeout in milliseconds', 'performance'),
('system.auto_optimization', '{"value": true}', 'Enable automatic performance optimization', 'optimization'),
('system.monitoring_interval', '{"value": 30000}', 'System monitoring interval in milliseconds', 'monitoring'),
('agents.default_confidence_threshold', '{"value": 0.7}', 'Default confidence threshold for agents', 'agents'),
('agents.max_retry_attempts', '{"value": 3}', 'Maximum retry attempts for failed tasks', 'agents'),
('security.admin_approval_required', '{"value": true}', 'Require approval for admin commands', 'security'),
('security.audit_all_operations', '{"value": true}', 'Audit all orchestrator operations', 'security'),
('language.default_language', '{"value": "en"}', 'Default system language', 'localization'),
('language.auto_detection', '{"value": true}', 'Enable automatic language detection', 'localization')

ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- 12. Create RLS (Row Level Security) policies
ALTER TABLE orchestrator_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_workflows ENABLE ROW LEVEL SECURITY;

-- Agents policies - admins can manage, authenticated users can view
CREATE POLICY "Authenticated users can view agents" ON orchestrator_agents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage agents" ON orchestrator_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'department_head')
        )
    );

-- Tasks policies - users can view their own tasks, admins can view all
CREATE POLICY "Users can view their own tasks" ON orchestrator_tasks
    FOR SELECT USING (
        (metadata->>'userId')::uuid = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'department_head', 'moderator')
        )
    );

CREATE POLICY "System can manage tasks" ON orchestrator_tasks
    FOR ALL USING (true); -- Allow system operations

-- Responses policies - similar to tasks
CREATE POLICY "Users can view their own responses" ON orchestrator_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orchestrator_tasks 
            WHERE orchestrator_tasks.id = orchestrator_responses.task_id 
            AND (orchestrator_tasks.metadata->>'userId')::uuid = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'department_head', 'moderator')
        )
    );

-- Admin commands policies - only admins
CREATE POLICY "Admins can manage admin commands" ON admin_commands
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'department_head')
        )
    );

-- Performance policies - admins and moderators can view
CREATE POLICY "Admins and moderators can view performance" ON orchestrator_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'department_head', 'moderator')
        )
    );

-- Config policies - admins can manage, authenticated users can view
CREATE POLICY "Authenticated users can view config" ON orchestrator_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage config" ON orchestrator_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'department_head')
        )
    );

-- Workflows policies - similar to config
CREATE POLICY "Authenticated users can view workflows" ON orchestrator_workflows
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage workflows" ON orchestrator_workflows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'department_head')
        )
    );

-- 13. Create functions for common operations
CREATE OR REPLACE FUNCTION get_orchestrator_status()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'active_agents', COUNT(*) FILTER (WHERE status = 'active'),
        'total_agents', COUNT(*),
        'pending_tasks', (SELECT COUNT(*) FROM orchestrator_tasks WHERE status = 'pending'),
        'processing_tasks', (SELECT COUNT(*) FROM orchestrator_tasks WHERE status = 'processing'),
        'completed_tasks_today', (SELECT COUNT(*) FROM orchestrator_tasks WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE),
        'system_health', CASE 
            WHEN (SELECT COUNT(*) FROM orchestrator_tasks WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour') > 10 THEN 'warning'
            WHEN (SELECT COUNT(*) FROM orchestrator_tasks WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour') > 20 THEN 'critical'
            ELSE 'healthy'
        END
    ) INTO result
    FROM orchestrator_agents;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_agent_performance(agent_id_param UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'agent_id', agent_id_param,
        'tasks_completed', COALESCE(SUM(tasks_completed), 0),
        'tasks_failed', COALESCE(SUM(tasks_failed), 0),
        'avg_response_time', COALESCE(AVG(avg_response_time_ms), 0),
        'avg_confidence', COALESCE(AVG(avg_confidence), 0),
        'success_rate', CASE 
            WHEN SUM(tasks_completed + tasks_failed) > 0 
            THEN SUM(tasks_completed)::DECIMAL / SUM(tasks_completed + tasks_failed)
            ELSE 0 
        END
    ) INTO result
    FROM orchestrator_performance 
    WHERE agent_id = agent_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION execute_admin_command(
    command_type VARCHAR(50),
    command_params JSONB,
    executor_id UUID
)
RETURNS UUID AS $$
DECLARE
    command_id UUID;
BEGIN
    -- Check if user has admin permissions
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = executor_id 
        AND role IN ('admin', 'department_head')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to execute admin command';
    END IF;
    
    -- Insert admin command
    INSERT INTO admin_commands (type, parameters, executed_by, status)
    VALUES (command_type, command_params, executor_id, 'pending')
    RETURNING id INTO command_id;
    
    RETURN command_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create views for analytics
CREATE OR REPLACE VIEW orchestrator_analytics AS
SELECT 
    DATE(ot.created_at) as date,
    ot.type as task_type,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE ot.status = 'completed') as completed_tasks,
    COUNT(*) FILTER (WHERE ot.status = 'failed') as failed_tasks,
    AVG(EXTRACT(EPOCH FROM (ot.completed_at - ot.created_at))) * 1000 as avg_processing_time_ms,
    AVG(oresp.confidence) as avg_confidence
FROM orchestrator_tasks ot
LEFT JOIN orchestrator_responses oresp ON ot.id = oresp.task_id
GROUP BY DATE(ot.created_at), ot.type
ORDER BY date DESC, total_tasks DESC;

CREATE OR REPLACE VIEW agent_performance_summary AS
SELECT 
    oa.id,
    oa.name,
    oa.type,
    oa.status,
    COALESCE(SUM(op.tasks_completed), 0) as total_completed,
    COALESCE(SUM(op.tasks_failed), 0) as total_failed,
    COALESCE(AVG(op.avg_response_time_ms), 0) as avg_response_time,
    COALESCE(AVG(op.avg_confidence), 0) as avg_confidence,
    CASE 
        WHEN COALESCE(SUM(op.tasks_completed + op.tasks_failed), 0) > 0 
        THEN SUM(op.tasks_completed)::DECIMAL / SUM(op.tasks_completed + op.tasks_failed)
        ELSE 0 
    END as success_rate
FROM orchestrator_agents oa
LEFT JOIN orchestrator_performance op ON oa.id = op.agent_id
GROUP BY oa.id, oa.name, oa.type, oa.status
ORDER BY total_completed DESC;

-- 15. Grant necessary permissions
GRANT SELECT ON orchestrator_analytics TO authenticated;
GRANT SELECT ON agent_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_orchestrator_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_performance(UUID) TO authenticated;

-- 16. Create a function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_orchestrator_data()
RETURNS VOID AS $$
BEGIN
    -- Delete completed tasks older than 30 days
    DELETE FROM orchestrator_tasks 
    WHERE status = 'completed' 
    AND completed_at < NOW() - INTERVAL '30 days';
    
    -- Delete failed tasks older than 7 days
    DELETE FROM orchestrator_tasks 
    WHERE status = 'failed' 
    AND created_at < NOW() - INTERVAL '7 days';
    
    -- Delete old performance data (keep last 90 days)
    DELETE FROM orchestrator_performance 
    WHERE date < CURRENT_DATE - INTERVAL '90 days';
    
    -- Delete old responses (keep last 30 days)
    DELETE FROM orchestrator_responses 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🎉 AI Chat Orchestrator Database Setup Complete!
-- Your enhanced AI system is now ready to operate as the central intelligence hub.

-- To verify the setup, run these queries:
-- SELECT get_orchestrator_status();
-- SELECT * FROM orchestrator_agents;
-- SELECT * FROM orchestrator_config;
-- SELECT * FROM agent_performance_summary LIMIT 5;
