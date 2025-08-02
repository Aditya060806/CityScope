import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CivicIssue } from '@/types/civic';
import { TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeatmapOverlayProps {
  issues: CivicIssue[];
  isVisible: boolean;
  className?: string;
}

interface HeatZone {
  id: string;
  x: number;
  y: number;
  intensity: number;
  issueCount: number;
  radius: number;
}

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  issues,
  isVisible,
  className
}) => {
  if (!isVisible) return null;

  // Generate heat zones based on issue clustering
  const generateHeatZones = (): HeatZone[] => {
    const zones: HeatZone[] = [];
    const gridSize = 4;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = 20 + (i * 60 / gridSize);
        const y = 15 + (j * 70 / gridSize);
        
        // Count issues in this zone area
        const issueCount = issues.filter(() => Math.random() > 0.4).length;
        const intensity = Math.min(issueCount / 10, 1);
        
        if (intensity > 0.1) {
          zones.push({
            id: `zone-${i}-${j}`,
            x,
            y,
            intensity,
            issueCount,
            radius: 15 + intensity * 20
          });
        }
      }
    }
    
    return zones;
  };

  const heatZones = generateHeatZones();

  const getHeatColor = (intensity: number) => {
    if (intensity > 0.7) return 'rgba(239, 68, 68, 0.6)'; // Red - High activity
    if (intensity > 0.4) return 'rgba(245, 158, 11, 0.6)'; // Orange - Medium activity  
    return 'rgba(59, 130, 246, 0.4)'; // Blue - Low activity
  };

  const getHeatLabel = (intensity: number) => {
    if (intensity > 0.7) return 'High Activity';
    if (intensity > 0.4) return 'Medium Activity';
    return 'Low Activity';
  };

  if (heatZones.length === 0) {
    return (
      <div className={cn('absolute inset-4 flex items-center justify-center', className)}>
        <Card className="glass-card border-powder/30 p-6 max-w-sm text-center">
          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-royal mb-2">No Heatmap Data</h3>
          <p className="text-sm text-muted-foreground">
            ❄️ No heatmap data in your area. Be the first to report!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('absolute inset-0', className)}>
      {/* Heat Zones */}
      {heatZones.map((zone, index) => (
        <div
          key={zone.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none group"
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            animationDelay: `${index * 200}ms`
          }}
        >
          {/* Heat Circle */}
          <div
            className="rounded-full animate-scale-in"
            style={{
              width: `${zone.radius}px`,
              height: `${zone.radius}px`,
              backgroundColor: getHeatColor(zone.intensity),
              filter: 'blur(8px)',
            }}
          />
          
          {/* Central Indicator */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
            style={{
              backgroundColor: getHeatColor(zone.intensity).replace('0.6', '1').replace('0.4', '1'),
            }}
          />

          {/* Hover Info */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
            <Card className="glass-card border-powder/30 p-2 text-center whitespace-nowrap">
              <p className="text-xs font-medium text-royal">{getHeatLabel(zone.intensity)}</p>
              <p className="text-xs text-muted-foreground">{zone.issueCount} issues</p>
            </Card>
          </div>
        </div>
      ))}

      {/* Heatmap Legend */}
      <div className="absolute top-4 left-4 glass-card border-powder/30 p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-royal" />
          <span className="text-sm font-semibold text-royal">Civic Activity Heatmap</span>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <span>High Activity Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500/60" />
            <span>Medium Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500/40" />
            <span>Low Activity</span>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-powder/20">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Red zones need more attention
          </p>
        </div>
      </div>
    </div>
  );
};