export type IssueStatus = 'reported' | 'verified' | 'in_progress' | 'resolved';

export type IssueCategory = 
  | 'roads' 
  | 'lighting' 
  | 'water' 
  | 'cleanliness' 
  | 'safety' 
  | 'obstructions';

export interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images: string[];
  reportedBy: string;
  reportedAt: Date;
  updatedAt: Date;
  isAnonymous: boolean;
  flagCount: number;
  upvotes: number;
  distance?: number;
  timeline: StatusUpdate[];
}

export interface StatusUpdate {
  status: IssueStatus;
  timestamp: Date;
  note?: string;
  updatedBy: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface FilterOptions {
  status: IssueStatus[];
  categories: IssueCategory[];
  distance: number;
  sortBy: 'recent' | 'distance' | 'upvotes';
  mapView: 'pins' | 'heatmap';
  mapStyle: 'default' | 'satellite';
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  reportsCount: number;
  resolvedCount: number;
  verifiedPercentage: number;
  rank: number;
  badge?: string;
  isCurrentUser?: boolean;
}

export interface SmartSuggestion {
  category: IssueCategory;
  confidence: number;
  reason: string;
}

export interface OfflineCache {
  issues: CivicIssue[];
  lastUpdated: Date;
  userLocation?: Location;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  reportsCount: number;
  isAdmin: boolean;
  joinedAt: Date;
}

export const CATEGORY_CONFIG = {
  roads: {
    label: 'Roads',
    icon: '🚧',
    color: 'hsl(var(--status-reported))',
    description: 'Potholes, road damage, signage issues'
  },
  lighting: {
    label: 'Lighting',
    icon: '💡',
    color: 'hsl(var(--warning))',
    description: 'Street lights, dark areas, electrical issues'
  },
  water: {
    label: 'Water',
    icon: '💧',
    color: 'hsl(215 85% 45%)',
    description: 'Leaks, drainage, water quality issues'
  },
  cleanliness: {
    label: 'Cleanliness',
    icon: '🧹',
    color: 'hsl(var(--secondary))',
    description: 'Garbage, waste management, hygiene'
  },
  safety: {
    label: 'Safety',
    icon: '⚠️',
    color: 'hsl(var(--destructive))',
    description: 'Security concerns, hazards, emergency issues'
  },
  obstructions: {
    label: 'Obstructions',
    icon: '🌳',
    color: 'hsl(var(--accent))',
    description: 'Blocked paths, fallen trees, construction'
  }
} as const;

export const STATUS_CONFIG = {
  reported: {
    label: 'Reported',
    color: 'hsl(var(--status-reported))',
    description: 'Issue has been reported'
  },
  verified: {
    label: 'Verified',
    color: 'hsl(var(--status-verified))',
    description: 'Issue has been verified by authorities'
  },
  in_progress: {
    label: 'In Progress',
    color: 'hsl(var(--status-progress))',
    description: 'Work has started on this issue'
  },
  resolved: {
    label: 'Resolved',
    color: 'hsl(var(--status-resolved))',
    description: 'Issue has been resolved'
  }
} as const;