import { Reward } from '@/types/civic';

export const REWARDS: Reward[] = [
  // Paces Crafts Rewards
  {
    id: 'paces-gift-voucher',
    name: 'Paces Crafts Handmade Gift Voucher',
    description: '₹200 voucher for eco-friendly handicrafts from women artisans',
    points_required: 300,
    partner_id: 'paces-crafts',
    image_url: '/rewards/Paces Crafts Handmade Gift Voucher.png',
    category: 'discount',
    is_active: true,
    stock_quantity: 50,
    redeemed_count: 0,
    expiry_days: 90,
    terms_conditions: 'Valid for 90 days. Can be used for any handmade product. Supports women artisans.',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  // Earth5R Rewards
  {
    id: 'earth5r-certificate',
    name: 'Earth5R Impact Certificate',
    description: 'Certificate for contributing to plastic waste reduction',
    points_required: 250,
    partner_id: 'earth5r',
    image_url: '/rewards/Earth5R Impact Certificate.png',
    category: 'recognition',
    is_active: true,
    stock_quantity: 100,
    redeemed_count: 0,
    expiry_days: null,
    terms_conditions: 'Digital certificate showing your contribution to waste reduction. Can be shared on social media.',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  // Tidy Trails Rewards
  {
    id: 'tidy-trails-cleanup',
    name: 'Tidy Trails Community Cleanup',
    description: 'Join organized community cleanup drive',
    points_required: 200,
    partner_id: 'tidy-trails',
    image_url: '/rewards/Tidy Trails Community Cleanup.png',
    category: 'social_impact',
    is_active: true,
    stock_quantity: 100,
    redeemed_count: 0,
    expiry_days: 45,
    terms_conditions: '2-hour community cleanup. Equipment provided. Make a real impact in your neighborhood.',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  // ReNew Power Rewards
  {
    id: 'renew-badge',
    name: 'ReNew Power Green Energy Badge',
    description: 'Digital badge for supporting clean energy initiatives',
    points_required: 150,
    partner_id: 'renew-power',
    image_url: '/rewards/ReNew Power Green Energy Badge.png',
    category: 'recognition',
    is_active: true,
    stock_quantity: 500,
    redeemed_count: 0,
    expiry_days: null,
    terms_conditions: 'Permanent digital badge. Shows your commitment to clean energy and sustainability.',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  // Community & Recognition Rewards
  {
    id: 'community-recognition',
    name: 'Community Recognition Certificate',
    description: 'Official certificate recognizing your contribution to community sustainability',
    points_required: 200,
    partner_id: null,
    image_url: '/rewards/Community Recognition Certificate.png',
    category: 'recognition',
    is_active: true,
    stock_quantity: 200,
    redeemed_count: 0,
    expiry_days: null,
    terms_conditions: 'Digital certificate recognizing your community impact. Can be shared on social media and used for professional profiles.',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  {
    id: 'tree-planting-certificate',
    name: 'Tree Planting Certificate',
    description: 'Certificate for planting a tree and contributing to environmental restoration',
    points_required: 300,
    partner_id: null,
    image_url: '/rewards/Tree Planting Certificate.png',
    category: 'recognition',
    is_active: true,
    stock_quantity: 150,
    redeemed_count: 0,
    expiry_days: null,
    terms_conditions: 'Certificate issued after verified tree planting. Includes tree location and species information. Valid for lifetime.',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  // Artisan & Creative Rewards
  {
    id: 'handmade-craft-workshop',
    name: 'Handmade Craft Workshop',
    description: 'Learn traditional crafting techniques from master artisans',
    points_required: 350,
    partner_id: 'paces-crafts',
    image_url: '/rewards/Handmade Craft Workshop.png',
    category: 'experience',
    is_active: true,
    stock_quantity: 25,
    redeemed_count: 0,
    expiry_days: 90,
    terms_conditions: '3-hour workshop with master artisans. All materials provided. Learn traditional techniques and take home your creation.',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  {
    id: 'upcycling-project-guide',
    name: 'Upcycling Project Guide',
    description: 'Step-by-step upcycling tutorials to transform waste into useful items',
    points_required: 120,
    partner_id: 'earth5r',
    image_url: '/rewards/Upcycling Project Guide.png',
    category: 'education',
    is_active: true,
    stock_quantity: 100,
    redeemed_count: 0,
    expiry_days: null,
    terms_conditions: 'Comprehensive digital guide with 20+ upcycling projects. Includes video tutorials and material lists. Lifetime access.',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  {
    id: 'artisan-story-access',
    name: 'Artisan Story Access',
    description: 'Exclusive content and behind-the-scenes stories from partner artisans',
    points_required: 100,
    partner_id: 'paces-crafts',
    image_url: '/rewards/Artisan Story Access.png',
    category: 'education',
    is_active: true,
    stock_quantity: 200,
    redeemed_count: 0,
    expiry_days: 60,
    terms_conditions: 'Access to exclusive artisan content including videos, stories, and techniques. Valid for 60 days from redemption.',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  {
    id: 'sustainable-fashion-consultation',
    name: 'Sustainable Fashion Consultation',
    description: 'Personal styling consultation with eco-friendly and sustainable fashion brands',
    points_required: 250,
    partner_id: null,
    image_url: '/rewards/Sustainable Fashion Consultation.png',
    category: 'experience',
    is_active: true,
    stock_quantity: 40,
    redeemed_count: 0,
    expiry_days: 120,
    terms_conditions: '1-hour personal styling session with sustainable fashion expert. Includes wardrobe assessment and eco-friendly brand recommendations.',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
];

// Helper functions
export const getRewardsByPartner = (partnerId: string): Reward[] => {
  return REWARDS.filter(reward => reward.partner_id === partnerId);
};

export const getRewardsByCategory = (category: string): Reward[] => {
  return REWARDS.filter(reward => reward.category === category);
};

export const getActiveRewards = (): Reward[] => {
  return REWARDS.filter(reward => reward.is_active);
};
