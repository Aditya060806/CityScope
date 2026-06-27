import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Star, 
  Clock, 
  Users, 
  MapPin,
  Heart,
  Leaf,
  Sparkles,
  Award,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reward } from '@/types/civic';

interface RewardsCatalogProps {
  rewards: Reward[];
  userPoints: number;
  onRedeem: (reward: Reward) => void;
}

export const RewardsCatalog: React.FC<RewardsCatalogProps> = ({
  rewards,
  userPoints,
  onRedeem
}) => {
  const getCategoryIcon = (category: string) => {
    const iconPath = `/icons/rewards/${category}.svg`;
    return (
      <img 
        src={iconPath} 
        alt={`${category} icon`} 
        className="w-5 h-5" 
        onError={(e) => {
          // Fallback to default icon if SVG doesn't exist
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'experience':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'voucher':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'discount':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cash':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPartnerTypeColor = (partnerType: string) => {
    switch (partnerType) {
      case 'artisan':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'recycler':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'eco-innovator':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (rewards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rewards Available</h3>
          <p className="text-gray-600">Check back later for new rewards from our partners!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Rewards</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover amazing rewards from authentic Indian artisans and eco-innovators. 
          Each reward supports sustainable practices and local communities.
        </p>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => {
          const canRedeem = userPoints >= reward.points_required;
          const partner = reward.partner;
          
          return (
            <Card 
              key={reward.id} 
              className={cn(
                "group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1",
                canRedeem ? "hover:border-blue-300" : "opacity-75"
              )}
            >
              <CardHeader className="pb-4">
                {/* Reward Image */}
                <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                  {reward.image_url ? (
                    <img 
                      src={reward.image_url} 
                      alt={reward.name}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
                              </svg>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Gift className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={cn("text-xs font-semibold", getCategoryColor(reward.category))}>
                      {getCategoryIcon(reward.category)}
                      <span className="ml-1 capitalize">{reward.category}</span>
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {reward.name}
                  </CardTitle>
                  
                  <CardDescription className="text-gray-600 line-clamp-2">
                    {reward.description}
                  </CardDescription>

                  {/* Partner Info */}
                  {partner && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{partner.name}</span>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getPartnerTypeColor(partner.type))}
                      >
                        {partner.type === 'eco-innovator' ? '🌱 Eco-Innovator' : 
                         partner.type === 'recycler' ? '♻️ Recycler' : 
                         '🎨 Artisan'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Points and Value */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">
                        {reward.points_required.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">points</span>
                    </div>
                    
                    {reward.value && (
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Value</div>
                        <div className="text-lg font-semibold text-green-600">
                          ₹{(reward.value / 100).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms and Expiry */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {reward.expiry_days && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Valid {reward.expiry_days} days</span>
                      </div>
                    )}
                    {reward.max_redemptions && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{reward.max_redemptions - (reward.current_redemptions || 0)} left</span>
                      </div>
                    )}
                  </div>

                  {/* Redeem Button */}
                  <Button
                    onClick={() => onRedeem(reward)}
                    disabled={!canRedeem}
                    className={cn(
                      "w-full py-3 text-lg font-semibold transition-all duration-300",
                      canRedeem 
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105" 
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {canRedeem ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Redeem Now
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Need {reward.points_required - userPoints} more points
                      </>
                    )}
                  </Button>

                  {/* Eco-friendly indicator */}
                  {partner?.type === 'recycler' || partner?.type === 'eco-innovator' ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                      <Leaf className="w-4 h-4" />
                      <span>🌱 Eco-Friendly Partner</span>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Call to Action */}
      <div className="text-center py-8">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Don't have enough points?
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            Engage with your community, report issues, and participate in civic activities to earn more points!
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold"
          >
            <Award className="w-5 h-5 mr-2" />
            Start Earning Points
          </Button>
        </div>
      </div>
    </div>
  );
};