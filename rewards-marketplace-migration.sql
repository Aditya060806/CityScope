-- Rewards & Marketplace Migration Script for CityScope
-- This script safely migrates existing tables and adds new functionality
-- Run this in your Supabase SQL editor

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE partner_type AS ENUM ('artisan','recycler','eco-innovator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reward_category_new AS ENUM ('general', 'eco-friendly', 'artisan', 'recycler', 'experience');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Partners table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type partner_type NOT NULL,
    description TEXT,
    image_url TEXT,
    contact_link TEXT,
    website_url TEXT,
    instagram_url TEXT,
    location TEXT,
    specialties TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing rewards table
DO $$ BEGIN
    -- Add partner_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rewards' AND column_name = 'partner_id') THEN
        ALTER TABLE rewards ADD COLUMN partner_id UUID REFERENCES partners(id);
    END IF;
    
    -- Add stock_quantity column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rewards' AND column_name = 'stock_quantity') THEN
        ALTER TABLE rewards ADD COLUMN stock_quantity INTEGER DEFAULT -1;
    END IF;
    
    -- Add redeemed_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rewards' AND column_name = 'redeemed_count') THEN
        ALTER TABLE rewards ADD COLUMN redeemed_count INTEGER DEFAULT 0;
    END IF;
    
    -- Note: Using existing category column with reward_category enum
    
    -- Add terms_conditions column if it doesn't exist (rename from terms_and_conditions)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rewards' AND column_name = 'terms_conditions') THEN
        ALTER TABLE rewards ADD COLUMN terms_conditions TEXT;
        -- Copy data from existing terms_and_conditions column
        UPDATE rewards SET terms_conditions = terms_and_conditions WHERE terms_and_conditions IS NOT NULL;
    END IF;
END $$;

-- Create User Rewards table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_rewards_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','redeemed','expired','cancelled')),
    voucher_code TEXT UNIQUE NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    partner_contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate existing user_rewards data to new structure
DO $$ BEGIN
    -- Only migrate if the old table exists and new table is empty
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_rewards') 
       AND NOT EXISTS (SELECT 1 FROM user_rewards_new LIMIT 1) THEN
        
        -- Insert data from old table to new table (without delivery_details column)
        INSERT INTO user_rewards_new (
            id, user_id, reward_id, status, redeemed_at, expires_at, 
            partner_contact_info, created_at, updated_at
        )
        SELECT 
            id, user_id, reward_id, 
            CASE 
                WHEN status = 'pending' THEN 'pending'
                WHEN status = 'completed' THEN 'redeemed'
                ELSE 'pending'
            END,
            redeemed_at, expires_at, 
            '{}'::jsonb,  -- Default empty JSON object instead of delivery_details
            created_at, updated_at
        FROM user_rewards;
        
        -- Drop old table
        DROP TABLE user_rewards;
    END IF;
END $$;

-- Rename new table to final name
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_rewards_new') THEN
        ALTER TABLE user_rewards_new RENAME TO user_rewards;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);
CREATE INDEX IF NOT EXISTS idx_rewards_partner_id ON rewards(partner_id);
CREATE INDEX IF NOT EXISTS idx_rewards_points_required ON rewards(points_required);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON user_rewards(status);
CREATE INDEX IF NOT EXISTS idx_user_rewards_voucher_code ON user_rewards(voucher_code);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (only if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_partners_updated_at') THEN
        CREATE TRIGGER update_partners_updated_at 
            BEFORE UPDATE ON partners 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_rewards_updated_at') THEN
        CREATE TRIGGER update_user_rewards_updated_at 
            BEFORE UPDATE ON user_rewards 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to generate unique voucher codes
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 12-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 12));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM user_rewards WHERE voucher_code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem a reward
CREATE OR REPLACE FUNCTION redeem_reward(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS JSONB AS $$
DECLARE
  reward_record RECORD;
  user_points INTEGER;
  voucher_code TEXT;
  result JSONB;
BEGIN
  -- Get reward details
  SELECT * INTO reward_record 
  FROM rewards 
  WHERE id = p_reward_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;
  
  -- Check if reward is in stock
  IF reward_record.stock_quantity > 0 AND reward_record.redeemed_count >= reward_record.stock_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward out of stock');
  END IF;
  
  -- Get user points
  SELECT total_points INTO user_points FROM users WHERE id = p_user_id;
  
  IF user_points IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Check if user has enough points
  IF user_points < reward_record.points_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;
  
  -- Generate voucher code
  voucher_code := generate_voucher_code();
  
  -- Deduct points from user
  UPDATE users 
  SET total_points = total_points - reward_record.points_required 
  WHERE id = p_user_id;
  
  -- Create user reward record
  INSERT INTO user_rewards (user_id, reward_id, voucher_code, expires_at)
  VALUES (
    p_user_id, 
    p_reward_id, 
    voucher_code,
    CASE 
      WHEN reward_record.expiry_days IS NOT NULL 
      THEN NOW() + (reward_record.expiry_days || ' days')::INTERVAL
      ELSE NULL
    END
  );
  
  -- Update redeemed count
  UPDATE rewards 
  SET redeemed_count = redeemed_count + 1 
  WHERE id = p_reward_id;
  
  -- Get partner info for the voucher
  SELECT 
    p.name as partner_name,
    p.contact_link,
    p.website_url,
    p.instagram_url
  INTO reward_record
  FROM partners p
  WHERE p.id = reward_record.partner_id;
  
  -- Return success with voucher details
  result := jsonb_build_object(
    'success', true,
    'voucher_code', voucher_code,
    'reward_name', reward_record.name,
    'partner_name', reward_record.partner_name,
    'partner_contact', reward_record.contact_link,
    'partner_website', reward_record.website_url,
    'partner_instagram', reward_record.instagram_url,
    'points_used', reward_record.points_required
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Partners are publicly readable
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Partners are publicly readable') THEN
        CREATE POLICY "Partners are publicly readable" ON partners 
          FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- User rewards are readable by the user and admins
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_rewards' AND policyname = 'User rewards are readable by owner and admins') THEN
        CREATE POLICY "User rewards are readable by owner and admins" ON user_rewards 
          FOR SELECT USING (
            auth.uid() = user_id OR 
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
          );
    END IF;
END $$;

-- Users can create their own reward redemptions
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_rewards' AND policyname = 'Users can create own reward redemptions') THEN
        CREATE POLICY "Users can create own reward redemptions" ON user_rewards 
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Users can update their own reward redemptions
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_rewards' AND policyname = 'Users can update own reward redemptions') THEN
        CREATE POLICY "Users can update own reward redemptions" ON user_rewards 
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON partners TO authenticated;
GRANT SELECT ON rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_rewards TO authenticated;
GRANT EXECUTE ON FUNCTION redeem_reward(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_voucher_code() TO authenticated;

-- Insert real Indian artisan and eco-innovator partners
INSERT INTO partners (name, type, description, image_url, contact_link, website_url, instagram_url, location, specialties) 
SELECT * FROM (VALUES
('The India Craft House', 'artisan'::partner_type, 'Platform promoting local artisans and preserving heritage crafts across India', '/partners/india-craft-house.jpg', 'https://wa.me/919876543210', 'https://theindiacrafthouse.com', 'https://www.instagram.com/theindiacrafthouse/?hl=en', 'Mumbai, Maharashtra', ARRAY['heritage', 'handmade', 'traditional', 'crafts']),
('Craft Artisans of India', 'artisan'::partner_type, 'Specializing in hand-embroidery techniques like Chikankari and Aari-Zardozi', '/partners/craft-artisans.jpg', 'https://wa.me/919876543211', 'https://craftartisansofindia.com', 'https://www.instagram.com/craftartisansofindia/?hl=en', 'Lucknow, Uttar Pradesh', ARRAY['embroidery', 'chikankari', 'zardozi', 'textiles']),
('Lavanya Handmades', 'artisan'::partner_type, 'Upcycler and DIY enthusiast exploring various art forms, passionate about plants and creativity', '/partners/lavanya-handmades.jpg', 'https://wa.me/919876543212', 'https://lavanyahandmades.com', 'https://www.instagram.com/lavanyahandmades/', 'Bangalore, Karnataka', ARRAY['upcycling', 'diy', 'plants', 'creativity']),
('Popular Indian Artisans', 'artisan'::partner_type, 'Featuring handwoven textiles, crockery, natural fibre products, pottery, woodwork, and unique paintings', '/partners/popular-artisans.jpg', 'https://wa.me/919876543213', 'https://popularindianartisans.com', 'https://www.instagram.com/popular/indian-artisans/', 'Delhi, India', ARRAY['handwoven', 'pottery', 'woodwork', 'paintings']),
('PHOOL', 'eco-innovator'::partner_type, 'Transforms temple flower waste into incense and vermicompost, creating circular economy', '/partners/phool.jpg', 'https://wa.me/919876543214', 'https://en.wikipedia.org/wiki/PHOOL', 'https://www.instagram.com/phool.co/', 'Kanpur, Uttar Pradesh', ARRAY['flower-waste', 'incense', 'vermicompost', 'circular-economy']),
('Banyan Nation', 'recycler'::partner_type, 'Pioneers in plastic recycling, producing safe, traceable recycled polyethylene and polypropylene resins', '/partners/banyan-nation.jpg', 'https://wa.me/919876543215', 'https://www.banyannation.com/', 'https://www.instagram.com/banyannation/', 'Hyderabad, Telangana', ARRAY['plastic-recycling', 'rPE', 'rPP', 'traceable']),
('Without (by Ashaya)', 'recycler'::partner_type, 'Specializes in converting multi-layered plastic waste into recyclable materials and consumer products', '/partners/without-ashaya.jpg', 'https://wa.me/919876543216', 'https://en.wikipedia.org/wiki/Without_(by_Ashaya)', 'https://www.instagram.com/without.ashaya/', 'Pune, Maharashtra', ARRAY['multi-layer-plastic', 'recyclable', 'consumer-products']),
('Recykal', 'recycler'::partner_type, 'Operates Asia''s largest circular economy marketplace, diverting 50,000 tonnes of waste from landfills monthly', '/partners/recykal.jpg', 'https://wa.me/919876543217', 'https://sustainability.google/stories/circular-economy-marketplace/', 'https://www.instagram.com/recykal/', 'Bangalore, Karnataka', ARRAY['circular-economy', 'waste-diversion', 'marketplace']),
('Dharavi Plastic Weaving', 'recycler'::partner_type, 'Community-led initiative repurposing discarded plastic waste into woven items like bags and mats', '/partners/dharavi-weaving.jpg', 'https://wa.me/919876543218', 'https://en.wikipedia.org/wiki/Plastic_weaving_in_Dharavi', 'https://www.instagram.com/dharavi_weaving/', 'Mumbai, Maharashtra', ARRAY['plastic-weaving', 'community', 'bags', 'mats'])
) AS t(name, type, description, image_url, contact_link, website_url, instagram_url, location, specialties)
WHERE NOT EXISTS (SELECT 1 FROM partners LIMIT 1);

-- Insert comprehensive rewards including recognition, municipal services, and community rewards
INSERT INTO rewards (name, description, points_required, category, value, partner_id, image_url, terms_and_conditions, expiry_days, max_redemptions, current_redemptions)
SELECT * FROM (VALUES
-- Recognition Rewards
('Community Recognition Badge', 'Digital badge displayed on your profile for civic engagement', 150, 'recognition'::reward_category, 0, NULL, '/rewards/recognition-badge.jpg', 'Permanent digital badge. No expiry. Displayed on your profile.', 365, 100, 0),
('Civic Hero Certificate', 'Official certificate recognizing your community contributions', 200, 'recognition'::reward_category, 0, NULL, '/rewards/hero-certificate.jpg', 'Digital certificate. Valid for 1 year. Can be downloaded and printed.', 365, 50, 0),
('Mayor''s Appreciation Letter', 'Personal letter from city mayor for outstanding civic engagement', 300, 'recognition'::reward_category, 0, NULL, '/rewards/mayor-letter.jpg', 'Digital letter. Valid for 1 year. Personalized with your name.', 365, 25, 0),

-- Municipal Service Rewards
('Municipal Service Discount', '10% discount on all municipal services including permits and fees', 100, 'discount'::reward_category, 1000, NULL, '/rewards/municipal-discount.jpg', 'Valid for 30 days. Apply at city hall or online portal.', 30, 100, 0),
('Property Tax Reduction', '5% reduction on annual property tax payment', 250, 'discount'::reward_category, 2500, NULL, '/rewards/property-tax.jpg', 'Valid for 1 year. Applied to next tax cycle.', 365, 50, 0),
('Parking Permit Waiver', 'Free parking permit for city-owned lots for 6 months', 180, 'voucher'::reward_category, 1800, NULL, '/rewards/parking-permit.jpg', 'Valid for 6 months. Non-transferable.', 180, 75, 0),

-- Community Experience Rewards
('Community Event Pass', 'Free entry to all community events and festivals', 200, 'voucher'::reward_category, 2500, NULL, '/rewards/event-pass.jpg', 'Valid for 180 days. Includes family pass for 4 people.', 180, 50, 0),
('City Hall VIP Tour', 'Exclusive behind-the-scenes tour with city officials', 300, 'experience'::reward_category, 5000, NULL, '/rewards/vip-tour.jpg', 'Valid for 90 days. Includes lunch with city officials.', 90, 20, 0),
('Council Meeting Observer', 'Front-row seat at city council meetings for 3 months', 150, 'experience'::reward_category, 1500, NULL, '/rewards/council-meeting.jpg', 'Valid for 90 days. Includes meeting materials.', 90, 30, 0),

-- Cash Rewards
('Cash Reward', 'Direct cash transfer to your bank account', 500, 'cash'::reward_category, 2500, NULL, '/rewards/cash-reward.jpg', 'Valid for 365 days. Minimum 500 points required.', 365, 50, 0),
('Gift Card Voucher', 'Rs. 1000 gift card for local businesses', 400, 'voucher'::reward_category, 1000, NULL, '/rewards/gift-card.jpg', 'Valid for 1 year. Redeemable at participating stores.', 365, 100, 0),

-- Partner Rewards (Indian Artisans)
('Heritage Craft Workshop', 'Learn traditional Indian crafts from The India Craft House artisans', 200, 'experience'::reward_category, 2000, (SELECT id FROM partners WHERE name = 'The India Craft House' LIMIT 1), '/rewards/heritage-workshop.jpg', 'Valid for 3 months. Workshop includes materials and take-home craft.', 90, 20, 0),
('Chikankari Embroidery Kit', 'Hand-embroidery kit with Chikankari patterns by Craft Artisans of India', 150, 'voucher'::reward_category, 1500, (SELECT id FROM partners WHERE name = 'Craft Artisans of India' LIMIT 1), '/rewards/chikankari-kit.jpg', 'Valid for 6 months. Includes fabric, threads, and detailed instructions.', 180, 30, 0),
('Upcycled Plant Pot', 'Handmade upcycled plant pot by Lavanya Handmades', 100, 'voucher'::reward_category, 1000, (SELECT id FROM partners WHERE name = 'Lavanya Handmades' LIMIT 1), '/rewards/plant-pot.jpg', 'Valid for 4 months. Each pot is unique and eco-friendly.', 120, 50, 0),
('Handwoven Textile Voucher', 'Traditional handwoven textile from Popular Indian Artisans', 300, 'voucher'::reward_category, 3000, (SELECT id FROM partners WHERE name = 'Popular Indian Artisans' LIMIT 1), '/rewards/handwoven-textile.jpg', 'Valid for 6 months. Choose from various traditional patterns.', 180, 15, 0),
('PHOOL Incense Set', 'Temple flower waste incense set by PHOOL', 120, 'voucher'::reward_category, 1200, (SELECT id FROM partners WHERE name = 'PHOOL' LIMIT 1), '/rewards/phool-incense.jpg', 'Valid for 1 year. Includes 3 different fragrance variants.', 365, 40, 0),
('Recycled Plastic Bag', 'Eco-friendly bag made from recycled plastic by Banyan Nation', 80, 'voucher'::reward_category, 800, (SELECT id FROM partners WHERE name = 'Banyan Nation' LIMIT 1), '/rewards/recycled-bag.jpg', 'Valid for 2 years. Durable and waterproof design.', 730, 100, 0),
('Waste-to-Product Workshop', 'Learn to convert plastic waste into useful products with Without (by Ashaya)', 250, 'experience'::reward_category, 2500, (SELECT id FROM partners WHERE name = 'Without (by Ashaya)' LIMIT 1), '/rewards/waste-workshop.jpg', 'Valid for 2 months. Includes materials and guided instruction.', 60, 25, 0),
('Circular Economy Consultation', 'Personal consultation on waste reduction with Recykal experts', 180, 'experience'::reward_category, 1800, (SELECT id FROM partners WHERE name = 'Recykal' LIMIT 1), '/rewards/consultation.jpg', 'Valid for 3 months. 1-hour online or in-person session.', 90, 35, 0),
('Dharavi Weaving Experience', 'Learn plastic weaving techniques from Dharavi community', 220, 'experience'::reward_category, 2200, (SELECT id FROM partners WHERE name = 'Dharavi Plastic Weaving' LIMIT 1), '/rewards/weaving-experience.jpg', 'Valid for 2 months. Includes community interaction and skill learning.', 60, 20, 0)
) AS t(name, description, points_required, category, value, partner_id, image_url, terms_and_conditions, expiry_days, max_redemptions, current_redemptions)
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE partner_id IS NOT NULL LIMIT 1);

-- Update existing rewards to have default values for new columns
UPDATE rewards SET 
    stock_quantity = COALESCE(stock_quantity, -1),
    redeemed_count = COALESCE(redeemed_count, 0),
    terms_conditions = COALESCE(terms_conditions, 'Standard terms and conditions apply.')
WHERE stock_quantity IS NULL OR redeemed_count IS NULL OR terms_conditions IS NULL;

-- Success message
SELECT 'Rewards & Marketplace migration completed successfully!' as message;
