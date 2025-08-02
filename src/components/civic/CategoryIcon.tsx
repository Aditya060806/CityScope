import React from 'react';
import { IssueCategory, CATEGORY_CONFIG } from '@/types/civic';
import { cn } from '@/lib/utils';

interface CategoryIconProps {
  category: IssueCategory;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  category, 
  size = 'md',
  showLabel = false,
  className
}) => {
  const config = CATEGORY_CONFIG[category];
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-4xl'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div 
        className={cn(
          'rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110',
          sizeClasses[size]
        )}
        style={{ 
          backgroundColor: `${config.color}15`,
          border: `2px solid ${config.color}30`
        }}
      >
        <span role="img" aria-label={config.label}>
          {config.icon}
        </span>
      </div>
      {showLabel && (
        <span 
          className={cn(
            'font-medium text-center',
            labelSizeClasses[size]
          )}
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
};