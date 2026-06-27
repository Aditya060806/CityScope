import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Map, Activity, Satellite, Info } from 'lucide-react';

interface MapViewToggleProps {
  currentView: 'pins' | 'heatmap';
  currentStyle: 'default' | 'satellite';
  onViewChange: (view: 'pins' | 'heatmap') => void;
  onStyleChange: (style: 'default' | 'satellite') => void;
  issueCount?: number;
}

export const MapViewToggle: React.FC<MapViewToggleProps> = ({
  currentView,
  currentStyle,
  onViewChange,
  onStyleChange,
  issueCount = 0
}) => {
  return (
    <TooltipProvider>
      <div className="absolute top-4 right-4 z-10 space-y-2">
        {/* View Toggle */}
        <div className="bg-bone/95 backdrop-blur-sm border border-powder/30 rounded-xl p-1 shadow-civic">
          <div className="flex items-center gap-1">
            <Button
              onClick={() => onViewChange('pins')}
              variant={currentView === 'pins' ? 'default' : 'ghost'}
              size="sm"
              className={`
                rounded-lg text-xs font-medium transition-all duration-200
                ${currentView === 'pins' 
                  ? 'bg-royal text-white shadow-royal' 
                  : 'text-royal hover:bg-royal/10'
                }
              `}
            >
              <Map className="w-3 h-3 mr-1" />
              Pins
            </Button>
            
            <Button
              onClick={() => onViewChange('heatmap')}
              variant={currentView === 'heatmap' ? 'default' : 'ghost'}
              size="sm"
              className={`
                rounded-lg text-xs font-medium transition-all duration-200
                ${currentView === 'heatmap' 
                  ? 'bg-royal text-white shadow-royal' 
                  : 'text-royal hover:bg-royal/10'
                }
              `}
            >
              <Activity className="w-3 h-3 mr-1" />
              Heatmap
            </Button>
          </div>
        </div>

        {/* Style Toggle */}
        <div className="bg-bone/95 backdrop-blur-sm border border-powder/30 rounded-xl p-1 shadow-civic">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onStyleChange(currentStyle === 'default' ? 'satellite' : 'default')}
                variant="ghost"
                size="sm"
                className="text-royal hover:bg-royal/10 rounded-lg text-xs font-medium"
              >
                <Satellite className="w-3 h-3 mr-1" />
                {currentStyle === 'satellite' ? 'Map View' : 'Satellite View'}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-bone border-powder/30">
              <p className="text-xs">Best for rural areas & unmarked zones</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Heatmap Legend */}
        {currentView === 'heatmap' && (
          <div className="bg-bone/95 backdrop-blur-sm border border-powder/30 rounded-xl p-3 shadow-civic">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-3 h-3 text-royal" />
                <span className="text-xs font-medium text-royal">Density Legend</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-200"></div>
                  <span className="text-xs text-muted-foreground">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-300"></div>
                  <span className="text-xs text-muted-foreground">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span className="text-xs text-muted-foreground">High</span>
                </div>
              </div>
              
              {issueCount === 0 && (
                <div className="pt-2 border-t border-powder/20">
                  <p className="text-xs text-muted-foreground">
                    Heatmap's empty – be the first to report in your area!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};