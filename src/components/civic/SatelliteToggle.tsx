import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Satellite, Map, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SatelliteToggleProps {
  mapStyle: 'default' | 'satellite';
  onToggle: (style: 'default' | 'satellite') => void;
  className?: string;
  disabled?: boolean;
}

export const SatelliteToggle: React.FC<SatelliteToggleProps> = ({
  mapStyle,
  onToggle,
  className,
  disabled = false
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleToggle = async () => {
    if (disabled) return;
    
    setIsTransitioning(true);
    
    // Simulate transition delay for smooth UX
    setTimeout(() => {
      onToggle(mapStyle === 'default' ? 'satellite' : 'default');
      setIsTransitioning(false);
    }, 300);
  };

  if (disabled) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant="outline"
          disabled
          className="bg-muted/50 text-muted-foreground border-muted rounded-xl px-4 py-2"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Satellite Unavailable
        </Button>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
          Not supported here
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        onClick={handleToggle}
        variant={mapStyle === 'satellite' ? 'default' : 'outline'}
        disabled={isTransitioning}
        className={cn(
          'transition-all duration-300 rounded-xl px-4 py-2',
          mapStyle === 'satellite' 
            ? 'bg-royal text-white hover:bg-royal/90 shadow-royal' 
            : 'border-powder hover:bg-powder/20 text-royal',
          isTransitioning && 'opacity-70 scale-95'
        )}
      >
        {isTransitioning ? (
          <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : mapStyle === 'satellite' ? (
          <Map className="w-4 h-4 mr-2" />
        ) : (
          <Satellite className="w-4 h-4 mr-2" />
        )}
        
        {isTransitioning 
          ? 'Switching...' 
          : mapStyle === 'satellite' 
            ? 'Street View' 
            : 'Satellite View'
        }
      </Button>

      {mapStyle === 'satellite' && (
        <Badge className="bg-royal/10 text-royal border-royal/20 text-xs animate-fade-in">
          🛰️ Satellite Active
        </Badge>
      )}
    </div>
  );
};