import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  Map, 
  Camera, 
  MessageSquare, 
  Shield, 
  Zap, 
  Globe,
  CreditCard,
  Bell,
  BarChart3,
  Users,
  Award,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'core' | 'ai' | 'social' | 'analytics' | 'security' | 'rewards';
  status: 'active' | 'beta' | 'coming-soon';
  color: string;
  bgColor: string;
}

interface FeatureShowcaseProps {
  className?: string;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ className }) => {
  const features: Feature[] = [
    // Core Features
    {
      id: 'mobile-first',
      title: 'Mobile-First Design',
      description: 'Optimized for smartphones with offline support and PWA capabilities',
      icon: <Smartphone className="w-6 h-6" />,
      category: 'core',
      status: 'active',
      color: 'text-royal',
      bgColor: 'bg-royal/10'
    },
    {
      id: 'real-time-map',
      title: 'Real-time Mapping',
      description: 'Interactive maps with live issue tracking and location-based services',
      icon: <Map className="w-6 h-6" />,
      category: 'core',
      status: 'active',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'photo-reports',
      title: 'Photo Reports',
      description: 'Upload multiple photos with automatic compression and optimization',
      icon: <Camera className="w-6 h-6" />,
      category: 'core',
      status: 'active',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    
    // AI Features
    {
      id: 'ai-categorization',
      title: 'AI-Powered Categorization',
      description: 'Automatic issue categorization using machine learning',
      icon: <Zap className="w-6 h-6" />,
      category: 'ai',
      status: 'active',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 'smart-suggestions',
      title: 'Smart Suggestions',
      description: 'AI-generated suggestions for issue resolution',
      icon: <Star className="w-6 h-6" />,
      category: 'ai',
      status: 'beta',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    
    // Social Features
    {
      id: 'community-chat',
      title: 'Community Chat',
      description: 'Real-time chat for issue discussions and updates',
      icon: <MessageSquare className="w-6 h-6" />,
      category: 'social',
      status: 'active',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      id: 'citizen-leaderboard',
      title: 'Citizen Leaderboard',
      description: 'Gamified system to recognize active community members',
      icon: <Users className="w-6 h-6" />,
      category: 'social',
      status: 'active',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    
    // Analytics Features
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics',
      description: 'Comprehensive dashboards with insights and trends',
      icon: <BarChart3 className="w-6 h-6" />,
      category: 'analytics',
      status: 'active',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    {
      id: 'performance-tracking',
      title: 'Performance Tracking',
      description: 'Monitor resolution times and department efficiency',
      icon: <TrendingUp className="w-6 h-6" />,
      category: 'analytics',
      status: 'active',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    
    // Security Features
    {
      id: 'security-monitoring',
      title: 'Security Monitoring',
      description: 'Advanced security features and threat detection',
      icon: <Shield className="w-6 h-6" />,
      category: 'security',
      status: 'active',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy',
      description: 'GDPR compliant with end-to-end encryption',
      icon: <CheckCircle className="w-6 h-6" />,
      category: 'security',
      status: 'active',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    
    // Rewards Features
    {
      id: 'reward-system',
      title: 'Reward System',
      description: 'Earn points and redeem cash rewards for contributions',
      icon: <Award className="w-6 h-6" />,
      category: 'rewards',
      status: 'active',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      id: 'upi-payments',
      title: 'UPI Payments',
      description: 'Instant reward payments via UPI integration',
      icon: <CreditCard className="w-6 h-6" />,
      category: 'rewards',
      status: 'active',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    },
    
    // Notification Features
    {
      id: 'push-notifications',
      title: 'Push Notifications',
      description: 'Real-time updates and alerts for issue status',
      icon: <Bell className="w-6 h-6" />,
      category: 'core',
      status: 'active',
      color: 'text-violet-600',
      bgColor: 'bg-violet-100'
    },
    {
      id: 'multi-language',
      title: 'Multi-language Support',
      description: 'Support for multiple Indian languages',
      icon: <Globe className="w-6 h-6" />,
      category: 'core',
      status: 'coming-soon',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100'
    }
  ];

  const categories = {
    core: { label: 'Core Features', color: 'bg-royal/10 text-royal' },
    ai: { label: 'AI & ML', color: 'bg-purple-100 text-purple-600' },
    social: { label: 'Social', color: 'bg-pink-100 text-pink-600' },
    analytics: { label: 'Analytics', color: 'bg-teal-100 text-teal-600' },
    security: { label: 'Security', color: 'bg-red-100 text-red-600' },
    rewards: { label: 'Rewards', color: 'bg-amber-100 text-amber-600' }
  };

  const getStatusBadge = (status: Feature['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
      case 'beta':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Beta</Badge>;
      case 'coming-soon':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Coming Soon</Badge>;
    }
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Comprehensive Feature Set</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          CityScope is packed with cutting-edge features designed to revolutionize civic engagement in India
        </p>
      </div>

      {/* Feature Categories */}
      {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
        const categoryFeatures = features.filter(f => f.category === categoryKey);
        
        return (
          <div key={categoryKey} className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge className={cn("px-4 py-2 text-sm font-semibold", categoryInfo.color)}>
                {categoryInfo.label}
              </Badge>
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-500">{categoryFeatures.length} features</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryFeatures.map((feature) => (
                <Card 
                  key={feature.id} 
                  className="bg-white rounded-2xl shadow-sleek border border-gray-100 hover:shadow-sleek-lg transition-all duration-300 hover:scale-105"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", feature.bgColor)}>
                          <div className={feature.color}>
                            {feature.icon}
                          </div>
                        </div>
                        {getStatusBadge(feature.status)}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Technology Stack */}
      <Card className="bg-gradient-to-br from-royal/5 to-powder/20 rounded-3xl border border-royal/20">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl font-bold text-gray-900 text-center">Built with Modern Technology</CardTitle>
          <p className="text-gray-600 text-center">Leveraging the latest tools and frameworks for optimal performance</p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'React 18', description: 'Modern UI Framework' },
              { name: 'TypeScript', description: 'Type Safety' },
              { name: 'Tailwind CSS', description: 'Utility-First Styling' },
              { name: 'Supabase', description: 'Backend as a Service' },
              { name: 'Vite', description: 'Fast Build Tool' },
              { name: 'PWA', description: 'Progressive Web App' },
              { name: 'AI/ML APIs', description: 'Smart Features' },
              { name: 'Real-time', description: 'Live Updates' }
            ].map((tech, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sleek">
                  <div className="w-8 h-8 bg-gradient-to-br from-royal to-royal/80 rounded-lg"></div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{tech.name}</h4>
                <p className="text-xs text-gray-600">{tech.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center bg-gradient-card rounded-3xl p-8 shadow-sleek border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Transform Your City?</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Join thousands of citizens already using CityScope to make their communities better. 
          Start reporting issues today and earn rewards for your contributions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="bg-royal hover:bg-royal/90 text-white px-8 py-3 rounded-xl font-semibold shadow-card hover:shadow-card-hover transition-all duration-300 hover:scale-105">
            Get Started Now
          </Button>
          <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};
