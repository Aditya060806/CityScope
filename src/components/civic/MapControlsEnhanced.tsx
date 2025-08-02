import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Map, 
  Satellite, 
  Activity, 
  MapPin, 
  Layers,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapControlsEnhancedProps {
  mapView: 'pins' | 'heatmap';
  mapStyle: 'default' | 'satellite';
  onMapViewChange: (view: 'pins' | 'heatmap') => void;
  onMapStyleChange: (style: 'default' | 'satellite') => void;
  issueCount: number;
  className?: string;
}

export const MapControlsEnhanced: React.FC<MapControlsEnhancedProps> = ({
  mapView,
  mapStyle,
  onMapViewChange,
  onMapStyleChange,
  issueCount,
  className
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Map View Toggle */}
      <Card className="glass-card border-powder/30 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-royal" />
          <span className="text-sm font-semibold text-royal">View Mode</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={mapView === 'pins' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onMapViewChange('pins')}
            className={cn(
              'text-xs transition-all duration-200',
              mapView === 'pins' 
                ? 'bg-royal text-white shadow-royal' 
                : 'glass-card border-powder/50 hover:border-royal/50'
            )}
          >
            <MapPin className="w-3 h-3 mr-1" />
            🗺️ Pins
          </Button>
          
          <Button
            variant={mapView === 'heatmap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onMapViewChange('heatmap')}
            className={cn(
              'text-xs transition-all duration-200',
              mapView === 'heatmap' 
                ? 'bg-royal text-white shadow-royal' 
                : 'glass-card border-powder/50 hover:border-royal/50'
            )}
          >
            <Activity className="w-3 h-3 mr-1" />
            🔥 Heatmap
          </Button>
        </div>
      </Card>

      {/* Map Style Toggle */}
      <Card className="glass-card border-powder/30 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Satellite className="w-4 h-4 text-royal" />
          <span className="text-sm font-semibold text-royal">Map Style</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={mapStyle === 'default' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onMapStyleChange('default')}
            className={cn(
              'text-xs transition-all duration-200',
              mapStyle === 'default' 
                ? 'bg-royal text-white shadow-royal' 
                : 'glass-card border-powder/50 hover:border-royal/50'
            )}
          >
            <Map className="w-3 h-3 mr-1" />
            Street
          </Button>
          
          <Button
            variant={mapStyle === 'satellite' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onMapStyleChange('satellite')}
            className={cn(
              'text-xs transition-all duration-200',
              mapStyle === 'satellite' 
                ? 'bg-royal text-white shadow-royal' 
                : 'glass-card border-powder/50 hover:border-royal/50'
            )}
          >
            <Satellite className="w-3 h-3 mr-1" />
            🛰️ Satellite
          </Button>
        </div>
        
        {mapStyle === 'satellite' && (
          <div className="mt-2 p-2 bg-powder/20 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              Best for rural or unmarked locations
            </p>
          </div>
        )}
      </Card>

      {/* Issue Counter */}
      <Card className="glass-card border-powder/30 p-3 text-center">
        <Badge variant="outline" className="bg-royal/5 border-royal/20 w-full justify-center">
          {issueCount} Issues Mapped
        </Badge>
      </Card>
    </div>
  );
};