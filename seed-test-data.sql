-- ============================================================================
-- CityScope: Seed Test Data
-- Run this in Supabase SQL Editor AFTER running create-missing-tables.sql
-- ============================================================================

-- ============================================================================
-- 1. SEED PARTNERS
-- ============================================================================

INSERT INTO partners (name, description, type, image_url, website_url, contact_link, instagram_url, location, specialties, is_active)
VALUES
  (
    'Green Earth Crafts',
    'Traditional artisans creating eco-friendly home decor from recycled materials. Every product tells a story of sustainability.',
    'artisan',
    'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400',
    'https://greenearthcrafts.example.com',
    'mailto:contact@greenearthcrafts.example.com',
    'https://instagram.com/greenearthcrafts',
    'Mumbai, Maharashtra',
    ARRAY['pottery', 'home decor', 'recycled crafts'],
    true
  ),
  (
    'Urban Recyclers Co-op',
    'A cooperative of urban recyclers transforming waste into valuable resources. Partnering with communities for cleaner cities.',
    'recycler',
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    'https://urbanrecyclers.example.com',
    'mailto:info@urbanrecyclers.example.com',
    'https://instagram.com/urbanrecyclers',
    'Delhi, NCR',
    ARRAY['plastic recycling', 'e-waste', 'composting'],
    true
  ),
  (
    'EcoTech Solutions',
    'Innovative technology solutions for sustainable living. Smart devices that help reduce your carbon footprint.',
    'eco-innovator',
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400',
    'https://ecotechsolutions.example.com',
    'mailto:hello@ecotechsolutions.example.com',
    'https://instagram.com/ecotechsolutions',
    'Bangalore, Karnataka',
    ARRAY['smart home', 'energy efficiency', 'IoT'],
    true
  ),
  (
    'Heritage Weavers',
    'Preserving traditional Indian weaving techniques while providing sustainable livelihoods to artisan communities.',
    'artisan',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
    'https://heritageweavers.example.com',
    'mailto:support@heritageweavers.example.com',
    'https://instagram.com/heritageweavers',
    'Varanasi, Uttar Pradesh',
    ARRAY['silk weaving', 'cotton textiles', 'handloom'],
    true
  ),
  (
    'Clean City Foundation',
    'Non-profit working towards cleaner cities through community engagement, education, and waste management programs.',
    'recycler',
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400',
    'https://cleancityfoundation.example.com',
    'mailto:volunteer@cleancityfoundation.example.com',
    NULL,
    'Chennai, Tamil Nadu',
    ARRAY['waste management', 'community cleanup', 'education'],
    true
  );

-- ============================================================================
-- 2. SEED REWARDS (linked to partners above)
-- ============================================================================

-- Get partner IDs dynamically
DO $$
DECLARE
  green_earth_id UUID;
  urban_recyclers_id UUID;
  ecotech_id UUID;
  heritage_weavers_id UUID;
  clean_city_id UUID;
BEGIN
  SELECT id INTO green_earth_id FROM partners WHERE name = 'Green Earth Crafts' LIMIT 1;
  SELECT id INTO urban_recyclers_id FROM partners WHERE name = 'Urban Recyclers Co-op' LIMIT 1;
  SELECT id INTO ecotech_id FROM partners WHERE name = 'EcoTech Solutions' LIMIT 1;
  SELECT id INTO heritage_weavers_id FROM partners WHERE name = 'Heritage Weavers' LIMIT 1;
  SELECT id INTO clean_city_id FROM partners WHERE name = 'Clean City Foundation' LIMIT 1;

  INSERT INTO rewards (partner_id, name, description, category, points_required, value, image_url, stock_quantity, expiry_days, terms_and_conditions, is_active)
  VALUES
    (
      green_earth_id,
      '10% Off Eco Home Decor',
      'Get 10% discount on any handcrafted eco-friendly home decor item from Green Earth Crafts.',
      'discount',
      100,
      10,
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400',
      50,
      30,
      'Valid for one purchase. Cannot combine with other offers. Valid within 30 days of redemption.',
      true
    ),
    (
      green_earth_id,
      'Free Pottery Workshop',
      'Enjoy a free 2-hour pottery workshop at Green Earth Crafts studio. Learn traditional techniques!',
      'experience',
      250,
      500,
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400',
      20,
      60,
      'Subject to availability. Book at least 3 days in advance. Workshop held on weekends only.',
      true
    ),
    (
      urban_recyclers_id,
      'Recycling Champion Certificate',
      'Official recognition certificate for your commitment to urban recycling and clean city initiatives.',
      'recognition',
      50,
      0,
      'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=400',
      -1,
      NULL,
      'Digital certificate sent to your registered email.',
      true
    ),
    (
      urban_recyclers_id,
      'E-Waste Pickup Service',
      'Free scheduled e-waste pickup from your doorstep by Urban Recyclers Co-op.',
      'access',
      150,
      200,
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400',
      100,
      45,
      'Available in Delhi NCR only. Maximum 10kg per pickup. Schedule 48 hours in advance.',
      true
    ),
    (
      ecotech_id,
      'Smart Energy Monitor',
      'Get a free smart plug that monitors your electricity consumption in real-time.',
      'access',
      500,
      1500,
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
      10,
      14,
      'Limited stock. Ships within 7 working days. 1 year warranty included.',
      true
    ),
    (
      heritage_weavers_id,
      'Handloom Workshop Access',
      'Exclusive virtual workshop access to learn traditional handloom weaving techniques.',
      'education',
      200,
      300,
      'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400',
      30,
      90,
      'Online workshop. Link sent to email. Available in Hindi and English.',
      true
    ),
    (
      clean_city_id,
      'Tree Planting in Your Name',
      'We plant a tree in your name in a community green space. You receive a photo and GPS location.',
      'social_impact',
      75,
      100,
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
      -1,
      NULL,
      'Tree planted within 30 days. Certificate and photo emailed to you.',
      true
    ),
    (
      clean_city_id,
      'Community Cleanup Leader Badge',
      'Earn the official Community Cleanup Leader badge on your CityScope profile.',
      'recognition',
      25,
      0,
      'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=400',
      -1,
      NULL,
      'Badge appears on your public profile permanently.',
      true
    );
END $$;

-- ============================================================================
-- 3. VERIFY SEED DATA
-- ============================================================================

-- You can run these queries to verify:
-- SELECT count(*) FROM partners;  -- Should be 5
-- SELECT count(*) FROM rewards;   -- Should be 8
-- SELECT p.name, count(r.id) as reward_count FROM partners p LEFT JOIN rewards r ON r.partner_id = p.id GROUP BY p.name;
