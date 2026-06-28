-- Supabase Database Schema for CityScope
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('issue-images', 'issue-images', true),
  ('voice-recordings', 'voice-recordings', true),
  ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create custom types
CREATE TYPE issue_status AS ENUM ('pending', 'in-progress', 'resolved', 'closed');
CREATE TYPE issue_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE issue_category AS ENUM ('roads', 'lighting', 'water', 'sanitation', 'traffic', 'parks', 'other');
CREATE TYPE user_role AS ENUM ('citizen', 'moderator', 'admin', 'department_head');
CREATE TYPE notification_type AS ENUM ('issue_update', 'assignment', 'resolution', 'comment', 'system');
CREATE TYPE message_type AS ENUM ('text', 'image', 'voice', 'file', 'system');
CREATE TYPE security_event_type AS ENUM ('login_attempt', 'permission_denied', 'suspicious_activity', 'data_breach', 'rate_limit_exceeded');
CREATE TYPE security_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE reward_category AS ENUM ('discount', 'voucher', 'cash', 'experience', 'recognition');
CREATE TYPE reward_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'expired');
CREATE TYPE payment_method AS ENUM ('points', 'stripe', 'upi', 'bank_transfer');
CREATE TYPE delivery_method AS ENUM ('email', 'sms', 'mail', 'pickup');

-- Departments table (created first to avoid circular dependency)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    head_id UUID, -- Will add foreign key constraint later
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    service_areas TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'citizen',
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reports_count INTEGER DEFAULT 0,
    verified_percentage DECIMAL(5,2) DEFAULT 0.00,
    badges TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issues table
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category issue_category NOT NULL,
    status issue_status DEFAULT 'pending',
    priority issue_priority DEFAULT 'medium',
    location JSONB NOT NULL, -- {latitude, longitude, address}
    images TEXT[] DEFAULT '{}',
    reporter_id UUID REFERENCES users(id) NOT NULL,
    reporter_name VARCHAR(255) NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    upvotes INTEGER DEFAULT 0,
    flag_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT false,
    timeline JSONB DEFAULT '[]',
    voice_recording_id UUID, -- Will add foreign key constraint later
    estimated_resolution_date TIMESTAMP WITH TIME ZONE,
    actual_resolution_date TIMESTAMP WITH TIME ZONE
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) NOT NULL,
    sender_id UUID REFERENCES users(id) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    reply_to UUID REFERENCES chat_messages(id)
);

-- Voice recordings table
CREATE TABLE voice_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    audio_url TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    transcription TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issue flags table
CREATE TABLE issue_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

-- Issue upvotes table
CREATE TABLE issue_upvotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

-- Department service areas table (for routing)
CREATE TABLE department_service_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) NOT NULL,
    area_name VARCHAR(255) NOT NULL,
    boundary JSONB NOT NULL, -- GeoJSON polygon
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_created_at ON issues(created_at);
CREATE INDEX idx_issues_reporter_id ON issues(reporter_id);
CREATE INDEX idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX idx_issues_department_id ON issues(department_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_chat_messages_issue_id ON chat_messages(issue_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user reports count
CREATE OR REPLACE FUNCTION update_user_reports_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET reports_count = reports_count + 1 WHERE id = NEW.reporter_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET reports_count = reports_count - 1 WHERE id = OLD.reporter_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_count_trigger
    AFTER INSERT OR DELETE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_user_reports_count();

-- Function to update issue upvotes count
CREATE OR REPLACE FUNCTION update_issue_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE issues SET upvotes = upvotes + 1 WHERE id = NEW.issue_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE issues SET upvotes = upvotes - 1 WHERE id = OLD.issue_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_upvotes_count_trigger
    AFTER INSERT OR DELETE ON issue_upvotes
    FOR EACH ROW EXECUTE FUNCTION update_issue_upvotes_count();

-- Function to update issue flag count
CREATE OR REPLACE FUNCTION update_issue_flag_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE issues SET flag_count = flag_count + 1 WHERE id = NEW.issue_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE issues SET flag_count = flag_count - 1 WHERE id = OLD.issue_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flag_count_trigger
    AFTER INSERT OR DELETE ON issue_flags
    FOR EACH ROW EXECUTE FUNCTION update_issue_flag_count();

-- Insert default departments
INSERT INTO departments (name, description, contact_email, contact_phone, service_areas) VALUES
('Public Works', 'Roads, bridges, and infrastructure maintenance', 'publicworks@city.gov', '+91-123-456-7890', ARRAY['infrastructure', 'transportation']),
('Sanitation Department', 'Waste management and cleanliness', 'sanitation@city.gov', '+91-123-456-7891', ARRAY['sanitation', 'environment']),
('Public Safety', 'Police, fire, and emergency services', 'safety@city.gov', '+91-123-456-7892', ARRAY['safety', 'emergency']),
('Utilities', 'Water, electricity, and gas services', 'utilities@city.gov', '+91-123-456-7893', ARRAY['utilities', 'infrastructure']),
('Environmental Services', 'Environmental protection and conservation', 'environment@city.gov', '+91-123-456-7894', ARRAY['environment', 'conservation']);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('notification_settings', '{"email_enabled": true, "sms_enabled": true, "push_enabled": true}', 'Global notification preferences'),
('routing_settings', '{"auto_assign": true, "ml_enabled": true, "fallback_department": "Public Works"}', 'Issue routing configuration'),
('file_upload_settings', '{"max_file_size": 10485760, "allowed_types": ["image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/wav"]}', 'File upload restrictions'),
('analytics_settings', '{"retention_days": 365, "export_enabled": true}', 'Analytics and reporting settings');

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_upvotes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data and public user data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view public profiles" ON users FOR SELECT USING (true);

-- Issues are publicly readable, but only reporters can update their own
CREATE POLICY "Issues are publicly readable" ON issues FOR SELECT USING (true);
CREATE POLICY "Users can create issues" ON issues FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can update own issues" ON issues FOR UPDATE USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can update all issues" ON issues FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Notifications are private to users
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages are readable by issue participants
CREATE POLICY "Chat messages are readable by issue participants" ON chat_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM issues WHERE id = issue_id AND (reporter_id = auth.uid() OR assigned_to = auth.uid()))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Voice recordings are readable by issue participants
CREATE POLICY "Voice recordings are readable by issue participants" ON voice_recordings FOR SELECT USING (
    EXISTS (SELECT 1 FROM issues WHERE id = issue_id AND (reporter_id = auth.uid() OR assigned_to = auth.uid()))
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Security Policies table
CREATE TABLE security_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '[]',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity security_severity DEFAULT 'low',
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Security Events table
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type security_event_type NOT NULL,
    user_id UUID REFERENCES users(id),
    ip_address INET NOT NULL,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    severity security_severity DEFAULT 'low',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT false,
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Blocked IPs table
CREATE TABLE blocked_ips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Rewards table
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    points_required INTEGER NOT NULL,
    category reward_category NOT NULL,
    value INTEGER NOT NULL, -- Cash value in cents or discount percentage
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    terms_and_conditions TEXT NOT NULL,
    expiry_days INTEGER,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Rewards table
CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    reward_id UUID REFERENCES rewards(id) NOT NULL,
    points_spent INTEGER NOT NULL,
    status reward_status DEFAULT 'pending',
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    transaction_id VARCHAR(255),
    payment_method payment_method DEFAULT 'points',
    delivery_method delivery_method NOT NULL,
    delivery_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Methods table
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type payment_method NOT NULL,
    name VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'reward_redemption', 'points_purchase', 'refund'
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    payment_method VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Integration Mappings table
CREATE TABLE integration_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    system_id VARCHAR(255) NOT NULL,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status VARCHAR(50) DEFAULT 'synced', -- 'synced', 'pending', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(external_id, system_id)
);

-- User activities table for tracking user actions
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('issue_reported', 'issue_resolved', 'reward_claimed', 'level_up', 'badge_earned')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_change INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE departments ADD CONSTRAINT fk_departments_head_id FOREIGN KEY (head_id) REFERENCES users(id);
ALTER TABLE issues ADD CONSTRAINT fk_issues_voice_recording_id FOREIGN KEY (voice_recording_id) REFERENCES voice_recordings(id);

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_verified BOOLEAN DEFAULT false;

-- Add missing columns to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'synced';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(active);
CREATE INDEX IF NOT EXISTS idx_rewards_category ON rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_points_required ON rewards(points_required);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_integration_mappings_issue_id ON integration_mappings(issue_id);
CREATE INDEX IF NOT EXISTS idx_integration_mappings_system_id ON integration_mappings(system_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- RLS Policies for new tables

-- Security policies are readable by admins only
CREATE POLICY "Security policies are readable by admins" ON security_policies FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Audit logs are readable by admins only
CREATE POLICY "Audit logs are readable by admins" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Security events are readable by admins only
CREATE POLICY "Security events are readable by admins" ON security_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Blocked IPs are readable by admins only
CREATE POLICY "Blocked IPs are readable by admins" ON blocked_ips FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Rewards are publicly readable
CREATE POLICY "Rewards are publicly readable" ON rewards FOR SELECT USING (is_active = true);

-- User rewards are readable by the user and admins
CREATE POLICY "User rewards are readable by owner and admins" ON user_rewards FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Payment methods are readable by the user and admins
CREATE POLICY "Payment methods are readable by owner and admins" ON payment_methods FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Transactions are readable by the user and admins
CREATE POLICY "Transactions are readable by owner and admins" ON transactions FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Integration mappings are readable by admins only
CREATE POLICY "Integration mappings are readable by admins" ON integration_mappings FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- User activities policies
CREATE POLICY "Users can view their own activities" ON user_activities FOR SELECT USING (
    auth.uid() = user_id
);

CREATE POLICY "Users can insert their own activities" ON user_activities FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "Admins can view all activities" ON user_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Insert default security policies
INSERT INTO security_policies (name, description, rules, enabled) VALUES
('Authentication Policy', 'Controls authentication and authorization', 
 '[{"condition": "failed_login_attempts > 5", "action": "deny", "severity": "high"}, {"condition": "suspicious_ip_address", "action": "alert", "severity": "medium"}, {"condition": "admin_action_without_2fa", "action": "deny", "severity": "critical"}]', 
 true),
('Data Access Policy', 'Controls data access and modification', 
 '[{"condition": "bulk_data_export", "action": "log", "severity": "medium"}, {"condition": "cross_tenant_data_access", "action": "deny", "severity": "critical"}, {"condition": "sensitive_data_access", "action": "log", "severity": "high"}]', 
 true),
('API Security Policy', 'Controls API access and rate limiting', 
 '[{"condition": "rate_limit_exceeded", "action": "deny", "severity": "medium"}, {"condition": "invalid_api_key", "action": "deny", "severity": "high"}, {"condition": "suspicious_api_usage", "action": "alert", "severity": "high"}]', 
 true);

-- Insert comprehensive rewards system
INSERT INTO rewards (name, description, points_required, category, value, currency, terms_and_conditions, max_redemptions, image_url) VALUES
('Municipal Service Discount', '10% discount on municipal services', 100, 'discount', 10, 'INR', 'Valid for 30 days. Cannot be combined with other offers.', 1000, '/rewards/municipal-discount.png'),
('Community Event Voucher', 'Free entry to community events', 200, 'voucher', 25, 'INR', 'Valid for 6 months. Subject to availability.', 500, '/rewards/event-voucher.png'),
('Cash Reward ₹50', 'Direct cash payment via UPI', 500, 'cash', 5000, 'INR', 'Minimum redemption amount. Processing fee may apply.', 100, '/rewards/cash-reward.png'),
('Cash Reward ₹100', 'Direct cash payment via UPI', 1000, 'cash', 10000, 'INR', 'Direct UPI transfer to your account.', 50, '/rewards/cash-reward-100.png'),
('Cash Reward ₹200', 'Direct cash payment via UPI', 2000, 'cash', 20000, 'INR', 'Direct UPI transfer to your account.', 25, '/rewards/cash-reward-200.png'),
('City Hall Tour', 'Exclusive behind-the-scenes tour', 300, 'experience', 50, 'INR', 'Scheduled tours only. Maximum 10 people per tour.', 50, '/rewards/city-tour.png'),
('Community Recognition Certificate', 'Official recognition certificate', 150, 'recognition', 0, 'INR', 'Digital certificate. Can be printed at home.', 1000, '/rewards/certificate.png'),
('Amazon Gift Card ₹100', 'Amazon India gift card', 800, 'voucher', 10000, 'INR', 'Digital gift card delivered via email.', 200, '/rewards/amazon-gift.png'),
('Flipkart Gift Card ₹100', 'Flipkart gift card', 800, 'voucher', 10000, 'INR', 'Digital gift card delivered via email.', 200, '/rewards/flipkart-gift.png'),
('Swiggy Food Voucher ₹50', 'Swiggy food delivery voucher', 400, 'voucher', 5000, 'INR', 'Valid for food delivery orders.', 300, '/rewards/swiggy-voucher.png'),
('Zomato Food Voucher ₹50', 'Zomato food delivery voucher', 400, 'voucher', 5000, 'INR', 'Valid for food delivery orders.', 300, '/rewards/zomato-voucher.png'),
('Movie Ticket Voucher', 'Free movie ticket at local cinema', 600, 'voucher', 20000, 'INR', 'Valid at participating cinemas.', 100, '/rewards/movie-ticket.png'),
('Parking Fee Waiver', 'Free parking for 1 month', 250, 'discount', 0, 'INR', 'Valid at municipal parking lots.', 500, '/rewards/parking-waiver.png'),
('Library Membership Premium', 'Premium library membership for 6 months', 400, 'experience', 0, 'INR', 'Access to premium books and digital resources.', 200, '/rewards/library-premium.png'),
('Gym Membership Discount', '20% discount on municipal gym membership', 350, 'discount', 0, 'INR', 'Valid for 3 months membership.', 150, '/rewards/gym-discount.png');

-- Create functions for points management
CREATE OR REPLACE FUNCTION add_user_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET total_points = total_points + points_to_add 
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION deduct_user_points(user_id UUID, points_to_deduct INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET total_points = total_points - points_to_deduct 
    WHERE id = user_id AND total_points >= points_to_deduct;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient points';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage policies for public access to images and files
CREATE POLICY "Public read access for issue images" ON storage.objects
  FOR SELECT USING (bucket_id = 'issue-images');

CREATE POLICY "Public read access for voice recordings" ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-recordings');

CREATE POLICY "Public read access for chat attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-attachments');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload issue images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'issue-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload voice recordings" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'voice-recordings' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');
