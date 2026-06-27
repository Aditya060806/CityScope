import { useState, useEffect } from 'react';
import { Partner, PartnersFilter } from '@/types/civic';
import { partnersService } from '@/services/PartnersService';

export const usePartners = (filter?: PartnersFilter) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await partnersService.getPartners(filter);
        setPartners(result.partners);
        setTotal(result.total);
      } catch (err) {
        console.error('Error loading partners:', err);
        setError(err instanceof Error ? err.message : 'Failed to load partners');
        setPartners([]);
      } finally {
        setLoading(false);
      }
    };

    loadPartners();
  }, [filter]);

  const searchPartners = async (query: string): Promise<Partner[]> => {
    try {
      return await partnersService.searchPartners(query);
    } catch (err) {
      console.error('Error searching partners:', err);
      return [];
    }
  };

  const getPartnerById = async (id: string): Promise<Partner | null> => {
    try {
      return await partnersService.getPartnerById(id);
    } catch (err) {
      console.error('Error getting partner by ID:', err);
      return null;
    }
  };

  const getFeaturedPartners = async (): Promise<Partner[]> => {
    try {
      return await partnersService.getFeaturedPartners();
    } catch (err) {
      console.error('Error getting featured partners:', err);
      return [];
    }
  };

  return {
    partners,
    loading,
    error,
    total,
    searchPartners,
    getPartnerById,
    getFeaturedPartners
  };
};
