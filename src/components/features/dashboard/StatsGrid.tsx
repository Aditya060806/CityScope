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
    value: number;
    isPositive: boolean;
  };
}

interface StatsGridProps {
  stats: StatCard[];
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, className }) => {
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
      'text-primary': {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        icon: 'bg-blue-600 text-white',
        text: 'text-blue-900'
      },
      'text-success': {
        bg: 'bg-gradient-to-br from-green-50 to-green-100',
        icon: 'bg-green-600 text-white',
        text: 'text-green-900'
      },
      'text-warning': {
        bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
        icon: 'bg-yellow-600 text-white',
        text: 'text-yellow-900'
      },
      'text-accent': {
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
        icon: 'bg-purple-600 text-white',
        text: 'text-purple-900'
      }
    };
    return colorMap[color] || colorMap['text-primary'];
  };

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color);
        
        return (
          <Card 
            key={index}
            className={cn(
              "group hover:shadow-lg transition-all duration-300 transform hover:scale-105 border-0",
              colors.bg
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                  colors.icon
                )}>
                  <stat.icon className="w-6 h-6" />
                </div>
                
                {stat.trend && (
                  <div className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    stat.trend.isPositive 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  )}>
                    {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <div className={cn("text-2xl font-bold", colors.text)}>
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {stat.title}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};