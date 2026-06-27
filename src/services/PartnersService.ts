import { Partner, PartnersFilter } from '@/types/civic';
import { PARTNERS, getPartnersByType, getPartnerById, getActivePartners } from '@/data/partners';

class PartnersService {
  // Get all partners with optional filtering
  async getPartners(filter?: PartnersFilter): Promise<{ partners: Partner[]; total: number }> {
    let filteredPartners = [...PARTNERS];

    // Apply filters
    if (filter?.type) {
      filteredPartners = filteredPartners.filter(partner => partner.type === filter.type);
    }

    if (filter?.is_active !== undefined) {
      filteredPartners = filteredPartners.filter(partner => partner.is_active === filter.is_active);
    }

    if (filter?.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredPartners = filteredPartners.filter(partner => 
        partner.name.toLowerCase().includes(searchTerm) ||
        partner.description.toLowerCase().includes(searchTerm) ||
        partner.location.toLowerCase().includes(searchTerm) ||
        partner.specialties.some(specialty => specialty.toLowerCase().includes(searchTerm))
      );
    }

    return {
      partners: filteredPartners,
      total: filteredPartners.length
    };
  }

  // Get partner by ID
  async getPartnerById(id: string): Promise<Partner | null> {
    const partner = getPartnerById(id);
    return partner || null;
  }

  // Get partners by type
  async getPartnersByType(type: 'artisan' | 'recycler' | 'eco-innovator'): Promise<Partner[]> {
    return getPartnersByType(type);
  }

  // Get active partners only
  async getActivePartners(): Promise<Partner[]> {
    return getActivePartners();
  }

  // Search partners
  async searchPartners(query: string): Promise<Partner[]> {
    const searchTerm = query.toLowerCase();
    return PARTNERS.filter(partner => 
      partner.name.toLowerCase().includes(searchTerm) ||
      partner.description.toLowerCase().includes(searchTerm) ||
      partner.location.toLowerCase().includes(searchTerm) ||
      partner.specialties.some(specialty => specialty.toLowerCase().includes(searchTerm))
    );
  }

  // Get featured partners (you can customize this logic)
  async getFeaturedPartners(): Promise<Partner[]> {
    // Return first 3 active partners as featured
    return getActivePartners().slice(0, 3);
  }

  // Get partners by specialty
  async getPartnersBySpecialty(specialty: string): Promise<Partner[]> {
    return PARTNERS.filter(partner => 
      partner.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
    );
  }
}

// Export singleton instance
export const partnersService = new PartnersService();
export default partnersService;
