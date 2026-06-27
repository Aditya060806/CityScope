import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, CheckCircle, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  totalIssues: number;
  resolvedIssues: number;
  onGetStarted: () => void;
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalIssues,
  resolvedIssues,
  onGetStarted,
  className
}) => {
  const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-200/30 to-transparent rounded-full blur-2xl" />
      
      <Card className="relative bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <div className="p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 text-sm font-medium">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Community Powered
                </Badge>
                
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
                  Make Your City Better
                </h1>
                
                <p className="text-lg text-gray-600 leading-relaxed">
                  Report civic issues, track progress, and help build a better community. 
                  Your voice matters in creating positive change.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={onGetStarted}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Report an Issue
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-gray-200 hover:border-blue-300 px-8 py-3 rounded-xl transition-all duration-300"
                >
                  <Users className="w-5 h-5 mr-2" />
                  View Community
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-900">{totalIssues}</div>
                  <div className="text-sm text-blue-700 font-medium">Total Reports</div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-green-900">{resolvedIssues}</div>
                  <div className="text-sm text-green-700 font-medium">Resolved</div>
                </div>
              </Card>

              <Card className="col-span-2 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <div className="text-center space-y-3">
                  <div className="text-2xl font-bold text-purple-900">{resolutionRate}%</div>
                  <div className="text-sm text-purple-700 font-medium">Success Rate</div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${resolutionRate}%` }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};