export type IssueStatus = 'pending' | 'in-progress' | 'resolved';

export type IssueCategory = 
  | 'roads' 
  | 'lighting' 
  | 'sanitation' 
  | 'water' 
  | 'traffic' 
  | 'parks' 
  | 'other';

export type UserRole = 'citizen' | 'moderator' | 'admin';

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

// Core Issue interface - Unified and comprehensive
export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images: string[];
  reporterId: string;
  reporterName: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  assignedTo: string | null;
  departmentId: string | null; // Fixed: matches database schema
  upvotes: number;
  flags: number;
  isHidden: boolean;
  resolutionNotes: string | null;
  timeline: StatusUpdate[];
  distance?: number; // For location-based filtering
  voiceRecordingId?: string | null;
  verificationStatus?: string;
}

// Legacy alias for backward compatibility - will be phased out
export type CivicIssue = Issue;

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
  timestamp?: number;
  city?: string;
  state?: string;
  district?: string;
  area?: string;
  pincode?: string;
  country?: string;
}

export interface FilterOptions {
  status: IssueStatus[];
  categories: IssueCategory[];
  distance: number;
  sortBy: 'recent' | 'distance' | 'upvotes';
  mapView: 'pins' | 'heatmap';
  mapStyle: 'default' | 'satellite';
}

// User interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  joinedAt: Date;
  isVerified: boolean;
  badges: string[];
  stats: UserStats;
}

export interface UserStats {
  reportsSubmitted: number;
  reportsResolved: number;
  totalPoints: number;
  rank: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
  };
  stats: UserStats;
  badges: string[];
  change: number; // rank change from previous period
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: Record<string, unknown>;
}

// Service interfaces
export interface CreateIssueData {
  title: string;
  description: string;
  category: IssueCategory;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  images?: string[];
  reporterId: string;
  reporterName: string;
  priority?: IssuePriority;
}

export interface UpdateIssueData {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  department?: string;
  assignedTo?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: Date | null;
}

// Analytics interfaces
export interface AnalyticsData {
  totalIssues: number;
  issuesByStatus: Record<IssueStatus, number>;
  issuesByCategory: Record<IssueCategory, number>;
  issuesByPriority: Record<string, number>;
  averageResolutionTime: number;
  topReporters: Array<{ userId: string; name: string; count: number }>;
  recentTrends: Array<{ date: string; count: number }>;
}

export interface SmartSuggestion {
  category: IssueCategory;
  confidence: number;
  reason: string;
}

export interface OfflineCache {
  issues: Issue[];
  lastUpdated: Date;
  userLocation?: Location;
}

// Legacy interfaces for backward compatibility
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

// Configuration objects
export const CATEGORY_CONFIG = {
  roads: {
    label: 'Roads & Infrastructure',
    icon: '🚧',
    color: 'hsl(var(--status-reported))',
    description: 'Potholes, road damage, signage issues'
  },
  lighting: {
    label: 'Street Lighting',
    icon: '💡',
    color: 'hsl(var(--warning))',
    description: 'Street lights, dark areas, electrical issues'
  },
  sanitation: {
    label: 'Sanitation',
    icon: '🧹',
    color: 'hsl(var(--secondary))',
    description: 'Garbage, waste management, hygiene'
  },
  water: {
    label: 'Water Supply',
    icon: '💧',
    color: 'hsl(215 85% 45%)',
    description: 'Leaks, drainage, water quality issues'
  },
  traffic: {
    label: 'Traffic & Safety',
    icon: '🚦',
    color: 'hsl(var(--destructive))',
    description: 'Traffic signals, road safety, parking'
  },
  parks: {
    label: 'Parks & Recreation',
    icon: '🌳',
    color: 'hsl(var(--accent))',
    description: 'Parks, playgrounds, recreational facilities'
  },
  other: {
    label: 'Other Issues',
    icon: '📋',
    color: 'hsl(var(--muted-foreground))',
    description: 'Other civic issues not covered above'
  }
} as const;

export const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'hsl(var(--status-reported))',
    description: 'Issue has been reported and is awaiting review'
  },
  'in-progress': {
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

export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: 'hsl(var(--muted-foreground))',
    description: 'Non-urgent issue'
  },
  medium: {
    label: 'Medium',
    color: 'hsl(var(--warning))',
    description: 'Standard priority issue'
  },
  high: {
    label: 'High',
    color: 'hsl(var(--destructive))',
    description: 'High priority issue'
  },
  urgent: {
    label: 'Urgent',
    color: 'hsl(0 84% 60%)',
    description: 'Emergency or safety issue'
  }
} as const;

export const ROLE_CONFIG = {
  citizen: {
    label: 'Citizen',
    description: 'Regular user who can report issues'
  },
  moderator: {
    label: 'Moderator',
    description: 'Can review and moderate reports'
  },
  admin: {
    label: 'Administrator',
    description: 'Full system access and management'
  }
} as const;

// Rewards & Marketplace Types
export type PartnerType = 'artisan' | 'recycler' | 'eco-innovator';

export type RewardCategory = 'recognition' | 'discount' | 'experience' | 'access' | 'education' | 'social_impact';

export type UserRewardStatus = 'pending' | 'redeemed' | 'expired' | 'cancelled';

// Achievement types
export type AchievementCategory = 'milestone' | 'impact' | 'engagement' | 'consistency' | 'diversity' | 'local' | 'leadership';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  category: AchievementCategory;
  is_active: boolean;
  created_at: Date;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: Date;
  achievement?: Achievement; // Populated when joining with achievements table
}

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  description: string;
  image_url: string | null;
  contact_link: string | null;
  website_url: string | null;
  instagram_url: string | null;
  location: string | null;
  specialties: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  partner_id: string;
  image_url: string | null;
  category: RewardCategory;
  is_active: boolean;
  stock_quantity: number; // -1 means unlimited
  redeemed_count: number;
  expiry_days: number | null;
  terms_conditions: string | null;
  value?: number;
  max_redemptions?: number;
  current_redemptions?: number;
  created_at: Date;
  updated_at: Date;
  partner?: Partner; // Populated when joining with partners table
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  status: UserRewardStatus;
  voucher_code: string;
  redeemed_at: Date | null;
  expires_at: Date | null;
  partner_contact_info: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  points_spent?: number;
  payment_method?: string;
  transaction_id?: string;
  reward?: Reward; // Populated when joining with rewards table
  partner?: Partner; // Populated when joining with partners table
}

export interface RedeemRewardRequest {
  reward_id: string;
  user_id: string;
}

export interface RedeemRewardResponse {
  success: boolean;
  error?: string;
  voucher_code?: string;
  reward_name?: string;
  partner_name?: string;
  partner_contact?: string;
  partner_website?: string;
  partner_instagram?: string;
  points_used?: number;
}

export interface RewardsFilter {
  category?: RewardCategory;
  partner_type?: PartnerType;
  min_points?: number;
  max_points?: number;
  is_available?: boolean;
}

export interface PartnersFilter {
  type?: PartnerType;
  is_active?: boolean;
  search?: string;
}

// Configuration objects for rewards and marketplace
export const PARTNER_TYPE_CONFIG = {
  artisan: {
    label: 'Artisan',
    icon: '🎨',
    color: 'hsl(25 95% 53%)',
    description: 'Handmade crafts and traditional skills'
  },
  recycler: {
    label: 'Recycler',
    icon: '♻️',
    color: 'hsl(142 76% 36%)',
    description: 'Waste reduction and circular economy'
  },
  'eco-innovator': {
    label: 'Eco Innovator',
    icon: '🌱',
    color: 'hsl(160 84% 39%)',
    description: 'Sustainable technology and innovation'
  }
} as const;

export const REWARD_CATEGORY_CONFIG = {
  recognition: {
    label: 'Recognition & Awards',
    icon: '🏆',
    color: 'hsl(45 93% 47%)',
    description: 'Digital badges, certificates, and official recognition'
  },
  discount: {
    label: 'Municipal Discounts',
    icon: '💰',
    color: 'hsl(142 76% 36%)',
    description: 'Discounts on municipal services and bills'
  },
  experience: {
    label: 'Community Experiences',
    icon: '🎯',
    color: 'hsl(217 91% 60%)',
    description: 'Access to workshops, tours, and community activities'
  },
  access: {
    label: 'Special Access',
    icon: '🔑',
    color: 'hsl(262 83% 58%)',
    description: 'Priority access and special privileges'
  },
  education: {
    label: 'Learning & Development',
    icon: '📚',
    color: 'hsl(188 94% 43%)',
    description: 'Educational courses and skill development'
  },
  social_impact: {
    label: 'Social Impact',
    icon: '🤝',
    color: 'hsl(0 84% 60%)',
    description: 'Community impact and social recognition'
  }
} as const;

export const USER_REWARD_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'hsl(var(--warning))',
    description: 'Reward is pending redemption'
  },
  redeemed: {
    label: 'Redeemed',
    color: 'hsl(var(--success))',
    description: 'Reward has been redeemed'
  },
  expired: {
    label: 'Expired',
    color: 'hsl(var(--destructive))',
    description: 'Reward has expired'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'hsl(var(--muted-foreground))',
    description: 'Reward has been cancelled'
  }
} as const;