import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  color?: 'default' | 'muted' | 'royal' | 'white' | 'bone';
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className,
  variant = 'body',
  weight = 'normal',
  color = 'default'
}) => {
  const variantClasses = {
    h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
    h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
    h4: 'text-base sm:text-lg md:text-xl',
    body: 'text-sm sm:text-base',
    caption: 'text-xs sm:text-sm'
  };

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    black: 'font-black'
  };

  const colorClasses = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    royal: 'text-royal',
    white: 'text-white',
    bone: 'text-bone'
  };

  return (
    <div className={cn(
      variantClasses[variant],
      weightClasses[weight],
      colorClasses[color],
      className
    )}>
      {children}
    </div>
  );
};