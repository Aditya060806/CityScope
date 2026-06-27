import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Issue, IssueCategory, IssueStatus, CATEGORY_CONFIG, STATUS_CONFIG } from '@/types/civic';
import { useMapData } from '@/hooks/useMapData';
import { cn } from '@/lib/utils';
import { toMapCenter } from '@/constants/location';
import { 
  MapPin, 
  Layers, 
  Filter, 
  Search, 
  Navigation,
  ZoomIn,
  ZoomOut,
  Settings,
  Eye,
  EyeOff,
  Activity,
  CheckCircle,
  Clock,
  TrendingUp,
  Map,
  Satellite,
  Maximize2,
  Minimize2,
  Info,
  X,
  Bookmark,
  Download,
  RefreshCw
} from 'lucide-react';

interface ProperMapViewProps {
  className?: string;
  onIssueSelect?: (issue: Issue) => void;
  selectedIssueId?: string;
  userLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

type MapViewMode = 'pins' | 'heatmap' | 'clusters';
type MapStyle = 'default' | 'satellite' | 'terrain';

interface ClusterData {
  id: string;
  center: { lat: number; lng: number };
  issues: Issue[];
  count: number;
  dominantCategory: IssueCategory;
}

export const ProperMapView: React.FC<ProperMapViewProps> = ({
  className,
  onIssueSelect,
  selectedIssueId,
  userLocation
}) => {
  const [initialLat, initialLng] = toMapCenter(userLocation);

  // State management
  const mapRef = useRef<HTMLDivElement>(null);
  const { issues, isLoading } = useMapData();
  const [viewMode, setViewMode] = useState<MapViewMode>('pins');
  const [mapStyle, setMapStyle] = useState<MapStyle>('default');
  const [zoom, setZoom] = useState(13);
  const [center, setCenter] = useState({
    lat: initialLat,
    lng: initialLng,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<IssueCategory[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<IssueStatus[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [heatmapIntensity, setHeatmapIntensity] = useState([0.7]);
  const [clusterRadius, setClusterRadius] = useState([50]);
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [bookmarkedIssues, setBookmarkedIssues] = useState<Set<string>>(new Set());



  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesSearch = searchQuery === '' || 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.location.address?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(issue.category);
      
      const matchesStatus = selectedStatuses.length === 0 || 
        selectedStatuses.includes(issue.status);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [issues, searchQuery, selectedCategories, selectedStatuses]);

  // Generate clusters
  const clusters = useMemo(() => {
    if (viewMode !== 'clusters' || filteredIssues.length === 0) return [];
    
    const clusterData: ClusterData[] = [];
    const processedIssues = new Set<string>();
    
    filteredIssues.forEach(issue => {
      if (processedIssues.has(issue.id)) return;
      
      const cluster: ClusterData = {
        id: `cluster-${issue.id}`,
        center: { lat: issue.location.latitude, lng: issue.location.longitude },
        issues: [issue],
        count: 1,
        dominantCategory: issue.category
      };
      
      // Find nearby issues
      filteredIssues.forEach(otherIssue => {
        if (otherIssue.id === issue.id || processedIssues.has(otherIssue.id)) return;
        
        const distance = calculateDistance(
          issue.location.latitude,
          issue.location.longitude,
          otherIssue.location.latitude,
          otherIssue.location.longitude
        );
        
        if (distance < clusterRadius[0] / 1000) {
          cluster.issues.push(otherIssue);
          cluster.count++;
          processedIssues.add(otherIssue.id);
        }
      });
      
      processedIssues.add(issue.id);
      clusterData.push(cluster);
    });
    
    return clusterData;
  }, [filteredIssues, viewMode, clusterRadius]);

  // Helper functions
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getStatusIcon = (status: IssueStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'in-progress': return <Activity className="w-3 h-3 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-3 h-3 text-green-500" />;
      default: return <MapPin className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'pending': return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      case 'in-progress': return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'resolved': return 'border-green-500 bg-green-50 text-green-700';
      default: return 'border-gray-500 bg-gray-50 text-gray-700';
    }
  };

  const getClusterColor = (cluster: ClusterData) => {
    const intensity = Math.min(cluster.count / 10, 1);
    return `rgba(30, 64, 175, ${0.3 + intensity * 0.7})`;
  };

  // Event handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 1, 20));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 1, 1));
  const handleResetView = () => {
    setZoom(13);
    if (userLocation) {
      setCenter({ lat: userLocation.latitude, lng: userLocation.longitude });
    }
  };

  const toggleCategory = (category: IssueCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleStatus = (status: IssueStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleBookmark = (issueId: string) => {
    setBookmarkedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedStatuses([]);
  };

  const exportMapData = () => {
    const data = {
      issues: filteredIssues,
      clusters: clusters,
      filters: {
        categories: selectedCategories,
        statuses: selectedStatuses,
        search: searchQuery
      },
      mapState: { center, zoom, viewMode, mapStyle }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cityscope-map-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Statistics
  const stats = useMemo(() => {
    const total = filteredIssues.length;
    const byStatus = filteredIssues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<IssueStatus, number>);
    
    return { total, byStatus };
  }, [filteredIssues]);

  return (
    <Card className={cn("border-royal/20 shadow-sleek-xl overflow-hidden", className, isFullscreen && "fixed inset-4 z-50")}>
      <CardHeader className="pb-4 border-b border-royal/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-royal to-royal/80 rounded-xl flex items-center justify-center shadow-sleek">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Interactive Map</h2>
              <p className="text-sm text-gray-600 font-medium">Explore civic issues in your area</p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportMapData}
              className="border-royal/20 text-royal hover:bg-royal/5"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="border-royal/20 text-royal hover:bg-royal/5"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="border-royal/20 text-royal hover:bg-royal/5"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search issues by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-royal/20 focus:border-royal focus:ring-royal/20"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-royal/20 text-royal hover:bg-royal/5"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
            
            <Badge variant="outline" className="bg-royal/5 border-royal/20 text-royal">
              {stats.total} issues
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative">
          {/* Map Container */}
          <div 
            ref={mapRef}
            className={cn(
              "relative w-full overflow-hidden",
              isFullscreen ? "h-[calc(100vh-12rem)]" : "h-[600px]"
            )}
          >
            {/* Map Background */}
            <div className="absolute inset-0">
              {mapStyle === 'satellite' ? (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.4) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)
                    `,
                    backgroundSize: '300px 300px, 200px 200px'
                  }} />
                </div>
              ) : mapStyle === 'terrain' ? (
                <div className="w-full h-full bg-gradient-to-br from-green-200 via-yellow-100 to-brown-200">
                  <div className="absolute inset-0 opacity-40" style={{
                    backgroundImage: `
                      linear-gradient(45deg, transparent 45%, rgba(139, 69, 19, 0.1) 45%, rgba(139, 69, 19, 0.1) 55%, transparent 55%)
                    `,
                    backgroundSize: '40px 40px'
                  }} />
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 via-green-50 to-blue-100">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `
                      linear-gradient(90deg, rgba(22, 38, 96, 0.1) 1px, transparent 1px),
                      linear-gradient(rgba(22, 38, 96, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
              )}
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 left-4 z-10 space-y-3">
              {/* View Mode Toggle */}
              <div className="bg-white/95 backdrop-blur-sm border border-royal/20 rounded-xl p-2 shadow-sleek">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-royal" />
                  <span className="text-sm font-semibold text-royal">View</span>
                </div>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as MapViewMode)}
                  className="grid grid-cols-1 gap-1"
                >
                  <ToggleGroupItem value="pins" className="data-[state=on]:bg-royal data-[state=on]:text-white text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    Pins
                  </ToggleGroupItem>
                  <ToggleGroupItem value="clusters" className="data-[state=on]:bg-royal data-[state=on]:text-white text-xs">
                    <Activity className="w-3 h-3 mr-1" />
                    Clusters
                  </ToggleGroupItem>
                  <ToggleGroupItem value="heatmap" className="data-[state=on]:bg-royal data-[state=on]:text-white text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Heatmap
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Map Style Toggle */}
              <div className="bg-white/95 backdrop-blur-sm border border-royal/20 rounded-xl p-2 shadow-sleek">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-royal" />
                  <span className="text-sm font-semibold text-royal">Style</span>
                </div>
                <ToggleGroup
                  type="single"
                  value={mapStyle}
                  onValueChange={(value) => value && setMapStyle(value as MapStyle)}
                  className="grid grid-cols-1 gap-1"
                >
                  <ToggleGroupItem value="default" className="data-[state=on]:bg-royal data-[state=on]:text-white text-xs">
                    <Map className="w-3 h-3 mr-1" />
                    Street
                  </ToggleGroupItem>
                  <ToggleGroupItem value="satellite" className="data-[state=on]:bg-royal data-[state=on]:text-white text-xs">
                    <Satellite className="w-3 h-3 mr-1" />
                    Satellite
                  </ToggleGroupItem>
                  <ToggleGroupItem value="terrain" className="data-[state=on]:bg-royal data-[state=on]:text-white text-xs">
                    <Layers className="w-3 h-3 mr-1" />
                    Terrain
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 space-y-2">
              <div className="bg-white/95 backdrop-blur-sm border border-royal/20 rounded-xl p-1 shadow-sleek">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0 hover:bg-royal/10"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-0 hover:bg-royal/10"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </div>

              {userLocation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetView}
                  className="bg-white/95 backdrop-blur-sm border border-royal/20 rounded-xl h-8 w-8 p-0 hover:bg-royal/10 shadow-sleek"
                >
                  <Navigation className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Issue Markers - Pins Mode */}
            {viewMode === 'pins' && (
              <div className="absolute inset-0">
                {filteredIssues.map((issue, index) => {
                  const x = 20 + (index * 15) % 60;
                  const y = 20 + (index * 25) % 70;
                  
                  return (
                    <div
                      key={issue.id}
                      className={cn(
                        "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-125 group",
                        selectedIssueId === issue.id && "scale-125 z-20"
                      )}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onClick={() => onIssueSelect?.(issue)}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sleek-lg transition-all duration-300",
                        getStatusColor(issue.status),
                        selectedIssueId === issue.id && "ring-4 ring-royal ring-offset-2"
                      )}>
                        {getStatusIcon(issue.status)}
                      </div>
                      
                      {/* Bookmark indicator */}
                      {bookmarkedIssues.has(issue.id) && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-royal rounded-full flex items-center justify-center">
                          <Bookmark className="w-2 h-2 text-white fill-white" />
                        </div>
                      )}
                      
                      {/* Pulse animation for pending issues */}
                      {issue.status === 'pending' && (
                        <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-yellow-500 animate-ping opacity-30" />
                      )}
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                        <div className="bg-white border border-royal/20 rounded-xl p-3 shadow-sleek-lg min-w-64">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-royal text-sm truncate flex-1">
                              {issue.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(issue.id);
                              }}
                              className="h-6 w-6 p-0 ml-2"
                            >
                              <Bookmark className={cn(
                                "w-3 h-3",
                                bookmarkedIssues.has(issue.id) ? "text-royal fill-royal" : "text-gray-400"
                              )} />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {issue.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {CATEGORY_CONFIG[issue.category].icon} {CATEGORY_CONFIG[issue.category].label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {STATUS_CONFIG[issue.status].label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cluster Markers */}
            {viewMode === 'clusters' && (
              <div className="absolute inset-0">
                {clusters.map((cluster, index) => {
                  const x = 20 + (index * 20) % 60;
                  const y = 20 + (index * 30) % 70;
                  
                  return (
                    <div
                      key={cluster.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110 group"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onClick={() => onIssueSelect?.(cluster.issues[0])}
                    >
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center shadow-sleek-lg text-white font-bold text-sm border-4 border-white"
                        style={{ backgroundColor: getClusterColor(cluster) }}
                      >
                        {cluster.count}
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                        <div className="bg-white border border-royal/20 rounded-xl p-3 shadow-sleek-lg min-w-64">
                          <h4 className="font-semibold text-royal text-sm mb-1">
                            {cluster.count} Issues
                          </h4>
                          <div className="text-xs text-gray-600 mb-2">
                            Dominant: {CATEGORY_CONFIG[cluster.dominantCategory].label}
                          </div>
                          <div className="space-y-1">
                            {cluster.issues.slice(0, 3).map(issue => (
                              <div key={issue.id} className="text-xs text-gray-600 truncate">
                                {issue.title}
                              </div>
                            ))}
                            {cluster.issues.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{cluster.issues.length - 3} more...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Heatmap Overlay */}
            {viewMode === 'heatmap' && (
              <div className="absolute inset-0">
                <div 
                  className="w-full h-full opacity-60"
                  style={{
                    background: `
                      radial-gradient(circle at 30% 20%, rgba(255, 0, 0, ${heatmapIntensity[0]}) 0%, transparent 50%),
                      radial-gradient(circle at 70% 80%, rgba(255, 165, 0, ${heatmapIntensity[0] * 0.7}) 0%, transparent 50%),
                      radial-gradient(circle at 50% 50%, rgba(255, 255, 0, ${heatmapIntensity[0] * 0.5}) 0%, transparent 40%)
                    `
                  }}
                />
              </div>
            )}

            {/* User Location */}
            {userLocation && showUserLocation && (
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                <div className="w-6 h-6 bg-royal rounded-full border-4 border-white shadow-sleek-lg animate-pulse" />
                <div className="absolute inset-0 w-6 h-6 bg-royal/30 rounded-full animate-ping" />
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-royal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold text-royal">Loading map data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white/95 backdrop-blur-sm border border-royal/20 rounded-xl p-4 shadow-sleek-lg min-w-80">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-royal">Map Settings</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Heatmap Intensity</Label>
                  <Slider
                    value={heatmapIntensity}
                    onValueChange={setHeatmapIntensity}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Cluster Radius: {clusterRadius[0]}m</Label>
                  <Slider
                    value={clusterRadius}
                    onValueChange={setClusterRadius}
                    max={200}
                    min={20}
                    step={10}
                    className="mt-2"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Show User Location</Label>
                  <Switch
                    checked={showUserLocation}
                    onCheckedChange={setShowUserLocation}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Show Legend</Label>
                  <Switch
                    checked={showLegend}
                    onCheckedChange={setShowLegend}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Show Statistics</Label>
                  <Switch
                    checked={showStats}
                    onCheckedChange={setShowStats}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filter Panel */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-white/95 backdrop-blur-sm border border-royal/20 rounded-xl p-4 shadow-sleek-lg">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-royal" />
                <span className="text-sm font-semibold text-royal">Filters</span>
              </div>
              
              {/* Category Filters */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-600 mb-2">Categories</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                    const count = filteredIssues.filter(issue => issue.category === category).length;
                    const isSelected = selectedCategories.includes(category as IssueCategory);
                    
                    return (
                      <Button
                        key={category}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(category as IssueCategory)}
                        className={cn(
                          "text-xs h-7",
                          isSelected 
                            ? "bg-royal text-white" 
                            : "hover:bg-royal/10 hover:border-royal/50"
                        )}
                      >
                        <span className="mr-1">{config.icon}</span>
                        {config.label} ({count})
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Status Filters */}
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">Status</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = filteredIssues.filter(issue => issue.status === status).length;
                    const isSelected = selectedStatuses.includes(status as IssueStatus);
                    
                    return (
                      <Button
                        key={status}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleStatus(status as IssueStatus)}
                        className={cn(
                          "text-xs h-7",
                          isSelected 
                            ? "bg-royal text-white" 
                            : "hover:bg-royal/10 hover:border-royal/50"
                        )}
                      >
                        {config.label} ({count})
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm border border-royal/20 rounded-xl p-3 shadow-sleek">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-royal" />
                <span className="text-sm font-semibold text-royal">Legend</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Resolved</span>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          {showStats && (
            <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-sm border border-royal/20 rounded-xl p-3 shadow-sleek">
              <div className="text-xs space-y-1">
                <div className="font-semibold text-royal">Map Statistics</div>
                <div>Zoom: {zoom}</div>
                <div>Issues: {stats.total}</div>
                <div>Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}</div>
                {viewMode === 'clusters' && <div>Clusters: {clusters.length}</div>}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};