import React from 'react';
import { Spotlight } from './spotlight';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  intensity?: 'low' | 'medium' | 'high';
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor = '#1e40af',
  spotlightPosition = 'top-left',
  intensity = 'medium'
}) => {
  const getSpotlightPosition = () => {
    switch (spotlightPosition) {
      case 'top-left':
        return 'top-0 left-0';
      case 'top-right':
        return 'top-0 right-0';
      case 'bottom-left':
        return 'bottom-0 left-0';
      case 'bottom-right':
        return 'bottom-0 right-0';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-0 left-0';
    }
  };

  const getIntensityOpacity = () => {
    switch (intensity) {
      case 'low':
        return 'opacity-30';
      case 'medium':
        return 'opacity-50';
      case 'high':
        return 'opacity-70';
      default:
        return 'opacity-50';
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Spotlight Effect */}
      <div className={cn('absolute inset-0 pointer-events-none', getIntensityOpacity())}>
        <Spotlight 
          className={getSpotlightPosition()} 
          fill={spotlightColor}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
