import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { RewardImageContainer } from '@/components/common/RewardImageContainer';
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
  ShoppingBag,
  Search,
  Filter,
  SortAsc,
  TrendingUp,
  CheckCircle,
  CreditCard,
  Calendar,
  Download,
  Share2,
  Copy,
  Eye,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reward } from '@/types/civic';
import { RedemptionModal } from './RedemptionModal';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedRewardsCatalogProps {
  rewards: Reward[];
  userPoints: number;
  onRedeem: (reward: Reward) => void;
  viewMode?: 'grid' | 'list';
  onToggleBookmark?: (rewardId: string) => void;
  bookmarkedRewards?: Set<string>;
  onShare?: (reward: Reward) => void;
}

export const EnhancedRewardsCatalog: React.FC<EnhancedRewardsCatalogProps> = ({
  rewards,
  userPoints,
  onRedeem,
  viewMode = 'grid',
  onToggleBookmark,
  bookmarkedRewards = new Set(),
  onShare
}) => {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);

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
      case 'recognition':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'experience':
        return 'bg-orange-100 text-orange-800 border-orange-200';
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

  // Rewards are already filtered and sorted by parent component

  const handleRedeem = (reward: Reward) => {
    setSelectedReward(reward);
    setShowRedemptionModal(true);
  };

  const handleConfirmRedemption = async (redemptionData: unknown) => {
    if (selectedReward) {
      await onRedeem(selectedReward);
    }
  };

  const toggleBookmark = (rewardId: string) => {
    if (onToggleBookmark) {
      onToggleBookmark(rewardId);
    }
  };

  const shareReward = (reward: Reward) => {
    if (onShare) {
      onShare(reward);
    }
  };

  if (rewards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/60 backdrop-blur-3xl rounded-[2rem] border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 max-w-md mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 -z-10" />
          <div className="bg-white/80 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-50">
            <Gift className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-black tracking-tighter text-slate-900 mb-2">No Rewards Available</h3>
          <p className="text-slate-500 font-medium leading-relaxed">Check back later for exciting new rewards from our artisan and recycler network!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-3xl rounded-[1.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-slate-50/50 to-purple-50/30 -z-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_70%)] rounded-bl-full pointer-events-none" />
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between relative z-10">
          <div>
            <h2 className="text-[32px] font-black tracking-tighter bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">Available Rewards</h2>
            <p className="text-slate-500 font-medium text-[15px]">
              Discover premium rewards from authentic Indian artisans and eco-innovators.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-[13px] font-black tracking-widest uppercase text-indigo-600 flex items-center bg-white/80 backdrop-blur-md shadow-sm border border-indigo-100/50 px-5 py-2.5 rounded-xl">
              <TrendingUp className="w-4 h-4 mr-2" />
              {rewards.length} rewards found
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Grid/List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}
        >
          {rewards.map((reward) => {
            const canRedeem = userPoints >= reward.points_required;
            const partner = reward.partner;
            const popularityPercentage = Math.floor(Math.random() * 30) + 70;
            const availabilityPercentage = reward.max_redemptions ? 
              ((reward.max_redemptions - (reward.current_redemptions || 0)) / reward.max_redemptions) * 100 : 100;
            const isBookmarked = bookmarkedRewards.has(reward.id);

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className={cn(
                  "rounded-[1.5rem] bg-white/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden",
                  canRedeem 
                    ? "border border-white/80 hover:border-indigo-200 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)]" 
                    : "opacity-80 border border-white/40 grayscale-[0.3]"
                )}>
                  <CardHeader className="pb-4 p-5">
                    <div className="relative w-full h-52 rounded-2xl overflow-hidden mb-5 shadow-sm border border-white backdrop-blur-sm">
                      <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-md -z-10"></div>
                      {reward.image_url ? (
                        <RewardImageContainer
                          src={reward.image_url}
                          alt={reward.name}
                          fallback={`/icons/rewards/${reward.category}.svg`}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                          <img
                            src={`/icons/rewards/${reward.category}.svg`}
                            alt={`${reward.category} icon`}
                            className="w-16 h-16 object-contain opacity-40 drop-shadow-sm"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex gap-2 z-10">
                        <Badge className={cn("text-[11px] font-black tracking-widest uppercase shadow-[0_4px_10px_rgba(0,0,0,0.05)] border-white/50 backdrop-blur-md flex items-center gap-1.5 px-3 py-1.5 rounded-lg", getCategoryColor(reward.category))}>
                          {getCategoryIcon(reward.category)}
                          <span className="capitalize">{reward.category}</span>
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 p-0 bg-white/90 backdrop-blur-md shadow-sm border border-white hover:bg-white hover:scale-105 transition-all rounded-lg"
                          onClick={() => toggleBookmark(reward.id)}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="w-4 h-4 text-indigo-500 drop-shadow-sm" />
                          ) : (
                            <Bookmark className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="text-[19px] leading-tight font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {reward.name}
                      </CardTitle>
                      
                      <CardDescription className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
                        {reward.description}
                      </CardDescription>

                      {/* Partner Info */}
                      {partner && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mt-4 pt-4 border-t border-slate-200/50">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{partner.name}</span>
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] uppercase tracking-widest font-black border border-white shadow-sm px-2 py-0.5 rounded-md", getPartnerTypeColor(partner.type))}
                          >
                            {partner.type === 'eco-innovator' ? '🌱 Eco-Innovator' : 
                             partner.type === 'recycler' ? '♻️ Recycler' : 
                             '🎨 Artisan'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 p-5">
                    <div className="space-y-5">
                      {/* Points and Value */}
                      <div className="flex items-center justify-between p-4.5 bg-white/50 backdrop-blur-md rounded-2xl border border-white/80 shadow-inner">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black tracking-widest uppercase text-slate-400 mb-1">Tokens Required</span>
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_2px_4px_rgba(251,191,36,0.3)]" />
                            <span className="text-[32px] font-black tracking-tighter text-slate-900 leading-none drop-shadow-sm">
                              {reward.points_required.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        {reward.value && reward.value > 0 && (
                          <div className="text-right flex flex-col items-end">
                            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-0.5">Value</span>
                            <div className="text-xl font-black text-emerald-600 tracking-tight leading-none bg-emerald-50 px-2 py-1 rounded-md">
                              ₹{(reward.value / 100).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Popularity and Availability */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Demand</span>
                            <span className="text-[11px] font-black text-indigo-600">{popularityPercentage}%</span>
                          </div>
                          <Progress value={popularityPercentage} className="h-1.5 bg-slate-100" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Stock</span>
                            <span className="text-[11px] font-black text-slate-900">
                              {reward.max_redemptions ? 
                                `${reward.max_redemptions - (reward.current_redemptions || 0)}/${reward.max_redemptions}` : 
                                'Unlimited'
                              }
                            </span>
                          </div>
                          <Progress value={availabilityPercentage} className="h-1.5 bg-slate-100" />
                        </div>
                      </div>

                      {/* Terms and Expiry */}
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                        {reward.expiry_days && (
                          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Valid {reward.expiry_days}d</span>
                          </div>
                        )}
                        {reward.max_redemptions && (
                          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{reward.max_redemptions - (reward.current_redemptions || 0)} left</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 mt-2 border-t border-slate-200/50">
                        <Button
                          onClick={() => handleRedeem(reward)}
                          disabled={!canRedeem}
                          data-tutorial="redeem-button"
                          className={cn(
                            "flex-1 h-12 text-[15px] font-black transition-all rounded-xl relative overflow-hidden group/btn",
                            canRedeem 
                              ? "bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_25px_rgba(99,102,241,0.4)] hover:-translate-y-0.5" 
                              : "bg-slate-100/50 text-slate-400 cursor-not-allowed border border-slate-200/50 backdrop-blur-sm"
                          )}
                        >
                          {canRedeem && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />}
                          <span className="relative z-10 flex items-center justify-center w-full">
                            {canRedeem ? (
                              <>
                                <Sparkles className="w-4 h-4 mr-2 drop-shadow-sm" />
                                Redeem Now
                              </>
                            ) : (
                              <>
                                <Heart className="w-4 h-4 mr-2 text-slate-300" />
                                Need {reward.points_required - userPoints} pts
                              </>
                            )}
                          </span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareReward(reward)}
                          className="w-12 h-12 rounded-xl border border-slate-200/60 bg-white/50 backdrop-blur-sm text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                          <Share2 className="w-4 h-4 drop-shadow-sm" />
                        </Button>
                      </div>

                      {/* Eco-friendly indicator */}
                      {partner?.type === 'recycler' || partner?.type === 'eco-innovator' ? (
                        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-bold tracking-tight bg-emerald-50 py-1.5 rounded-lg">
                          <Leaf className="w-3.5 h-3.5" />
                          <span>Eco-Friendly Partner</span>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Redemption Modal */}
      <RedemptionModal
        isOpen={showRedemptionModal}
        onClose={() => setShowRedemptionModal(false)}
        reward={selectedReward}
        userPoints={userPoints}
        onConfirm={handleConfirmRedemption}
      />

      {/* Call to Action */}
      <div className="text-center py-10 relative">
        <div className="bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-indigo-100 p-12 max-w-2xl mx-auto shadow-[0_12px_40px_rgba(99,102,241,0.06)] relative overflow-hidden group hover:shadow-[0_16px_50px_rgba(99,102,241,0.12)] transition-shadow duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 pointer-events-none" />
          <div className="absolute -inset-1 opacity-20 group-hover:opacity-40 blur-2xl transition-opacity duration-500 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-[2.5rem] -z-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.1),transparent_70%)] rounded-bl-full pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-[28px] font-black tracking-tighter bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
              Don't have enough points?
            </h3>
            <p className="text-lg text-slate-500 font-medium mb-8 max-w-lg mx-auto leading-relaxed">
              Engage with your community, report issues, and participate in civic activities to earn more tokens!
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black tracking-wide h-14 px-10 rounded-[1.25rem] shadow-[0_8px_25px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.45)] hover:-translate-y-1 transition-all relative z-10"
            >
              <Award className="w-5 h-5 mr-2 drop-shadow-sm" />
              Start Earning Points
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
