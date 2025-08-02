import { useState, useEffect } from 'react';
import { CivicIssue, FilterOptions, IssueCategory, IssueStatus } from '@/types/civic';
import { useLocation } from '@/contexts/LocationContext';
import { useOfflineCache } from './useOfflineCache';

// Mock data for demonstration
const generateMockIssues = (): CivicIssue[] => [
  {
    id: '1',
    title: 'Large pothole on Main Street',
    description: 'Deep pothole causing damage to vehicles. Located near the traffic light intersection.',
    category: 'roads',
    status: 'reported',
    location: {
      latitude: 28.6139,
      longitude: 77.2090,
      address: 'Main Street, Sector 45, New Delhi'
    },
    images: ['/placeholder.svg'],
    reportedBy: 'anonymous',
    reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isAnonymous: true,
    flagCount: 0,
    upvotes: 12,
    timeline: [
      {
        status: 'reported',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        note: 'Issue reported by citizen',
        updatedBy: 'System'
      }
    ]
  },
  {
    id: '2',
    title: 'Broken street light',
    description: 'Street light has been out for over a week, making the area unsafe at night.',
    category: 'lighting',
    status: 'in_progress',
    location: {
      latitude: 28.6129,
      longitude: 77.2080,
      address: 'Park Avenue, Sector 45, New Delhi'
    },
    images: ['/placeholder.svg'],
    reportedBy: 'Rajesh Kumar',
    reportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isAnonymous: false,
    flagCount: 0,
    upvotes: 8,
    timeline: [
      {
        status: 'reported',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        note: 'Issue reported by citizen',
        updatedBy: 'Rajesh Kumar'
      },
      {
        status: 'verified',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        note: 'Issue verified by municipal inspector',
        updatedBy: 'Inspector Singh'
      },
      {
        status: 'in_progress',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        note: 'Repair work has started',
        updatedBy: 'Maintenance Team'
      }
    ]
  },
  {
    id: '3',
    title: 'Garbage overflow near market',
    description: 'Garbage bins are overflowing and waste is scattered around the market area.',
    category: 'cleanliness',
    status: 'resolved',
    location: {
      latitude: 28.6149,
      longitude: 77.2100,
      address: 'Market Square, Sector 45, New Delhi'
    },
    images: ['/placeholder.svg'],
    reportedBy: 'Priya Sharma',
    reportedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isAnonymous: false,
    flagCount: 0,
    upvotes: 15,
    timeline: [
      {
        status: 'reported',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        note: 'Issue reported by citizen',
        updatedBy: 'Priya Sharma'
      },
      {
        status: 'verified',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        note: 'Issue verified and scheduled for cleanup',
        updatedBy: 'Sanitation Department'
      },
      {
        status: 'in_progress',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        note: 'Cleanup operation started',
        updatedBy: 'Cleanup Crew'
      },
      {
        status: 'resolved',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        note: 'Area cleaned and additional bins installed',
        updatedBy: 'Sanitation Department'
      }
    ]
  }
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const useCivicIssues = () => {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userLocation } = useLocation();
  const { cacheIssues } = useOfflineCache();

  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    categories: [],
    distance: 5, // 5km radius
    sortBy: 'recent',
    mapView: 'pins',
    mapStyle: 'default'
  });

  useEffect(() => {
    // Simulate API call
    const loadIssues = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        let mockIssues = generateMockIssues();
        
        // Add distance calculation if user location is available
        if (userLocation) {
          mockIssues = mockIssues.map(issue => ({
            ...issue,
            distance: calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              issue.location.latitude,
              issue.location.longitude
            )
          }));
          
          // Filter by distance
          mockIssues = mockIssues.filter(issue => 
            (issue.distance || 0) <= filters.distance
          );
        }
        
        setIssues(mockIssues);
        cacheIssues(mockIssues, userLocation || undefined);
        setError(null);
      } catch (err) {
        setError('Failed to load civic issues');
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, [userLocation, filters.distance]);

  const filteredIssues = issues.filter(issue => {
    // Filter by status
    if (filters.status.length > 0 && !filters.status.includes(issue.status)) {
      return false;
    }
    
    // Filter by category
    if (filters.categories.length > 0 && !filters.categories.includes(issue.category)) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by selected criteria
    switch (filters.sortBy) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'upvotes':
        return b.upvotes - a.upvotes;
      case 'recent':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const reportIssue = async (issueData: Omit<CivicIssue, 'id' | 'reportedAt' | 'updatedAt' | 'flagCount' | 'upvotes' | 'timeline'>) => {
    try {
      // Simulate API call
      const newIssue: CivicIssue = {
        ...issueData,
        id: Date.now().toString(),
        reportedAt: new Date(),
        updatedAt: new Date(),
        flagCount: 0,
        upvotes: 0,
        timeline: [
          {
            status: issueData.status,
            timestamp: new Date(),
            note: 'Issue reported by citizen',
            updatedBy: issueData.isAnonymous ? 'Anonymous' : issueData.reportedBy
          }
        ]
      };
      
      setIssues(prev => [newIssue, ...prev]);
      return newIssue;
    } catch (err) {
      throw new Error('Failed to report issue');
    }
  };

  const upvoteIssue = (issueId: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, upvotes: issue.upvotes + 1 }
        : issue
    ));
  };

  const flagIssue = (issueId: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, flagCount: issue.flagCount + 1 }
        : issue
    ));
  };

  return {
    issues: filteredIssues,
    loading,
    error,
    filters,
    updateFilters,
    reportIssue,
    upvoteIssue,
    flagIssue,
    totalIssues: issues.length
  };
};