import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Issue, IssueCategory, IssueStatus, IssuePriority, FilterOptions } from '@/types/civic';
import { cn } from '@/lib/utils';
import { 
  Filter, 
  Search, 
  MapPin, 
  Calendar as CalendarIcon,
  Clock,
  Star,
  Users,
  AlertTriangle,
  CheckCircle,
  X,
  RotateCcw,
  Save,
  Download,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';

interface AdvancedFilterSystemProps {
  issues: Issue[];
  onFilteredIssues: (filteredIssues: Issue[]) => void;
  onFilterChange: (filters: FilterOptions) => void;
  className?: string;
}

interface AdvancedFilters {
  // Text search
  searchQuery: string;
  searchFields: ('title' | 'description' | 'reporterName' | 'address')[];
  
  // Category and status
  categories: IssueCategory[];
  statuses: IssueStatus[];
  priorities: IssuePriority[];
  
  // Location
  locationRadius: number;
  centerLocation: { lat: number; lng: number } | null;
  
  // Date range
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  
  // Numeric filters
  upvotesRange: [number, number];
  flagsRange: [number, number];
  
  // Boolean filters
  hasImages: boolean | null;
  hasVoiceRecording: boolean | null;
  isAnonymous: boolean | null;
  isVerified: boolean | null;
  
  // Department and assignment
  departments: string[];
  assignedUsers: string[];
  
  // Advanced options
  sortBy: 'recent' | 'distance' | 'upvotes' | 'priority' | 'status';
  sortOrder: 'asc' | 'desc';
  groupBy: 'category' | 'status' | 'department' | 'none';
  
  // Saved filters
  savedFilters: Array<{
    id: string;
    name: string;
    filters: Partial<AdvancedFilters>;
  }>;
}

export const AdvancedFilterSystem: React.FC<AdvancedFilterSystemProps> = ({
  issues,
  onFilteredIssues,
  onFilterChange,
  className
}) => {
  const [filters, setFilters] = useState<AdvancedFilters>({
    searchQuery: '',
    searchFields: ['title', 'description'],
    categories: [],
    statuses: [],
    priorities: [],
    locationRadius: 10,
    centerLocation: null,
    dateRange: { from: null, to: null },
    upvotesRange: [0, 100],
    flagsRange: [0, 50],
    hasImages: null,
    hasVoiceRecording: null,
    isAnonymous: null,
    isVerified: null,
    departments: [],
    assignedUsers: [],
    sortBy: 'recent',
    sortOrder: 'desc',
    groupBy: 'none',
    savedFilters: []
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'saved'>('basic');

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(issues.map(i => i.category))];
    const statuses = [...new Set(issues.map(i => i.status))];
    const priorities = [...new Set(issues.map(i => i.priority))];
    const departments = [...new Set(issues.map(i => i.department).filter(Boolean))];
    const assignedUsers = [...new Set(issues.map(i => i.assignedTo).filter(Boolean))];
    
    const maxUpvotes = Math.max(...issues.map(i => i.flags), 0);
    const maxFlags = Math.max(...issues.map(i => i.flags), 0);

    return {
      categories,
      statuses,
      priorities,
      departments,
      assignedUsers,
      maxUpvotes,
      maxFlags
    };
  }, [issues]);

  // Apply filters and return filtered issues
  const filteredIssues = useMemo(() => {
    let filtered = [...issues];

    // Text search
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(issue => {
        return filters.searchFields.some(field => {
          switch (field) {
            case 'title':
              return issue.title.toLowerCase().includes(query);
            case 'description':
              return issue.description.toLowerCase().includes(query);
            case 'reporterName':
              return issue.reporterName.toLowerCase().includes(query);
            case 'address':
              return issue.location.address.toLowerCase().includes(query);
            default:
              return false;
          }
        });
      });
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(issue => filters.categories.includes(issue.category));
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(issue => filters.statuses.includes(issue.status));
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(issue => filters.priorities.includes(issue.priority));
    }

    // Location filter
    if (filters.centerLocation) {
      filtered = filtered.filter(issue => {
        const distance = calculateDistance(
          filters.centerLocation!,
          { lat: issue.location.latitude, lng: issue.location.longitude }
        );
        return distance <= filters.locationRadius;
      });
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(issue => {
        const issueDate = new Date(issue.createdAt);
        if (filters.dateRange.from && issueDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && issueDate > filters.dateRange.to) return false;
        return true;
      });
    }

    // Numeric filters
    filtered = filtered.filter(issue => {
      if (issue.flags < filters.upvotesRange[0] || issue.flags > filters.upvotesRange[1]) return false;
      if (issue.flags < filters.flagsRange[0] || issue.flags > filters.flagsRange[1]) return false;
      return true;
    });

    // Boolean filters
    if (filters.hasImages !== null) {
      filtered = filtered.filter(issue => 
        filters.hasImages ? issue.images.length > 0 : issue.images.length === 0
      );
    }

    if (filters.hasVoiceRecording !== null) {
      filtered = filtered.filter(issue => 
        filters.hasVoiceRecording ? !!issue.voiceRecordingId : !issue.voiceRecordingId
      );
    }

    if (filters.isAnonymous !== null) {
      filtered = filtered.filter(issue => 
        filters.isAnonymous ? issue.isAnonymous : !issue.isAnonymous
      );
    }

    if (filters.isVerified !== null) {
      filtered = filtered.filter(issue => 
        filters.isVerified ? issue.isVerified : !issue.isVerified
      );
    }

    // Department filter
    if (filters.departments.length > 0) {
      filtered = filtered.filter(issue => 
        issue.department && filters.departments.includes(issue.department)
      );
    }

    // Assigned user filter
    if (filters.assignedUsers.length > 0) {
      filtered = filtered.filter(issue => 
        issue.assignedTo && filters.assignedUsers.includes(issue.assignedTo)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'recent':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'distance':
          if (filters.centerLocation) {
            const distA = calculateDistance(filters.centerLocation, { lat: a.location.latitude, lng: a.location.longitude });
            const distB = calculateDistance(filters.centerLocation, { lat: b.location.latitude, lng: b.location.longitude });
            comparison = distA - distB;
          }
          break;
        case 'upvotes':
          comparison = a.flags - b.flags;
          break;
        case 'priority': {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        }
        case 'status': {
          const statusOrder = { pending: 1, 'in-progress': 2, resolved: 3 };
          comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
        }
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [issues, filters]);

  // Update filtered issues when filters change
  useEffect(() => {
    onFilteredIssues(filteredIssues);
    
    // Convert to legacy FilterOptions format
    const legacyFilters: FilterOptions = {
      status: filters.statuses.length > 0 ? filters.statuses : ['pending', 'in-progress', 'resolved'],
      categories: filters.categories.length > 0 ? filters.categories : ['roads', 'lighting', 'sanitation', 'water', 'traffic', 'parks', 'other'],
      distance: filters.locationRadius,
      sortBy: filters.sortBy,
      mapView: 'pins',
      mapStyle: 'default'
    };
    
    onFilterChange(legacyFilters);
  }, [filteredIssues, onFilteredIssues, onFilterChange, filters]);

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const updateFilter = <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(prev => ({
      ...prev,
      searchQuery: '',
      categories: [],
      statuses: [],
      priorities: [],
      dateRange: { from: null, to: null },
      upvotesRange: [0, filterOptions.maxUpvotes],
      flagsRange: [0, filterOptions.maxFlags],
      hasImages: null,
      hasVoiceRecording: null,
      isAnonymous: null,
      isVerified: null,
      departments: [],
      assignedUsers: []
    }));
  };

  const saveFilter = () => {
    const name = prompt('Enter filter name:');
    if (!name) return;

    const newFilter = {
      id: Date.now().toString(),
      name,
      filters: { ...filters }
    };

    updateFilter('savedFilters', [...filters.savedFilters, newFilter]);
  };

  const loadFilter = (savedFilter: AdvancedFilters['savedFilters'][0]) => {
    setFilters(prev => ({ ...prev, ...savedFilter.filters }));
  };

  const deleteFilter = (filterId: string) => {
    updateFilter('savedFilters', filters.savedFilters.filter(f => f.id !== filterId));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.categories.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.priorities.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.hasImages !== null) count++;
    if (filters.hasVoiceRecording !== null) count++;
    if (filters.isAnonymous !== null) count++;
    if (filters.isVerified !== null) count++;
    if (filters.departments.length > 0) count++;
    if (filters.assignedUsers.length > 0) count++;
    return count;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={getActiveFilterCount() === 0}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Search</span>
          </div>
          <Input
            placeholder="Search issues..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {(['title', 'description', 'reporterName', 'address'] as const).map(field => (
              <label key={field} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={filters.searchFields.includes(field)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilter('searchFields', [...filters.searchFields, field]);
                    } else {
                      updateFilter('searchFields', filters.searchFields.filter(f => f !== field));
                    }
                  }}
                />
                {field}
              </label>
            ))}
          </div>
        </div>

        {isExpanded && (
          <>
            <Separator />

            {/* Tabs */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              {(['basic', 'advanced', 'saved'] as const).map(tab => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className="flex-1"
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>

            {/* Basic Filters */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                {/* Categories */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Categories</span>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.categories.map(category => (
                      <Badge
                        key={category}
                        variant={filters.categories.includes(category) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          if (filters.categories.includes(category)) {
                            updateFilter('categories', filters.categories.filter(c => c !== category));
                          } else {
                            updateFilter('categories', [...filters.categories, category]);
                          }
                        }}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Status</span>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.statuses.map(status => (
                      <Badge
                        key={status}
                        variant={filters.statuses.includes(status) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          if (filters.statuses.includes(status)) {
                            updateFilter('statuses', filters.statuses.filter(s => s !== status));
                          } else {
                            updateFilter('statuses', [...filters.statuses, status]);
                          }
                        }}
                      >
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Date Range</span>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {filters.dateRange.from ? format(filters.dateRange.from, 'MMM dd') : 'From'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.from || undefined}
                          onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date || null })}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {filters.dateRange.to ? format(filters.dateRange.to, 'MMM dd') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.to || undefined}
                          onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date || null })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Filters */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                {/* Boolean Filters */}
                <div className="space-y-3">
                  <span className="text-sm font-medium">Additional Filters</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Has Images</span>
                      <Select
                        value={filters.hasImages === null ? 'all' : filters.hasImages.toString()}
                        onValueChange={(value) => updateFilter('hasImages', value === 'all' ? null : value === 'true')}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Has Voice</span>
                      <Select
                        value={filters.hasVoiceRecording === null ? 'all' : filters.hasVoiceRecording.toString()}
                        onValueChange={(value) => updateFilter('hasVoiceRecording', value === 'all' ? null : value === 'true')}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Numeric Ranges */}
                <div className="space-y-3">
                  <span className="text-sm font-medium">Upvotes Range</span>
                  <div className="px-3">
                    <Slider
                      value={filters.upvotesRange}
                      onValueChange={(value) => updateFilter('upvotesRange', value as [number, number])}
                      max={filterOptions.maxUpvotes}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{filters.upvotesRange[0]}</span>
                      <span>{filters.upvotesRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Sorting */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Sort By</span>
                  <div className="flex gap-2">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => updateFilter('sortBy', value as 'date' | 'priority' | 'status' | 'category' | 'upvotes')}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Recent</SelectItem>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="upvotes">Upvotes</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.sortOrder}
                      onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">↓</SelectItem>
                        <SelectItem value="asc">↑</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Saved Filters */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Saved Filters</span>
                  <Button variant="outline" size="sm" onClick={saveFilter}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Current
                  </Button>
                </div>
                <div className="space-y-2">
                  {filters.savedFilters.map(savedFilter => (
                    <div key={savedFilter.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{savedFilter.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadFilter(savedFilter)}
                        >
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFilter(savedFilter.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filters.savedFilters.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No saved filters yet
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <span>
            Showing {filteredIssues.length} of {issues.length} issues
          </span>
          {getActiveFilterCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
