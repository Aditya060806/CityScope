import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { paymentService } from '@/services/PaymentService';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  Gift, 
  Star, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  MapPin, 
  Mail, 
  Phone,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trophy,
  Award,
  Coins,
  ShoppingCart,
  Download,
  History,
  Filter,
  Search
} from 'lucide-react';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  category: 'discount' | 'voucher' | 'cash' | 'experience' | 'recognition';
  value: number;
  currency: string;
  isActive: boolean;
  imageUrl?: string;
  termsAndConditions: string;
  expiryDays?: number;
  maxRedemptions?: number;
  currentRedemptions: number;
}

interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  pointsSpent: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'expired';
  redeemedAt: Date;
  expiresAt?: Date;
  transactionId?: string;
  paymentMethod?: string;
  deliveryMethod: 'email' | 'sms' | 'mail' | 'pickup';
  deliveryDetails: {
    email?: string;
    phone?: string;
    address?: string;
    pickupLocation?: string;
  };
  reward: RewardItem;
}

interface RewardRedemptionCenterProps {
  className?: string;
}

export const RewardRedemptionCenter: React.FC<RewardRedemptionCenterProps> = ({
  className
}) => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [showRedemptionDialog, setShowRedemptionDialog] = useState(false);
  const [redemptionForm, setRedemptionForm] = useState({
    paymentMethod: 'points',
    deliveryMethod: 'email' as 'email' | 'sms' | 'mail' | 'pickup',
    deliveryDetails: {
      email: '',
      phone: '',
      address: '',
      pickupLocation: ''
    }
  });
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rewardsData, userRewardsData] = await Promise.all([
        paymentService.getAvailableRewards(),
        user?.id ? paymentService.getUserRewards(user.id) : Promise.resolve([])
      ]);
      
      setRewards(rewardsData);
      setUserRewards(userRewardsData);
      
      // Mock user points - in real app, this would come from user data
      setUserPoints(1250);
    } catch (error) {
      console.error('Error loading reward data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const filteredRewards = rewards.filter(reward => {
    const matchesCategory = filterCategory === 'all' || reward.category === filterCategory;
    const matchesSearch = reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && reward.isActive;
  });

  const handleRedeemReward = async () => {
    if (!selectedReward || !user?.id) return;

    setIsRedeeming(true);
    try {
      const userReward = await paymentService.redeemReward(
        user.id,
        selectedReward.id,
        redemptionForm.paymentMethod,
        redemptionForm.deliveryMethod,
        redemptionForm.deliveryDetails
      );

      setUserRewards(prev => [userReward, ...prev]);
      setUserPoints(prev => prev - selectedReward.pointsRequired);
      setShowRedemptionDialog(false);
      setSelectedReward(null);
      
      // Reset form
      setRedemptionForm({
        paymentMethod: 'points',
        deliveryMethod: 'email',
        deliveryDetails: {
          email: '',
          phone: '',
          address: '',
          pickupLocation: ''
        }
      });
    } catch (error) {
      console.error('Error redeeming reward:', error);
    } finally {
      setIsRedeeming(false);
    }
  };

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
      case 'discount': return 'bg-blue-100 text-blue-800';
      case 'voucher': return 'bg-green-100 text-green-800';
      case 'cash': return 'bg-yellow-100 text-yellow-800';
      case 'experience': return 'bg-purple-100 text-purple-800';
      case 'recognition': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'expired': return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      case 'expired': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading rewards...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reward Redemption Center</h2>
          <p className="text-muted-foreground">Redeem your points for amazing rewards</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg">
          <Coins className="w-5 h-5" />
          <span className="font-semibold">{userPoints.toLocaleString()} Points</span>
        </div>
      </div>

      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
          <TabsTrigger value="my-rewards">My Rewards</TabsTrigger>
          <TabsTrigger value="history">Redemption History</TabsTrigger>
        </TabsList>

        {/* Available Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search rewards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="discount">Discounts</SelectItem>
                <SelectItem value="voucher">Vouchers</SelectItem>
                <SelectItem value="cash">Cash Rewards</SelectItem>
                <SelectItem value="experience">Experiences</SelectItem>
                <SelectItem value="recognition">Recognition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map(reward => (
              <Card key={reward.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(reward.category)}
                      <Badge className={getCategoryColor(reward.category)}>
                        {reward.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {reward.pointsRequired.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">points</div>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{reward.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Value:</span>
                    <span className="font-semibold">
                      {reward.currency === 'USD' ? '$' : ''}{reward.value}
                      {reward.category === 'discount' ? '% off' : ''}
                    </span>
                  </div>

                  {reward.maxRedemptions && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Availability:</span>
                        <span>{reward.maxRedemptions - reward.currentRedemptions} left</span>
                      </div>
                      <Progress 
                        value={(reward.currentRedemptions / reward.maxRedemptions) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedReward(reward);
                      setShowRedemptionDialog(true);
                    }}
                    disabled={userPoints < reward.pointsRequired || 
                             (reward.maxRedemptions && reward.currentRedemptions >= reward.maxRedemptions)}
                  >
                    {userPoints < reward.pointsRequired ? 'Insufficient Points' : 'Redeem Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Rewards Tab */}
        <TabsContent value="my-rewards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userRewards.map(userReward => (
              <Card key={userReward.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{userReward.reward.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(userReward.status)}
                      <span className={cn("text-sm font-medium", getStatusColor(userReward.status))}>
                        {userReward.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Points Spent:</span>
                    <span className="font-semibold">{userReward.pointsSpent}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Redeemed:</span>
                    <span>{new Date(userReward.redeemedAt).toLocaleDateString()}</span>
                  </div>
                  {userReward.expiresAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Expires:</span>
                      <span>{new Date(userReward.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span>Delivery:</span>
                    <span className="capitalize">{userReward.deliveryMethod}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {userRewards.map(userReward => (
              <Card key={userReward.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getCategoryIcon(userReward.reward.category)}
                      <div>
                        <h3 className="font-semibold">{userReward.reward.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {userReward.pointsSpent} points • {new Date(userReward.redeemedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(userReward.status)}
                      <span className={cn("text-sm font-medium", getStatusColor(userReward.status))}>
                        {userReward.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Redemption Dialog */}
      <Dialog open={showRedemptionDialog} onOpenChange={setShowRedemptionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
          </DialogHeader>
          
          {selectedReward && (
            <div className="space-y-6">
              {/* Reward Summary */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                {getCategoryIcon(selectedReward.category)}
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedReward.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {selectedReward.pointsRequired.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">points</div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select
                  value={redemptionForm.paymentMethod}
                  onValueChange={(value) => setRedemptionForm(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points ({userPoints.toLocaleString()} available)</SelectItem>
                    <SelectItem value="stripe">Credit/Debit Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Delivery Method</label>
                <Select
                  value={redemptionForm.deliveryMethod}
                  onValueChange={(value) => setRedemptionForm(prev => ({ 
                    ...prev, 
                    deliveryMethod: value as 'pickup' | 'delivery' | 'digital' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="mail">Mail</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Details */}
              <div className="space-y-4">
                {redemptionForm.deliveryMethod === 'email' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={redemptionForm.deliveryDetails.email}
                      onChange={(e) => setRedemptionForm(prev => ({
                        ...prev,
                        deliveryDetails: { ...prev.deliveryDetails, email: e.target.value }
                      }))}
                    />
                  </div>
                )}

                {redemptionForm.deliveryMethod === 'sms' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={redemptionForm.deliveryDetails.phone}
                      onChange={(e) => setRedemptionForm(prev => ({
                        ...prev,
                        deliveryDetails: { ...prev.deliveryDetails, phone: e.target.value }
                      }))}
                    />
                  </div>
                )}

                {redemptionForm.deliveryMethod === 'mail' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mailing Address</label>
                    <Textarea
                      placeholder="Enter your complete mailing address"
                      value={redemptionForm.deliveryDetails.address}
                      onChange={(e) => setRedemptionForm(prev => ({
                        ...prev,
                        deliveryDetails: { ...prev.deliveryDetails, address: e.target.value }
                      }))}
                    />
                  </div>
                )}

                {redemptionForm.deliveryMethod === 'pickup' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pickup Location</label>
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
                        <SelectItem value="city-hall">City Hall</SelectItem>
                        <SelectItem value="community-center">Community Center</SelectItem>
                        <SelectItem value="library">Public Library</SelectItem>
                        <SelectItem value="park-office">Park Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Terms and Conditions */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {selectedReward.termsAndConditions}
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRedemptionDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRedeemReward}
                  disabled={isRedeeming}
                >
                  {isRedeeming ? 'Processing...' : 'Confirm Redemption'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
