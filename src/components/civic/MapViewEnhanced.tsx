import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Layers, 
  Filter, 
  Search, 
  Navigation,
  Zap,
  Eye,
  Clock
} from 'lucide-react';
import { MapViewToggle } from './MapViewToggle';
import { MapControlsEnhanced } from './MapControlsEnhanced';
import { HeatmapOverlay } from './HeatmapOverlay';
import { SatelliteToggle } from './SatelliteToggle';
import { CivicIssue } from '@/types/civic';
import { cn } from '@/lib/utils';

interface MapViewEnhancedProps {
  issues: CivicIssue[];
  onIssueSelect?: (issue: CivicIssue) => void;
  onFilterToggle?: () => void;
  mapView?: 'pins' | 'heatmap';
  mapStyle?: 'default' | 'satellite';
  onMapViewChange?: (view: 'pins' | 'heatmap') => void;
  onMapStyleChange?: (style: 'default' | 'satellite') => void;
  className?: string;
}

export const MapViewEnhanced: React.FC<MapViewEnhancedProps> = ({
  issues,
  onIssueSelect,
  onFilterToggle,
  mapView = 'pins',
  mapStyle = 'default',
  onMapViewChange,
  onMapStyleChange,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLayer, setActiveLayer] = useState<'all' | 'reported' | 'verified' | 'progress' | 'resolved'>('all');

  const mapLayers = [
    { id: 'all', label: 'All Issues', color: 'text-foreground' },
    { id: 'reported', label: 'Reported', color: 'text-status-reported' },
    { id: 'verified', label: 'Verified', color: 'text-status-verified' },
    { id: 'progress', label: 'In Progress', color: 'text-status-progress' },
    { id: 'resolved', label: 'Resolved', color: 'text-status-resolved' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reported': return Zap;
      case 'verified': return Eye;
      case 'in_progress': return Clock;
      case 'resolved': return MapPin;
      default: return MapPin;
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLayer = activeLayer === 'all' || issue.status === activeLayer;
    return matchesSearch && matchesLayer;
  });

  return (
    <Card className={cn('glass-card overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-primary" />
            Interactive Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onFilterToggle}
              className="glass-card border-border/50"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search issues by location or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-card border-border/50"
          />
        </div>

        {/* Layer Controls */}
        <div className="flex flex-wrap gap-2">
          {mapLayers.map((layer) => (
            <Button
              key={layer.id}
              variant={activeLayer === layer.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLayer(layer.id as any)}
              className={cn(
                'text-xs transition-all duration-200',
                activeLayer === layer.id 
                  ? 'bg-primary text-primary-foreground shadow-civic' 
                  : 'glass-card border-border/50 hover:border-primary/50'
              )}
            >
              <Layers className="w-3 h-3 mr-1" />
              {layer.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Enhanced Map Container */}
        <div className="relative h-96 bg-gradient-map rounded-2xl mx-4 mb-4 overflow-hidden shadow-civic">
          {/* Enhanced Map Controls */}
          <div className="absolute top-4 right-4 z-10">
            <MapControlsEnhanced
              mapView={mapView}
              mapStyle={mapStyle}
              onMapViewChange={onMapViewChange || (() => {})}
              onMapStyleChange={onMapStyleChange || (() => {})}
              issueCount={issues.length}
            />
          </div>
          {/* Dynamic Map Background */}
          <div className="absolute inset-0">
            {mapStyle === 'satellite' ? (
              // Satellite Style Background
              <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 opacity-90">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    radial-gradient(circle at 30% 20%, rgba(34, 197, 94, 0.3) 0%, transparent 40%),
                    radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
                    radial-gradient(circle at 90% 10%, rgba(168, 85, 247, 0.1) 0%, transparent 30%)
                  `,
                  backgroundSize: '200px 200px, 150px 150px, 100px 100px'
                }} />
              </div>
            ) : (
              // Default Street Style Background
              <div className="w-full h-full opacity-20">
                <div className="w-full h-full" style={{
                  backgroundImage: `
                    radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 25%),
                    radial-gradient(circle at 75% 75%, hsl(var(--accent)) 0%, transparent 25%),
                    linear-gradient(45deg, transparent 45%, hsl(var(--border)) 45%, hsl(var(--border)) 55%, transparent 55%)
                  `,
                  backgroundSize: '40px 40px, 40px 40px, 20px 20px'
                }} />
              </div>
            )}
          </div>

          {/* Heatmap Overlay */}
          <HeatmapOverlay
            issues={filteredIssues}
            isVisible={mapView === 'heatmap'}
          />

          {/* Map Markers - Only show in pins mode */}
          {mapView === 'pins' && (
            <div className="absolute inset-0 p-4">
              {filteredIssues.slice(0, 8).map((issue, index) => {
              const StatusIcon = getStatusIcon(issue.status);
              const x = 20 + (index % 4) * 20;
              const y = 20 + Math.floor(index / 4) * 30;

              return (
                <div
                  key={issue.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group animate-scale-in"
                  style={{ 
                    left: `${x}%`, 
                    top: `${y}%`,
                    animationDelay: `${index * 100}ms`
                  }}
                  onClick={() => onIssueSelect?.(issue)}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                    'bg-background border-2 shadow-lg group-hover:scale-125 group-hover:shadow-glow',
                    issue.status === 'reported' && 'border-status-reported',
                    issue.status === 'verified' && 'border-status-verified',
                    issue.status === 'in_progress' && 'border-status-progress',
                    issue.status === 'resolved' && 'border-status-resolved'
                  )}>
                    <StatusIcon className={cn(
                      'w-4 h-4',
                      issue.status === 'reported' && 'text-status-reported',
                      issue.status === 'verified' && 'text-status-verified',
                      issue.status === 'in_progress' && 'text-status-progress',
                      issue.status === 'resolved' && 'text-status-resolved'
                    )} />
                  </div>

                  {/* Pulse Animation */}
                  {issue.status === 'reported' && (
                    <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-status-reported animate-marker-pulse opacity-30" />
                  )}

                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-foreground text-background text-xs py-1 px-2 rounded whitespace-nowrap">
                      {issue.title}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* Additional Map Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              className="glass-card border-powder/30 p-2 hover:shadow-civic transition-all duration-200"
            >
              <Navigation className="w-4 h-4 text-royal" />
            </Button>
          </div>

          {/* Legend - Only show in pins mode */}
          {mapView === 'pins' && (
            <div className="absolute bottom-4 left-4 glass-card border-powder/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-3 h-3 text-royal" />
                <span className="text-xs font-semibold text-royal">Issue Status</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-status-reported" />
                  <span>New</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-status-progress" />
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-status-resolved" />
                  <span>Resolved</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {filteredIssues.length} of {issues.length} issues
            </span>
            <Badge variant="outline" className="text-xs">
              {activeLayer === 'all' ? 'All Layers' : mapLayers.find(l => l.id === activeLayer)?.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};