import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  X,
  Loader2
} from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  category: 'discount' | 'voucher' | 'cash' | 'experience' | 'recognition';
  value: number;
  currency: string;
  isActive: boolean;
  popularity: number;
  expiryDays: number;
  termsAndConditions: string;
  currentRedemptions: number;
  maxRedemptions: number;
  image?: string;
}

interface UserReward {
  id: string;
  rewardId: string;
  rewardName: string;
  redeemedAt: string;
  status: 'active' | 'used' | 'expired';
  expiryDate: string;
  pointsSpent: number;
}

const mockRewards: Reward[] = [
  {
    id: '1',
    name: 'Municipal Service Discount',
    description: '10% discount on all municipal services including permits and fees',
    pointsRequired: 100,
    category: 'discount',
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
    category: 'voucher',
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
    category: 'experience',
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
    description: 'Direct cash transfer to your bank account',
    pointsRequired: 500,
    category: 'cash',
    value: 25,
    currency: 'USD',
    isActive: true,
    popularity: 95,
    expiryDays: 365,
    termsAndConditions: 'Minimum $25. Processing time: 3-5 business days.',
    currentRedemptions: 12,
    maxRedemptions: 50
  },
  {
    id: '5',
    name: 'Community Recognition Badge',
    description: 'Digital badge displayed on your profile for civic engagement',
    pointsRequired: 150,
    category: 'recognition',
    value: 0,
    currency: 'USD',
    isActive: true,
    popularity: 67,
    expiryDays: 365,
    termsAndConditions: 'Permanent badge. Can be shared on social media.',
    currentRedemptions: 34,
    maxRedemptions: 100
  }
];

const mockUserRewards: UserReward[] = [
  {
    id: '1',
    rewardId: '1',
    rewardName: 'Municipal Service Discount',
    redeemedAt: '2024-01-15T10:30:00Z',
    status: 'active',
    expiryDate: '2024-02-15T10:30:00Z',
    pointsSpent: 100
  },
  {
    id: '2',
    rewardId: '2',
    rewardName: 'Community Event Pass',
    redeemedAt: '2024-01-10T14:20:00Z',
    status: 'used',
    expiryDate: '2024-07-10T14:20:00Z',
    pointsSpent: 200
  }
];

interface SimpleRewardsCenterProps {
  className?: string;
}

export const SimpleRewardsCenter: React.FC<SimpleRewardsCenterProps> = ({ className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewards] = useState<Reward[]>(mockRewards);
  const [userRewards, setUserRewards] = useState<UserReward[]>(mockUserRewards);
  const [userPoints, setUserPoints] = useState(1250);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedemptionDialog, setShowRedemptionDialog] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionForm, setRedemptionForm] = useState({
    deliveryMethod: 'email' as 'email' | 'sms' | 'pickup',
    deliveryDetails: {
      email: user?.email || '',
      phone: '',
      address: '',
      pickupLocation: 'City Hall - Main Office'
    },
    notes: ''
  });

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
        icon: () => <img src="/icons/rewards/discount.svg" alt="discount" className="w-6 h-6" />
      },
      voucher: { 
        color: 'from-blue-500 to-cyan-600', 
        bg: 'bg-blue-50', 
        text: 'text-blue-700',
        icon: () => <img src="/icons/rewards/access.svg" alt="access" className="w-6 h-6" />
      },
      cash: { 
        color: 'from-yellow-500 to-orange-600', 
        bg: 'bg-yellow-50', 
        text: 'text-yellow-700',
        icon: () => <img src="/icons/rewards/social_impact.svg" alt="social impact" className="w-6 h-6" />
      },
      experience: { 
        color: 'from-purple-500 to-pink-600', 
        bg: 'bg-purple-50', 
        text: 'text-purple-700',
        icon: () => <img src="/icons/rewards/experience.svg" alt="experience" className="w-6 h-6" />
      },
      recognition: { 
        color: 'from-red-500 to-rose-600', 
        bg: 'bg-red-50', 
        text: 'text-red-700',
        icon: () => <img src="/icons/rewards/recognition.svg" alt="recognition" className="w-6 h-6" />
      },
      access: { 
        color: 'from-blue-500 to-cyan-600', 
        bg: 'bg-blue-50', 
        text: 'text-blue-700',
        icon: () => <img src="/icons/rewards/access.svg" alt="access" className="w-6 h-6" />
      },
      education: { 
        color: 'from-orange-500 to-amber-600', 
        bg: 'bg-orange-50', 
        text: 'text-orange-700',
        icon: () => <img src="/icons/rewards/education.svg" alt="education" className="w-6 h-6" />
      },
      social_impact: { 
        color: 'from-pink-500 to-rose-600', 
        bg: 'bg-pink-50', 
        text: 'text-pink-700',
        icon: () => <img src="/icons/rewards/social_impact.svg" alt="social impact" className="w-6 h-6" />
      }
    };
    return configs[category as keyof typeof configs] || configs.discount;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      active: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
      used: { color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle },
      expired: { color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock }
    };
    return configs[status as keyof typeof configs] || configs.active;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to redeem rewards",
        variant: "destructive"
      });
      return;
    }

    if (userPoints < reward.pointsRequired) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.pointsRequired - userPoints} more points to redeem this reward`,
        variant: "destructive"
      });
      return;
    }

    setSelectedReward(reward);
    setShowRedemptionDialog(true);
  };

  const confirmRedemption = async () => {
    if (!selectedReward) return;

    setIsRedeeming(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user points
      setUserPoints(prev => prev - selectedReward.pointsRequired);
      
      // Add to user rewards
      const newUserReward: UserReward = {
        id: Date.now().toString(),
        rewardId: selectedReward.id,
        rewardName: selectedReward.name,
        redeemedAt: new Date().toISOString(),
        status: 'active',
        expiryDate: new Date(Date.now() + selectedReward.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
        pointsSpent: selectedReward.pointsRequired
      };
      
      setUserRewards(prev => [newUserReward, ...prev]);
      
      toast({
        title: "🎉 Reward Redeemed Successfully!",
        description: `${selectedReward.name} has been added to your rewards. Check your email for details.`,
      });
      
      setShowRedemptionDialog(false);
      setSelectedReward(null);
      
    } catch (error) {
      toast({
        title: "Redemption Failed",
        description: "There was an error processing your redemption. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-royal to-royal/80 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sleek">
          <Gift className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Rewards Center</h1>
        <p className="text-gray-600 text-lg">Earn points and redeem amazing rewards for your civic engagement</p>
      </div>

      {/* User Points Display */}
      <Card className="border-royal/20 shadow-sleek">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sleek">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{userPoints.toLocaleString()}</h3>
                <p className="text-gray-600">Available Points</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Level 3 Citizen</span>
              </div>
              <Progress value={65} className="w-32 h-2" />
              <p className="text-xs text-gray-500 mt-1">650 points to next level</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search rewards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl border-royal/20 focus:border-royal focus:ring-royal/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'discount', 'voucher', 'cash', 'experience', 'recognition'].map((category) => (
            <Button
              key={category}
              variant={filterCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory(category)}
              className={cn(
                "capitalize text-xs sm:text-sm",
                filterCategory === category 
                  ? "bg-royal text-white" 
                  : "hover:bg-royal/10 hover:border-royal/50"
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Rewards Tabs */}
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="available" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sleek">
            Available Rewards
          </TabsTrigger>
          <TabsTrigger value="my-rewards" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sleek">
            My Rewards
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sleek">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredRewards.map((reward) => {
              const config = getCategoryConfig(reward.category);
              const IconComponent = config.icon;
              const canAfford = userPoints >= reward.pointsRequired;
              const progressPercentage = (reward.currentRedemptions / reward.maxRedemptions) * 100;

              return (
                <Card key={reward.id} className="group hover:shadow-sleek-lg transition-all duration-300 border-royal/10">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center", config.bg)}>
                        <IconComponent className={cn("w-10 h-10", config.text)} />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {reward.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-royal transition-colors">
                      {reward.name}
                    </CardTitle>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {reward.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900">{reward.pointsRequired} points</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-royal">
                          ${reward.value}
                        </div>
                        <div className="text-xs text-gray-500">Value</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Popularity</span>
                        <span>{reward.popularity}%</span>
                      </div>
                      <Progress value={reward.popularity} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Availability</span>
                        <span>{reward.currentRedemptions}/{reward.maxRedemptions}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Valid for {reward.expiryDays} days</span>
                    </div>
                    
                    <Button 
                      onClick={() => handleRedeemReward(reward)}
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
          {userRewards.length > 0 ? (
            <div className="space-y-4">
              {userRewards.map((userReward) => {
                const statusConfig = getStatusConfig(userReward.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <Card key={userReward.id} className="border-royal/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", statusConfig.bg)}>
                            <StatusIcon className={cn("w-6 h-6", statusConfig.color)} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{userReward.rewardName}</h3>
                            <p className="text-sm text-gray-600">
                              Redeemed on {formatDate(userReward.redeemedAt)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Expires on {formatDate(userReward.expiryDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "capitalize",
                              userReward.status === 'active' && "border-green-500 text-green-700",
                              userReward.status === 'used' && "border-blue-500 text-blue-700",
                              userReward.status === 'expired' && "border-gray-500 text-gray-700"
                            )}
                          >
                            {userReward.status}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {userReward.pointsSpent} points
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-royal/10 to-powder/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-12 h-12 text-royal" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Points History</h3>
            <p className="text-gray-500 mb-6">Track your points earning and spending history</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-royal/10">
                <div className="text-2xl font-bold text-royal">1,250</div>
                <div className="text-sm text-gray-600">Current Points</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-royal/10">
                <div className="text-2xl font-bold text-green-600">+300</div>
                <div className="text-sm text-gray-600">Earned This Month</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-royal/10">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-gray-600">Rewards Redeemed</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Redemption Dialog */}
      <Dialog open={showRedemptionDialog} onOpenChange={setShowRedemptionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-royal" />
              Redeem Reward
            </DialogTitle>
          </DialogHeader>
          
          {selectedReward && (
            <div className="space-y-6">
              {/* Reward Summary */}
              <div className="bg-gradient-to-r from-royal/10 to-powder/10 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-royal/20 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-royal" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedReward.name}</h3>
                    <p className="text-sm text-gray-600">{selectedReward.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{selectedReward.pointsRequired} points</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-royal">${selectedReward.value}</div>
                    <div className="text-xs text-gray-500">Value</div>
                  </div>
                </div>
              </div>

              {/* Delivery Method */}
              <div className="space-y-2">
                <Label htmlFor="delivery-method">Delivery Method</Label>
                <Select
                  value={redemptionForm.deliveryMethod}
                  onValueChange={(value: 'email' | 'sms' | 'pickup') => 
                    setRedemptionForm(prev => ({ ...prev, deliveryMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Delivery</SelectItem>
                    <SelectItem value="sms">SMS Delivery</SelectItem>
                    <SelectItem value="pickup">Pickup at Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Details */}
              {redemptionForm.deliveryMethod === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={redemptionForm.deliveryDetails.email}
                    onChange={(e) => setRedemptionForm(prev => ({
                      ...prev,
                      deliveryDetails: { ...prev.deliveryDetails, email: e.target.value }
                    }))}
                    placeholder="Enter your email address"
                  />
                </div>
              )}

              {redemptionForm.deliveryMethod === 'sms' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={redemptionForm.deliveryDetails.phone}
                    onChange={(e) => setRedemptionForm(prev => ({
                      ...prev,
                      deliveryDetails: { ...prev.deliveryDetails, phone: e.target.value }
                    }))}
                    placeholder="Enter your phone number"
                  />
                </div>
              )}

              {redemptionForm.deliveryMethod === 'pickup' && (
                <div className="space-y-2">
                  <Label htmlFor="pickup-location">Pickup Location</Label>
                  <Select
                    value={redemptionForm.deliveryDetails.pickupLocation}
                    onValueChange={(value) => setRedemptionForm(prev => ({
                      ...prev,
                      deliveryDetails: { ...prev.deliveryDetails, pickupLocation: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pickup location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="City Hall - Main Office">City Hall - Main Office</SelectItem>
                      <SelectItem value="Community Center">Community Center</SelectItem>
                      <SelectItem value="Public Library">Public Library</SelectItem>
                      <SelectItem value="Recreation Center">Recreation Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={redemptionForm.notes}
                  onChange={(e) => setRedemptionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special instructions or notes..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRedemptionDialog(false)}
                  className="flex-1"
                  disabled={isRedeeming}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmRedemption}
                  disabled={isRedeeming}
                  className="flex-1 btn-royal"
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Confirm Redemption
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
