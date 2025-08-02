import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCard {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

interface StatsGridProps {
  stats: StatCard[];
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, className }) => {
  return (
    <div className={cn('civic-grid', className)}>
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="glass-card hover:shadow-float transition-all duration-300 hover:scale-105 animate-slide-up group"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={cn(
                'p-2 md:p-3 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110',
                'bg-background/50'
              )}>
                <stat.icon className={cn('w-5 h-5 md:w-6 md:h-6 transition-colors duration-300', stat.color)} />
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate mb-1">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl md:text-2xl font-bold text-foreground truncate">
                    {stat.value}
                  </p>
                  {stat.trend && (
                    <span className={cn(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      stat.trend.isPositive 
                        ? 'bg-success/10 text-success' 
                        : 'bg-destructive/10 text-destructive'
                    )}>
                      {stat.trend.isPositive ? '+' : ''}{stat.trend.value}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};