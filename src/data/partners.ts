import { Partner } from '@/types/civic';

export const PARTNERS: Partner[] = [
  // Artisan Partners
  {
    id: 'paces-crafts',
    name: 'Paces Crafts',
    type: 'artisan',
    description: 'Empowers women artisans through exclusive, eco-friendly handicrafts. Focus on sustainable traditional crafts and women empowerment.',
    image_url: '/Partners/Paces Crafts.png',
    contact_link: 'https://www.pacescrafts.com/contact',
    website_url: 'https://www.pacescrafts.com',
    instagram_url: 'https://www.instagram.com/pacescrafts',
    location: 'Jharkhand, India',
    specialties: ['handmade', 'eco-friendly', 'women-empowerment', 'traditional-crafts', 'sustainable'],
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  // Recycler Partners
  {
    id: 'earth5r',
    name: 'Earth5R',
    type: 'recycler',
    description: 'NGO running tech-enabled plastic recovery and upcycling programs across India. Leading circular economy initiatives and waste transformation projects.',
    image_url: '/Partners/Earth5R.png',
    contact_link: 'https://earth5r.org/contact',
    website_url: 'https://earth5r.org',
    instagram_url: 'https://www.instagram.com/earth5r',
    location: 'Mumbai/Delhi, India',
    specialties: ['plastic-recovery', 'upcycling', 'circular-economy', 'waste-transformation', 'tech-enabled'],
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  {
    id: 'tidy-trails',
    name: 'Tidy Trails',
    type: 'recycler',
    description: 'Community-driven plastic waste management and circular economy initiative by PepsiCo India & The Social Lab. Focus on sustainable waste management solutions.',
    image_url: '/Partners/Tidy Trails.png',
    contact_link: 'https://www.pepsicoindia.co.in/contact',
    website_url: 'https://www.pepsicoindia.co.in',
    instagram_url: 'https://www.instagram.com/pepsicoindia',
    location: 'Delhi, India',
    specialties: ['plastic-waste-management', 'community-driven', 'circular-economy', 'sustainable-solutions', 'waste-reduction'],
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  // Eco Innovator Partners
  {
    id: 'renew-power',
    name: 'ReNew Power',
    type: 'eco-innovator',
    description: 'India\'s leading clean energy startup scaling solar power solutions nationwide. Driving the green revolution with innovative renewable energy technologies.',
    image_url: '/Partners/ReNew Power.png',
    contact_link: 'https://netzeroindia.org/contact',
    website_url: 'https://netzeroindia.org',
    instagram_url: 'https://www.instagram.com/renewpower',
    location: 'National, India',
    specialties: ['solar-power', 'clean-energy', 'renewable-energy', 'green-technology', 'sustainability'],
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  },

  {
    id: 'eastman-solar',
    name: 'Eastman Auto & Power Ltd.',
    type: 'eco-innovator',
    description: 'Provides innovative solar energy and smart storage solutions, driving solar sustainability in India. Leading innovations in solar energy industry.',
    image_url: '/Partners/Eastman Auto & Power Ltd..png',
    contact_link: 'https://eastmansolar.in/contact',
    website_url: 'https://eastmansolar.in',
    instagram_url: 'https://www.instagram.com/eastmansolar',
    location: 'India',
    specialties: ['solar-energy', 'smart-storage', 'sustainability', 'innovation', 'renewable-technology'],
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
];

// Helper functions
export const getPartnersByType = (type: 'artisan' | 'recycler' | 'eco-innovator'): Partner[] => {
  return PARTNERS.filter(partner => partner.type === type);
};

export const getPartnerById = (id: string): Partner | undefined => {
  return PARTNERS.find(partner => partner.id === id);
};

export const getActivePartners = (): Partner[] => {
  return PARTNERS.filter(partner => partner.is_active);
};
