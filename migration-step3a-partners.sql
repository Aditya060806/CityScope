CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type VARCHAR(50) NOT NULL DEFAULT 'artisan',
  image_url TEXT DEFAULT '',
  website_url VARCHAR(500) DEFAULT '',
  contact_link VARCHAR(500) DEFAULT '',
  instagram_url VARCHAR(500) DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  specialties TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);
