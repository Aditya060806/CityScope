-- CityScope Rewards System Migration - Step by Step
-- Run these commands one by one in Supabase SQL Editor

-- Step 1: Remove expensive/commercial rewards
DELETE FROM rewards WHERE name IN (
    'Community Event Voucher',
    'Cash Reward ₹50',
    'Cash Reward ₹100', 
    'Cash Reward ₹200',
    'City Hall Tour',
    'Amazon Gift Card ₹100',
    'Flipkart Gift Card ₹100',
    'Swiggy Food Voucher ₹50',
    'Zomato Food Voucher ₹50',
    'Movie Ticket Voucher',
    'Library Membership Premium',
    'Gym Membership Discount'
);

-- Step 2: Create new enum type (drop if exists first)
DROP TYPE IF EXISTS reward_category_new;
CREATE TYPE reward_category_new AS ENUM ('recognition', 'discount', 'experience', 'access', 'education', 'social_impact');

-- Step 3: Add temporary column (drop if exists first)
ALTER TABLE rewards DROP COLUMN IF EXISTS category_new;
ALTER TABLE rewards ADD COLUMN category_new reward_category_new;

-- Step 4: Map existing categories to new ones
UPDATE rewards SET category_new = 'recognition' WHERE category = 'recognition';
UPDATE rewards SET category_new = 'discount' WHERE category = 'discount';
UPDATE rewards SET category_new = 'experience' WHERE category = 'experience';
UPDATE rewards SET category_new = 'access' WHERE category = 'voucher';

-- Step 5: Drop old column and rename new one
ALTER TABLE rewards DROP COLUMN category;
ALTER TABLE rewards RENAME COLUMN category_new TO category;

-- Step 6: Drop old enum and rename new one
DROP TYPE reward_category;
ALTER TYPE reward_category_new RENAME TO reward_category;

-- Step 7: Add new meaningful rewards
INSERT INTO rewards (name, description, points_required, category, value, currency, terms_and_conditions, max_redemptions, image_url) VALUES

-- Recognition & Awards
('Civic Hero Badge', 'Digital badge for active community participation', 50, 'recognition', 0, 'INR', 'Permanent digital badge. Can be displayed on profile.', 10000, '/rewards/civic-hero-badge.png'),
('Community Champion Certificate', 'Official digital certificate for outstanding civic contribution', 100, 'recognition', 0, 'INR', 'Digital certificate. Can be printed or shared on social media.', 5000, '/rewards/champion-certificate.png'),
('Mayor''s Appreciation Letter', 'Personal letter from Mayor acknowledging your contribution', 200, 'recognition', 0, 'INR', 'Digital letter with official seal. Delivered via email.', 1000, '/rewards/mayor-letter.png'),
('Civic Leader Status', 'Special status in the app with priority support', 300, 'recognition', 0, 'INR', 'Enhanced profile visibility and priority customer support.', 500, '/rewards/leader-status.png'),

-- Municipal Discounts
('Property Tax Discount', '5% discount on next property tax payment', 250, 'discount', 5, 'INR', 'One-time use. Valid for current financial year.', 500, '/rewards/property-tax-discount.png'),
('Water Bill Waiver', 'Waive off next month water bill (up to ₹200)', 400, 'discount', 200, 'INR', 'Maximum ₹200 waiver. Valid for residential connections only.', 300, '/rewards/water-bill-waiver.png'),
('Electricity Bill Discount', '10% discount on next electricity bill', 350, 'discount', 10, 'INR', 'One-time use. Valid for residential connections only.', 400, '/rewards/electricity-discount.png'),
('Waste Collection Priority', 'Priority waste collection for 1 month', 150, 'discount', 0, 'INR', 'Early morning collection slot. Valid for 30 days.', 1000, '/rewards/waste-priority.png'),

-- Community Experiences
('Community Garden Plot', 'Free access to community garden for 3 months', 300, 'experience', 0, 'INR', '3x3 feet plot. Seeds and basic tools provided.', 100, '/rewards/garden-plot.png'),
('Municipal Library VIP Access', 'Priority access to new books and digital resources', 200, 'experience', 0, 'INR', '6 months VIP membership. Early access to new arrivals.', 200, '/rewards/library-vip.png'),
('City Planning Meeting Invite', 'Invitation to attend city planning committee meeting', 400, 'experience', 0, 'INR', 'Observer status. Must follow meeting protocols.', 50, '/rewards/planning-meeting.png'),
('Municipal Workshop Access', 'Free access to municipal workshops and training', 250, 'experience', 0, 'INR', 'Valid for any workshop in next 6 months.', 200, '/rewards/workshop-access.png'),
('City Hall Virtual Tour', 'Exclusive virtual tour of city hall operations', 150, 'experience', 0, 'INR', 'Live session with city officials. Q&A included.', 500, '/rewards/virtual-tour.png'),
('Community Cleanup Kit', 'Free cleanup kit for community service', 100, 'experience', 0, 'INR', 'Gloves, bags, and safety equipment provided.', 1000, '/rewards/cleanup-kit.png'),

-- Special Access
('Priority Issue Resolution', 'Your reported issues get priority in resolution queue', 200, 'access', 0, 'INR', 'Valid for next 5 issues. Faster response time guaranteed.', 1000, '/rewards/priority-resolution.png'),
('Advanced Analytics Access', 'Access to detailed city analytics and reports', 300, 'access', 0, 'INR', '6 months access to premium analytics dashboard.', 200, '/rewards/analytics-access.png'),
('Beta Feature Access', 'Early access to new app features and updates', 150, 'access', 0, 'INR', 'Test new features before public release.', 500, '/rewards/beta-access.png'),
('Custom Profile Theme', 'Exclusive profile theme and customization options', 100, 'access', 0, 'INR', 'Unique color scheme and profile layout.', 2000, '/rewards/profile-theme.png'),
('Issue Tracking Dashboard', 'Personal dashboard to track all your reported issues', 250, 'access', 0, 'INR', 'Advanced tracking with detailed status updates.', 1000, '/rewards/tracking-dashboard.png'),
('Municipal Office VIP Pass', 'Skip the queue at municipal offices for 1 month', 300, 'access', 0, 'INR', 'Priority service at all municipal counters.', 200, '/rewards/vip-pass.png'),
('City Council Meeting Observer', 'Attend city council meeting as observer', 400, 'access', 0, 'INR', 'One-time access. Must follow meeting protocols.', 100, '/rewards/council-meeting.png'),
('Emergency Services Priority', 'Priority response for non-emergency municipal services', 250, 'access', 0, 'INR', 'Faster response for maintenance requests.', 300, '/rewards/priority-services.png'),

-- Learning & Development
('Digital Citizenship Course', 'Free online course on digital citizenship and civic rights', 200, 'education', 0, 'INR', 'Self-paced course with completion certificate.', 500, '/rewards/digital-citizenship.png'),
('Local History Workshop', 'Workshop on local history and heritage', 150, 'education', 0, 'INR', '2-hour session with local historian.', 300, '/rewards/history-workshop.png'),
('Civic Rights Seminar', 'Seminar on citizen rights and responsibilities', 180, 'education', 0, 'INR', 'Half-day seminar with legal experts.', 200, '/rewards/rights-seminar.png'),
('Environmental Awareness Kit', 'Educational kit about local environmental issues', 120, 'education', 0, 'INR', 'Printed materials and digital resources.', 400, '/rewards/environment-kit.png'),

-- Social Impact
('Tree Plantation Certificate', 'Certificate for sponsoring a tree in your name', 500, 'social_impact', 0, 'INR', 'Tree planted in public park with your name plaque.', 100, '/rewards/tree-certificate.png'),
('Community Notice Board Space', 'Display your message on community notice boards', 300, 'social_impact', 0, 'INR', '1 week display on 5 major community boards.', 200, '/rewards/notice-board.png'),
('Street Naming Suggestion', 'Submit name suggestion for new streets/areas', 400, 'social_impact', 0, 'INR', 'Your suggestion will be considered by naming committee.', 50, '/rewards/street-naming.png'),
('Community Newsletter Feature', 'Your story featured in monthly community newsletter', 350, 'social_impact', 0, 'INR', 'Digital and print newsletter distribution.', 100, '/rewards/newsletter-feature.png'),
('Civic Achievement Trophy', 'Physical trophy for outstanding civic contribution', 600, 'social_impact', 0, 'INR', 'Annual award ceremony. Trophy delivered to your address.', 25, '/rewards/achievement-trophy.png'),
('Community Impact Report', 'Detailed report on your civic contributions', 200, 'social_impact', 0, 'INR', 'Annual report showing your community impact.', 1000, '/rewards/impact-report.png'),
('Neighborhood Champion Title', 'Official title for your neighborhood', 400, 'social_impact', 0, 'INR', 'Recognition as neighborhood civic champion.', 100, '/rewards/neighborhood-champion.png'),
('Civic Engagement Score', 'Personal civic engagement score and ranking', 100, 'social_impact', 0, 'INR', 'Monthly score based on your civic activities.', 5000, '/rewards/engagement-score.png'),
('Community Service Hours', 'Official record of community service hours', 150, 'social_impact', 0, 'INR', 'Verified hours that can be used for official purposes.', 2000, '/rewards/service-hours.png');

-- Step 8: Create achievement system
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    points_required INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Insert achievement definitions
INSERT INTO achievements (name, description, icon, points_required, category) VALUES
('First Report', 'Report your first civic issue', '🎯', 10, 'milestone'),
('Community Helper', 'Report 10 issues', '🤝', 100, 'milestone'),
('Civic Champion', 'Report 50 issues', '🏆', 500, 'milestone'),
('City Hero', 'Report 100 issues', '⭐', 1000, 'milestone'),
('Issue Resolver', 'Have 10 issues resolved', '✅', 150, 'impact'),
('Community Voice', 'Get 50 upvotes on your reports', '📢', 200, 'engagement'),
('Active Citizen', 'Report issues for 30 consecutive days', '📅', 300, 'consistency'),
('Problem Solver', 'Report issues in 5 different categories', '🔧', 250, 'diversity'),
('Local Expert', 'Report 20 issues in your neighborhood', '🏘️', 400, 'local'),
('Civic Leader', 'Help resolve 25 issues through feedback', '👑', 600, 'leadership');

-- Step 10: Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Step 11: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_category ON rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_points_required ON rewards(points_required);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Step 12: Add system settings for new reward categories
INSERT INTO system_settings (key, value, description) VALUES
('reward_categories', '{
  "recognition": {
    "label": "Recognition & Awards",
    "icon": "🏆",
    "color": "#f59e0b",
    "description": "Digital badges, certificates, and official recognition"
  },
  "discount": {
    "label": "Municipal Discounts", 
    "icon": "💰",
    "color": "#10b981",
    "description": "Discounts on municipal services and bills"
  },
  "experience": {
    "label": "Community Experiences",
    "icon": "🎯",
    "color": "#3b82f6", 
    "description": "Access to workshops, tours, and community activities"
  },
  "access": {
    "label": "Special Access",
    "icon": "🔑",
    "color": "#8b5cf6",
    "description": "Priority access and special privileges"
  },
  "education": {
    "label": "Learning & Development",
    "icon": "📚",
    "color": "#06b6d4",
    "description": "Educational courses and skill development"
  },
  "social_impact": {
    "label": "Social Impact",
    "icon": "🤝",
    "color": "#ef4444",
    "description": "Community impact and social recognition"
  }
}', 'Reward categories configuration for the rewards system');

-- Step 13: Add points earning system
INSERT INTO system_settings (key, value, description) VALUES
('points_system', '{
  "issue_reported": 10,
  "issue_verified": 5,
  "issue_resolved": 15,
  "issue_upvoted": 1,
  "helpful_feedback": 5,
  "community_cleanup": 20,
  "workshop_attended": 15,
  "meeting_participated": 25,
  "monthly_active": 30,
  "first_report_month": 50,
  "issue_shared": 2,
  "feedback_provided": 3
}', 'Points earning system for civic engagement activities');

-- Migration completed successfully!
-- You can now use the new meaningful rewards system
