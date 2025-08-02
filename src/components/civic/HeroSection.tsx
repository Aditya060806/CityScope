import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles, Users, TrendingUp } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  totalIssues: number;
  resolvedIssues: number;
  onGetStarted?: () => void;
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalIssues,
  resolvedIssues,
  onGetStarted,
  className
}) => {
  const { userLocation } = useLocation();

  const impactStats = [
    {
      value: totalIssues.toString(),
      label: 'Issues Tracked',
      icon: TrendingUp,
      color: 'text-primary'
    },
    {
      value: resolvedIssues.toString(),
      label: 'Resolved',
      icon: Sparkles,
      color: 'text-secondary'
    },
    {
      value: '24h',
      label: 'Avg Response',
      icon: Users,
      color: 'text-accent'
    }
  ];

  return (
    <div className={cn('relative overflow-hidden min-h-[500px] sm:min-h-[600px] lg:min-h-[700px]', className)}>
      {/* Enhanced Background with Royal Blue Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-royal via-royal/90 to-powder/40" />
      <div className="absolute inset-0 bg-gradient-to-tr from-royal/95 via-transparent to-bone/20" />
      
      {/* Dynamic Floating Elements - Responsive */}
      <div className="absolute top-10 sm:top-16 lg:top-20 right-8 sm:right-12 lg:right-16 w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 bg-powder/30 rounded-full blur-2xl sm:blur-3xl animate-float" />
      <div className="absolute bottom-10 sm:bottom-16 lg:bottom-20 left-8 sm:left-12 lg:left-16 w-12 sm:w-18 lg:w-24 h-12 sm:h-18 lg:h-24 bg-bone/40 rounded-full blur-xl sm:blur-2xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 left-1/4 w-8 sm:w-12 lg:w-16 h-8 sm:h-12 lg:h-16 bg-white/20 rounded-full blur-lg sm:blur-xl animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Glassmorphic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-royal/5 to-royal/20 backdrop-blur-[1px]" />
      
      {/* Content */}
      <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-32">
        <div className="max-w-6xl mx-auto text-center">
          {/* Brand Badge */}
          <div className="space-y-6 sm:space-y-8 lg:space-y-12 mb-8 sm:mb-10 lg:mb-12">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-white/15 backdrop-blur-lg rounded-full border border-white/25 text-white shadow-xl hover:bg-white/20 transition-all duration-300 animate-slide-up">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-bone animate-pulse" />
              <span className="font-medium text-sm sm:text-base lg:text-lg">Smart City. Better Tomorrow.</span>
            </div>
            
            {/* Hero Headlines - Responsive Typography */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tight">
                CityScope
              </h1>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-bone via-powder to-white bg-clip-text text-transparent leading-tight">
                Report. Resolve. Rise.
              </h2>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-medium">
                See your city clearly. Act instantly. 💪
              </p>
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/75 max-w-3xl mx-auto leading-relaxed">
                Your comprehensive view into city health. Report civic issues instantly, track real-time progress, and build stronger communities through hyperlocal engagement.
              </p>
            </div>
          </div>

          {/* Location Badge */}
          {userLocation && (
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 text-white mb-8 sm:mb-10 animate-slide-up shadow-lg hover:bg-white/15 transition-all duration-300" style={{ animationDelay: '0.3s' }}>
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-bone" />
              <span className="font-semibold truncate max-w-32 sm:max-w-48 lg:max-w-64 text-sm sm:text-base">
                {userLocation.address}
              </span>
              <Badge className="bg-bone/20 text-bone border-bone/30 text-xs sm:text-sm font-bold px-2 sm:px-3 py-1">
                ACTIVE
              </Badge>
            </div>
          )}

          {/* Enhanced Impact Stats - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12 max-w-xs sm:max-w-2xl mx-auto">
            {impactStats.map((stat, index) => (
              <div 
                key={index} 
                className="glass-card bg-white/10 backdrop-blur-xl border-white/20 p-4 sm:p-5 lg:p-6 animate-scale-in hover:bg-white/15 transition-all duration-300 hover:scale-105 cursor-pointer group" 
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-bone/20 rounded-xl flex items-center justify-center group-hover:bg-bone/30 transition-colors duration-300">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-bone" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white">{stat.value}</p>
                    <p className="text-xs sm:text-sm lg:text-base text-white/70 font-medium">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced CTA Button - Responsive */}
          {onGetStarted && (
            <div className="animate-scale-in" style={{ animationDelay: '0.8s' }}>
              <Button 
                onClick={onGetStarted}
                className="bg-bone text-royal hover:bg-bone/90 hover:scale-105 active:scale-95 transition-all duration-300 font-bold text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-6 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-bone/50 border-2 border-bone/20 hover:border-bone/40 group"
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 group-hover:scale-110 transition-transform duration-300" />
                Start Reporting
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 lg:h-32 bg-gradient-to-t from-powder/30 to-transparent pointer-events-none" />
    </div>
  );
};