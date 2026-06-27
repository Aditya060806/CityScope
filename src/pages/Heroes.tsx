import React from 'react';
import { HeroLeaderboard } from '@/components/civic/HeroLeaderboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Users, Award, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';

const heroSteps = [
  {
    title: 'Report Issues',
    description: 'Submit civic issues you encounter in your daily life',
  },
  {
    title: 'Earn Points',
    description: 'Get points for each report and bonus points for resolved issues',
  },
  {
    title: 'Climb the Ranks',
    description: 'Rise through the leaderboard and earn special badges',
  },
];

const badgeTiers = [
  { emoji: '🏆', title: 'Local Hero', subtitle: '10+ reports' },
  { emoji: '🔧', title: 'Problem Solver', subtitle: '5+ resolved' },
  { emoji: '🚀', title: 'Early Adopter', subtitle: 'First month' },
  { emoji: '👑', title: 'Community Champion', subtitle: 'Top 3 ranker' },
];

const impactStats = [
  {
    label: 'Total Reports',
    value: '1,247',
    icon: TrendingUp,
    containerClass: 'bg-blue-50',
    badgeClass: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300',
  },
  {
    label: 'Issues Resolved',
    value: '892',
    icon: Star,
    containerClass: 'bg-green-50',
    badgeClass: 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300',
  },
  {
    label: 'Active Heroes',
    value: '156',
    icon: Users,
    containerClass: 'bg-sky-50',
    badgeClass: 'bg-gradient-to-r from-sky-100 to-sky-200 text-sky-700 border-sky-300',
  },
  {
    label: 'Resolution Rate',
    value: '71.5%',
    icon: Target,
    containerClass: 'bg-indigo-50',
    badgeClass: 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 border-indigo-300',
  },
];

export const Heroes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container bg-gradient-to-br from-white via-slate-50 to-blue-50/30">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <PageHeader
            icon={<Trophy className="h-5 w-5" />}
            title="Local Heroes"
            description="Celebrate community members driving civic change by reporting and helping resolve city issues."
            actions={
              <Button onClick={() => navigate('/report')} className="btn-royal">
                <Target className="w-4 h-4 mr-2" />
                Report an Issue
              </Button>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Leaderboard */}
            <div className="lg:col-span-2">
              <HeroLeaderboard limit={20} />
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <SectionCard
                title="Become a Local Hero"
                icon={<Target className="w-5 h-5 text-royal" />}
                className="rounded-3xl overflow-hidden"
                contentClassName="space-y-6 pt-0"
              >
                <div className="space-y-6">
                  {heroSteps.map((step, index) => (
                    <div key={step.title} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-royal/10 to-royal/20 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-sm font-black text-royal">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-royal text-lg">{step.title}</h4>
                        <p className="text-gray-600 font-medium">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={() => navigate('/report')} className="w-full btn-royal py-4 rounded-2xl font-bold">
                  <Target className="w-5 h-5 mr-3" />
                  Report an Issue
                </Button>
              </SectionCard>

              {/* Badge System */}
              <SectionCard
                title="Badge System"
                icon={<Award className="w-5 h-5 text-royal" />}
                className="rounded-3xl overflow-hidden"
                contentClassName="pt-0"
              >
                <div className="grid grid-cols-2 gap-4">
                  {badgeTiers.map((badge) => (
                    <div key={badge.title} className="text-center p-6 bg-gradient-to-br from-royal/5 to-royal/10 border border-royal/20 rounded-2xl hover:scale-105 transition-all duration-300">
                      <div className="text-3xl mb-3">{badge.emoji}</div>
                      <h4 className="text-sm font-bold text-royal">{badge.title}</h4>
                      <p className="text-xs text-gray-600 font-medium">{badge.subtitle}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Community Stats */}
              <SectionCard
                title="Community Impact"
                icon={<Users className="w-5 h-5 text-royal" />}
                className="rounded-3xl overflow-hidden"
                contentClassName="space-y-4 pt-0"
              >
                {impactStats.map((stat) => (
                  <div key={stat.label} className={cn('flex items-center justify-between p-4 rounded-2xl', stat.containerClass)}>
                    <span className="text-gray-700 font-semibold">{stat.label}</span>
                    <Badge className={cn('px-4 py-2 rounded-xl font-bold', stat.badgeClass)}>
                      <stat.icon className="w-4 h-4 mr-2" />
                      {stat.value}
                    </Badge>
                  </div>
                ))}
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
