import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Gift, 
  Star, 
  Coins,
  Search,
  Filter,
  Trophy,
  Award,
  CreditCard,
  Sparkles,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

const mockRewards = [
  {
    id: '1',
    name: 'Municipal Service Discount',
    description: '10% discount on all municipal services including permits and fees',
    pointsRequired: 100,
    category: 'discount' as const,
    value: 10,
    currency: 'USD',
    isActive: true,
    popularity: 85,
    expiryDays: 30,
    termsAndConditions: 'Valid for 30 days. Cannot be combined with other offers.',
    currentRedemptions: 45,
    maxRedemptions: 100
  },
  {
    id: '2',
    name: 'Community Event Pass',
    description: 'Free entry to all community events and festivals',
    pointsRequired: 200,
    category: 'voucher' as const,
    value: 25,
    currency: 'USD',
    isActive: true,
    popularity: 92,
    expiryDays: 180,
    termsAndConditions: 'Valid for 6 months. Subject to availability.',
    currentRedemptions: 23,
    maxRedemptions: 50
  },
  {
    id: '3',
    name: 'City Hall VIP Tour',
    description: 'Exclusive behind-the-scenes tour with city officials',
    pointsRequired: 300,
    category: 'experience' as const,
    value: 50,
    currency: 'USD',
    isActive: true,
    popularity: 78,
    expiryDays: 90,
    termsAndConditions: 'Scheduled tours only. Maximum 10 people per tour.',
    currentRedemptions: 8,
    maxRedemptions: 20
  },
  {
    id: '4',
    name: 'Cash Reward',
    description: 'Direct cash reward for your civic contributions',
    pointsRequired: 500,
    category: 'cash' as const,
    value: 50,
    currency: 'USD',
    isActive: true,
    popularity: 95,
    expiryDays: 365,
    termsAndConditions: 'Processed within 5-7 business days.',
    currentRedemptions: 12,
    maxRedemptions: 25
  }
];

interface RewardsCenterProps {
  className?: string;
}

export const RewardsCenter: React.FC<RewardsCenterProps> = ({ className }) => {
  const [rewards] = useState(mockRewards);
  const [userPoints] = useState(1250);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRewards = rewards.filter(reward => {
    const matchesCategory = filterCategory === 'all' || reward.category === filterCategory;
    const matchesSearch = reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && reward.isActive;
  });

  const getCategoryConfig = (category: string) => {
    const configs = {
      discount: { 
        color: 'from-green-500 to-emerald-600', 
        bg: 'bg-green-50', 
        text: 'text-green-700',
        icon: CreditCard 
      },
      voucher: { 
        color: 'from-blue-500 to-cyan-600', 
        bg: 'bg-blue-50', 
        text: 'text-blue-700',
        icon: Gift 
      },
      cash: { 
        color: 'from-yellow-500 to-orange-600', 
        bg: 'bg-yellow-50', 
        text: 'text-yellow-700',
        icon: Coins 
      },
      experience: { 
        color: 'from-purple-500 to-pink-600', 
        bg: 'bg-purple-50', 
        text: 'text-purple-700',
        icon: Trophy 
      },
      recognition: { 
        color: 'from-red-500 to-rose-600', 
        bg: 'bg-red-50', 
        text: 'text-red-700',
        icon: Award 
      }
    };
    return configs[category as keyof typeof configs] || configs.discount;
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-royal via-royal/90 to-powder p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Rewards Center</h1>
                <p className="text-white/80">Redeem your civic points for amazing rewards</p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4">
              <Coins className="w-8 h-8 text-bone" />
              <div>
                <div className="text-3xl font-bold">{userPoints.toLocaleString()}</div>
                <div className="text-sm text-white/80">Available Points</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="rewards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-powder/30 p-1 rounded-xl">
          <TabsTrigger value="rewards" className="rounded-lg data-[state=active]:bg-royal data-[state=active]:text-white">Available Rewards</TabsTrigger>
          <TabsTrigger value="my-rewards" className="rounded-lg data-[state=active]:bg-royal data-[state=active]:text-white">My Rewards</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-royal data-[state=active]:text-white">History</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl border-gray-200 focus:border-royal"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="discount">Discounts</SelectItem>
                <SelectItem value="voucher">Vouchers</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="experience">Experiences</SelectItem>
                <SelectItem value="recognition">Recognition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => {
              const config = getCategoryConfig(reward.category);
              const canAfford = userPoints >= reward.pointsRequired;
              const availabilityPercent = reward.maxRedemptions ? 
                ((reward.maxRedemptions - reward.currentRedemptions) / reward.maxRedemptions) * 100 : 100;

              return (
                <Card key={reward.id} className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden border-0">
                  {/* Card Header with Gradient */}
                  <div className={cn("h-32 bg-gradient-to-br", config.color, "relative overflow-hidden")}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/20 text-white border-0">
                        {reward.popularity}% popular
                      </Badge>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img 
                        src={`/icons/rewards/${reward.category}.svg`} 
                        alt={`${reward.category} icon`} 
                        className="w-24 h-24 object-contain opacity-80" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg group-hover:text-royal transition-colors">
                          {reward.name}
                        </CardTitle>
                        <Badge className={cn("text-xs", config.bg, config.text)}>
                          {reward.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-royal">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold">{reward.pointsRequired}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {reward.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Value:</span>
                        <span className="font-semibold text-gray-900">
                          {reward.currency === 'USD' ? '$' : ''}{reward.value}
                          {reward.category === 'discount' && '%'}
                        </span>
                      </div>

                      {reward.maxRedemptions && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Available:</span>
                            <span className="font-medium">
                              {reward.maxRedemptions - reward.currentRedemptions} left
                            </span>
                          </div>
                          <Progress value={availabilityPercent} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Your Points:</span>
                        <span className={cn(
                          "font-semibold",
                          canAfford ? "text-green-600" : "text-red-600"
                        )}>
                          {userPoints.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      className={cn(
                        "w-full h-12 rounded-xl font-medium transition-all duration-300",
                        canAfford 
                          ? "btn-royal shadow-sleek hover:shadow-sleek-lg" 
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                      disabled={!canAfford}
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      {canAfford ? 'Redeem Now' : 'Insufficient Points'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredRewards.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No rewards found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-rewards" className="space-y-6">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-powder/50 to-bone/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-royal" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No rewards redeemed yet</h3>
            <p className="text-gray-500 mb-6">Start earning points and redeem your first reward!</p>
            <Button className="btn-royal px-8 py-3 rounded-xl">
              Browse Rewards
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No redemption history</h3>
            <p className="text-gray-500">Your redemption history will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};