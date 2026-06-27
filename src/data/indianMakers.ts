export interface IndianMaker {
  id: string;
  name: string;
  category: 'traditional' | 'recycled' | 'marketplace';
  subcategory: string;
  description: string;
  website: string;
  instagram?: string;
  image: string;
  established?: string;
  artisans?: number;
  products?: number;
  specialties: string[];
  sustainability: string[];
  location: string;
  featured: boolean;
  rating: number;
  priceRange: 'budget' | 'mid' | 'premium' | 'luxury';
}

// Helper function to get actual images from public folder
const getArtisanImage = (imageName: string) => {
  return `/Artisans/Indian-Traditional-Makers-Artisans/${imageName}`;
};

// Helper function to get recycled innovator images from public folder
const getRecycledInnovatorImage = (imageName: string) => {
  return `/Artisans/Recycled-Product-Innovators/${imageName}`;
};

// Helper function to get sustainable artisan marketplace images from public folder
const getMarketplaceImage = (imageName: string) => {
  return `/Artisans/Sustainable-Artisan-Marketplaces/${imageName}`;
};

// Helper function to generate placeholder images for other categories
const getPlaceholderImage = (name: string, color: string = '4F46E5') => {
  const text = name.replace(/[^a-zA-Z0-9]/g, '+').toUpperCase();
  return `https://via.placeholder.com/400x300/${color}/FFFFFF?text=${text}`;
};

export const indianMakers: IndianMaker[] = [
  // Traditional Makers / Artisans
  {
    id: 'fabindia',
    name: 'Fabindia',
    category: 'traditional',
    subcategory: 'Handicrafts & Textiles',
    description: 'Largest handicraft retailer with over 60 years of heritage. Partners with thousands of artisans across India and runs modern retail outlets worldwide.',
    website: 'https://www.fabindia.com',
    instagram: 'https://www.instagram.com/fabindiaofficial',
    image: getArtisanImage('FabIndia.png'),
    established: '1960',
    artisans: 55000,
    products: 200000,
    specialties: ['Handloom Textiles', 'Home Decor', 'Furniture', 'Personal Care'],
    sustainability: ['Fair Trade', 'Artisan Empowerment', 'Traditional Techniques'],
    location: 'New Delhi, India',
    featured: true,
    rating: 4.8,
    priceRange: 'mid'
  },
  {
    id: 'jaipur-rugs',
    name: 'Jaipur Rugs',
    category: 'traditional',
    subcategory: 'Carpets & Rugs',
    description: 'Global leader in artisan carpets. Works with 40,000+ rural weavers ensuring direct profit-sharing and community upliftment.',
    website: 'https://www.jaipurrugs.com/in/',
    instagram: 'https://www.instagram.com/jaipurrugsfoundation',
    image: getArtisanImage('JaipurRugs.jpg'),
    established: '1978',
    artisans: 40000,
    products: 50000,
    specialties: ['Handwoven Carpets', 'Rugs', 'Home Textiles', 'Custom Designs'],
    sustainability: ['Direct Trade', 'Rural Development', 'Women Empowerment'],
    location: 'Jaipur, Rajasthan',
    featured: true,
    rating: 4.9,
    priceRange: 'premium'
  },
  {
    id: 'craftsvilla',
    name: 'Craftsvilla',
    category: 'traditional',
    subcategory: 'Online Marketplace',
    description: 'Online marketplace hosting 4+ million handmade products from 25,000+ artisans, focused on ethnic wear, handicrafts, and jewelry.',
    website: 'https://thecraftsvilla.in/',
    instagram: 'https://www.instagram.com/craftsvilla',
    image: getArtisanImage('CraftsVilla.png'),
    established: '2011',
    artisans: 25000,
    products: 4000000,
    specialties: ['Ethnic Wear', 'Jewelry', 'Handicrafts', 'Home Decor'],
    sustainability: ['Artisan Support', 'Traditional Craft Preservation', 'Rural Employment'],
    location: 'Mumbai, Maharashtra',
    featured: true,
    rating: 4.6,
    priceRange: 'budget'
  },
  {
    id: 'amazon-karigar',
    name: 'Amazon Karigar',
    category: 'traditional',
    subcategory: 'E-commerce Platform',
    description: 'Amazon\'s dedicated platform for Indian artisans, featuring 1 lakh+ handmade items and supporting 12 lakh artisans nationwide.',
    website: 'https://www.amazon.in/karigar',
    instagram: 'https://www.instagram.com/amazonkarigar',
    image: getArtisanImage('Amazon Karigar.png'),
    established: '2015',
    artisans: 1200000,
    products: 100000,
    specialties: ['Handmade Products', 'Regional Crafts', 'Artisan Stories', 'Digital Marketplace'],
    sustainability: ['Digital Inclusion', 'Artisan Empowerment', 'Market Access'],
    location: 'Pan India',
    featured: true,
    rating: 4.5,
    priceRange: 'budget'
  },
  {
    id: 'india-craft-house',
    name: 'India Craft House',
    category: 'traditional',
    subcategory: 'Direct-to-Artisan',
    description: 'Direct-to-artisan platform showcasing regional crafts, home décor, and fashion. Offers international shipping.',
    website: 'https://www.indiacrafthouse.com',
    instagram: 'https://www.instagram.com/indiacrafthouse',
    image: getArtisanImage('India Craft House.png'),
    established: '2010',
    artisans: 5000,
    products: 50000,
    specialties: ['Regional Crafts', 'Home Decor', 'Fashion', 'International Shipping'],
    sustainability: ['Direct Trade', 'Craft Preservation', 'Global Reach'],
    location: 'Delhi NCR',
    featured: false,
    rating: 4.4,
    priceRange: 'mid'
  },
  {
    id: 'goswadeshi',
    name: 'GoSwadeshi',
    category: 'traditional',
    subcategory: 'Handloom & Crafts',
    description: 'Award-winning marketplace focusing on handlooms and crafts with sustainable practices.',
    website: 'https://goswadeshi.in',
    instagram: 'https://www.instagram.com/goswadeshi',
    image: getArtisanImage('GoSwadeshi.jpg'),
    established: '2015',
    artisans: 10000,
    products: 25000,
    specialties: ['Handloom Textiles', 'Traditional Crafts', 'Sustainable Fashion', 'Rural Artisans'],
    sustainability: ['Sustainable Practices', 'Handloom Revival', 'Rural Development'],
    location: 'Bangalore, Karnataka',
    featured: false,
    rating: 4.7,
    priceRange: 'mid'
  },
  {
    id: 'sabyasachi',
    name: 'Sabyasachi',
    category: 'traditional',
    subcategory: 'Luxury Fashion',
    description: 'Iconic luxury fashion house that integrates Indian craftsmanship into high-end collections with global recognition.',
    website: 'https://www.sabyasachi.com',
    instagram: 'https://www.instagram.com/sabyasachiofficial',
    image: getArtisanImage('Sabyasachi.png'),
    established: '1999',
    artisans: 2000,
    products: 5000,
    specialties: ['Bridal Wear', 'Couture', 'Jewelry', 'Home Decor'],
    sustainability: ['Craft Revival', 'Luxury Heritage', 'Global Recognition'],
    location: 'Kolkata, West Bengal',
    featured: true,
    rating: 4.9,
    priceRange: 'luxury'
  },
  {
    id: 'punarvi',
    name: 'PUNARVI',
    category: 'traditional',
    subcategory: 'Thrift & Preloved',
    description: 'Popular thrift and preloved ethnic/designer shop with strong sustainability focus.',
    website: 'https://www.instagram.com/closet_punarvi',
    instagram: 'https://www.instagram.com/closet_punarvi',
    image: getArtisanImage('PUNARVI.png'),
    established: '2018',
    artisans: 0,
    products: 10000,
    specialties: ['Thrift Fashion', 'Preloved Designer', 'Ethnic Wear', 'Sustainable Shopping'],
    sustainability: ['Circular Fashion', 'Waste Reduction', 'Sustainable Consumption'],
    location: 'Mumbai, Maharashtra',
    featured: false,
    rating: 4.5,
    priceRange: 'budget'
  },
  {
    id: 'itokri',
    name: 'iTokri',
    category: 'traditional',
    subcategory: 'Crafts Marketplace',
    description: 'Major online crafts marketplace, offering curated, region-specific artisan products across India.',
    website: 'https://itokri.com',
    instagram: 'https://www.instagram.com/itokri',
    image: getArtisanImage('iTokri.png'),
    established: '2012',
    artisans: 15000,
    products: 100000,
    specialties: ['Regional Crafts', 'Curated Products', 'Artisan Stories', 'Cultural Heritage'],
    sustainability: ['Craft Preservation', 'Cultural Heritage', 'Artisan Support'],
    location: 'Delhi NCR',
    featured: false,
    rating: 4.6,
    priceRange: 'mid'
  },
  {
    id: 'varnam',
    name: 'Varnam Craft Collective',
    category: 'traditional',
    subcategory: 'Contemporary Craft',
    description: 'Recognized for contemporary design using traditional craft practices.',
    website: 'https://www.varnam.co.in',
    instagram: 'https://www.instagram.com/varnamcollective',
    image: getArtisanImage('Varnam Craft Collective.png'),
    established: '2016',
    artisans: 500,
    products: 5000,
    specialties: ['Contemporary Design', 'Traditional Techniques', 'Modern Craft', 'Design Innovation'],
    sustainability: ['Design Innovation', 'Craft Modernization', 'Contemporary Heritage'],
    location: 'Chennai, Tamil Nadu',
    featured: false,
    rating: 4.7,
    priceRange: 'premium'
  },

  // Recycled Product Innovators
  {
    id: 'gravita-india',
    name: 'Gravita India Ltd',
    category: 'recycled',
    subcategory: 'Metal Recycling',
    description: 'National leader in lead and aluminum recycling. Serves major corporate clients, listed on Indian exchanges.',
    website: 'https://www.gravitaindia.com',
    instagram: 'https://www.instagram.com/gravitaindia',
    image: getRecycledInnovatorImage('Gravita India Ltd.png'),
    established: '1992',
    artisans: 0,
    products: 0,
    specialties: ['Lead Recycling', 'Aluminum Recycling', 'Corporate Solutions', 'Environmental Compliance'],
    sustainability: ['Metal Recycling', 'Waste Reduction', 'Circular Economy', 'Environmental Impact'],
    location: 'Jaipur, Rajasthan',
    featured: true,
    rating: 4.5,
    priceRange: 'mid'
  },
  {
    id: 'banyan-nation',
    name: 'Banyan Nation',
    category: 'recycled',
    subcategory: 'Plastic Recycling',
    description: 'Pioneering plastics circular economy startup, working with major FMCG brands to recycle responsibly.',
    website: 'https://www.banyannation.com',
    instagram: 'https://www.instagram.com/banyannation',
    image: getRecycledInnovatorImage('Banyan Nation.png'),
    established: '2013',
    artisans: 0,
    products: 0,
    specialties: ['Plastic Recycling', 'Circular Economy', 'FMCG Partnerships', 'Waste Management'],
    sustainability: ['Plastic Circularity', 'Waste Reduction', 'Corporate Sustainability', 'Innovation'],
    location: 'Hyderabad, Telangana',
    featured: true,
    rating: 4.6,
    priceRange: 'mid'
  },
  {
    id: 'ganesha-ecosphere',
    name: 'Ganesha Ecosphere Ltd',
    category: 'recycled',
    subcategory: 'PET Recycling',
    description: 'India\'s top producer of rPET fiber, recycling PET waste with a large dealer network nationwide.',
    website: 'https://www.ganeshaecosphere.com',
    instagram: 'https://www.instagram.com/ganeshaecosphere',
    image: getRecycledInnovatorImage('Ganesha Ecosphere Ltd.png'),
    established: '2002',
    artisans: 0,
    products: 0,
    specialties: ['PET Recycling', 'rPET Fiber', 'Textile Industry', 'Waste Processing'],
    sustainability: ['PET Circularity', 'Fiber Innovation', 'Waste Processing', 'Textile Sustainability'],
    location: 'Delhi NCR',
    featured: true,
    rating: 4.4,
    priceRange: 'mid'
  },
  {
    id: 'recykal',
    name: 'Recykal',
    category: 'recycled',
    subcategory: 'Digital Marketplace',
    description: 'India\'s most advanced digital marketplace for circular economy. Works with government bodies and corporates.',
    website: 'https://www.recykal.com',
    instagram: 'https://www.instagram.com/recykal',
    image: getRecycledInnovatorImage('Recykal.jpg'),
    established: '2016',
    artisans: 0,
    products: 0,
    specialties: ['Digital Marketplace', 'Waste Management', 'Government Partnerships', 'Corporate Solutions'],
    sustainability: ['Digital Innovation', 'Waste Management', 'Circular Economy', 'Technology'],
    location: 'Hyderabad, Telangana',
    featured: true,
    rating: 4.7,
    priceRange: 'mid'
  },
  {
    id: 'shakti-plastic',
    name: 'The Shakti Plastic Industries',
    category: 'recycled',
    subcategory: 'Plastic Innovation',
    description: 'India\'s largest established plastics recycler, known for advanced innovation.',
    website: 'https://www.shaktiplasticinds.com',
    instagram: 'https://www.instagram.com/theshiplastics',
    image: getRecycledInnovatorImage('The Shakti Plastic Industries.jpg'),
    established: '1988',
    artisans: 0,
    products: 0,
    specialties: ['Plastic Recycling', 'Innovation', 'Manufacturing', 'Environmental Solutions'],
    sustainability: ['Plastic Innovation', 'Waste Processing', 'Environmental Solutions', 'Technology'],
    location: 'Mumbai, Maharashtra',
    featured: false,
    rating: 4.3,
    priceRange: 'mid'
  },
  {
    id: 'phool-co',
    name: 'Phool.co',
    category: 'recycled',
    subcategory: 'Flower Waste Innovation',
    description: 'Converts temple flower waste into bio-packaging and fragrance products. Known for sustainability innovation.',
    website: 'https://phool.co',
    instagram: 'https://www.instagram.com/phool.co',
    image: getRecycledInnovatorImage('Phool.co.png'),
    established: '2017',
    artisans: 100,
    products: 50,
    specialties: ['Flower Waste', 'Bio-packaging', 'Fragrance Products', 'Temple Waste'],
    sustainability: ['Waste Innovation', 'Bio-materials', 'Circular Economy', 'Social Impact'],
    location: 'Kanpur, Uttar Pradesh',
    featured: true,
    rating: 4.8,
    priceRange: 'mid'
  },
  {
    id: 'attero-recycling',
    name: 'Attero Recycling',
    category: 'recycled',
    subcategory: 'E-waste Recycling',
    description: 'India\'s largest e-waste recycler and lithium battery recovery leader, recycling 3 lakh tonnes/year.',
    website: 'https://www.attero.in',
    instagram: 'https://www.instagram.com/atterorecycling',
    image: getRecycledInnovatorImage('Attero Recycling.png'),
    established: '2008',
    artisans: 0,
    products: 0,
    specialties: ['E-waste Recycling', 'Battery Recovery', 'Electronics Processing', 'Precious Metals'],
    sustainability: ['E-waste Management', 'Resource Recovery', 'Environmental Protection', 'Technology'],
    location: 'Noida, Uttar Pradesh',
    featured: true,
    rating: 4.6,
    priceRange: 'mid'
  },

  // Sustainable / Artisan Marketplaces
  {
    id: 'etsy-india',
    name: 'Etsy India',
    category: 'marketplace',
    subcategory: 'Global Handmade',
    description: 'Global marketplace for handmade and vintage goods, featuring a strong base of Indian sellers and designers.',
    website: 'https://www.etsy.com/in-en',
    instagram: 'https://www.instagram.com/etsy',
    image: getMarketplaceImage('Etsy India.png'),
    established: '2005',
    artisans: 100000,
    products: 10000000,
    specialties: ['Handmade Goods', 'Vintage Items', 'Global Marketplace', 'Creative Community'],
    sustainability: ['Supporting Creators', 'Handmade Focus', 'Global Reach', 'Community Building'],
    location: 'Global (India Focus)',
    featured: true,
    rating: 4.4,
    priceRange: 'budget'
  },
  {
    id: 'megastores',
    name: 'Megastores',
    category: 'marketplace',
    subcategory: 'Social Marketplace',
    description: 'Social marketplace promoting authenticity and transparency for Indian artisans and weavers.',
    website: 'https://www.megastores.com',
    instagram: 'https://www.instagram.com/megastores.in',
    image: getMarketplaceImage('Megastores.png'),
    established: '2016',
    artisans: 8000,
    products: 75000,
    specialties: ['Artisan Products', 'Transparency', 'Social Impact', 'Authentic Crafts'],
    sustainability: ['Artisan Support', 'Transparency', 'Social Impact', 'Authentic Products'],
    location: 'Mumbai, Maharashtra',
    featured: false,
    rating: 4.4,
    priceRange: 'mid'
  },
  {
    id: 'virgio',
    name: 'Virgio',
    category: 'marketplace',
    subcategory: 'Sustainable Fashion',
    description: 'Indian sustainable fashion brand dedicated to artisanal design and eco-conscious collections.',
    website: 'https://www.virgio.com',
    instagram: 'https://www.instagram.com/virgio.official',
    image: getMarketplaceImage('Virgio.png'),
    established: '2021',
    artisans: 2000,
    products: 10000,
    specialties: ['Sustainable Fashion', 'Artisanal Design', 'Eco-conscious', 'Contemporary Style'],
    sustainability: ['Sustainable Fashion', 'Eco-conscious Design', 'Artisanal Craft', 'Environmental Focus'],
    location: 'Mumbai, Maharashtra',
    featured: true,
    rating: 4.6,
    priceRange: 'mid'
  }
];

export const getMakersByCategory = (category: IndianMaker['category']) => {
  return indianMakers.filter(maker => maker.category === category);
};

export const getFeaturedMakers = () => {
  return indianMakers.filter(maker => maker.featured);
};

export const getMakersBySubcategory = (subcategory: string) => {
  return indianMakers.filter(maker => maker.subcategory === subcategory);
};

export const searchMakers = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return indianMakers.filter(maker => 
    maker.name.toLowerCase().includes(lowercaseQuery) ||
    maker.description.toLowerCase().includes(lowercaseQuery) ||
    maker.specialties.some(specialty => specialty.toLowerCase().includes(lowercaseQuery)) ||
    maker.sustainability.some(sustainability => sustainability.toLowerCase().includes(lowercaseQuery))
  );
};