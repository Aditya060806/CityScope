-- Update Partner Images Only
-- Run this in Supabase SQL Editor

-- Update Paces Crafts image
UPDATE partners 
SET image_url = '/Artisans/Indian-Traditional-Makers-Artisans/Paces-Crafts-Hero.png'
WHERE name = 'Paces Crafts';

-- Update Earth5R image
UPDATE partners 
SET image_url = '/Artisans/Recycled-Product-Innovators/Earth5R-Global-Action.png'
WHERE name = 'Earth5R';

-- Update Tidy Trails image
UPDATE partners 
SET image_url = '/Artisans/Recycled-Product-Innovators/Tidy-Trails-PepsiCo.png'
WHERE name = 'Tidy Trails';

-- Update ReNew Power image
UPDATE partners 
SET image_url = '/Artisans/Sustainable-Artisan-Marketplaces/ReNew-Power-NetZero.png'
WHERE name = 'ReNew Power';

-- Update Eastman Auto & Power Ltd. image
UPDATE partners 
SET image_url = '/Artisans/Sustainable-Artisan-Marketplaces/Eastman-Solar-Panels.png'
WHERE name = 'Eastman Auto & Power Ltd.';

-- Verify the updates
SELECT name, type, image_url FROM partners ORDER BY name;
