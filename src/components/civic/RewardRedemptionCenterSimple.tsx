import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  Gift, 
  Star, 
  Coins,
  Search,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Mock data for testing
const mockRewards = [
  {
    id: '1',
    name: 'Municipal Service Discount',
    description: '10% discount on municipal services',
    pointsRequired: 100,
    category: 'discount' as const,
    value: 10,
    currency: 'USD',
    isActive: true,
    termsAndConditions: 'Valid for 30 days. Cannot be combined with other offers.',
    currentRedemptions: 0
  },
  {
    id: '2',
    name: 'Community Event Voucher',
    description: 'Free entry to community events',
    pointsRequired: 200,
    category: 'voucher' as const,
    value: 25,
    currency: 'USD',
    isActive: true,
    termsAndConditions: 'Valid for 6 months. Subject to availability.',
    currentRedemptions: 0
  },
  {
    id: '3',
    name: 'City Hall Tour',
    description: 'Exclusive behind-the-scenes tour',
    pointsRequired: 300,
    category: 'experience' as const,
    value: 50,
    currency: 'USD',
    isActive: true,
    termsAndConditions: 'Scheduled tours only. Maximum 10 people per tour.',
    currentRedemptions: 0
  }
];

interface RewardRedemptionCenterSimpleProps {
  className?: string;
}

export const RewardRedemptionCenterSimple: React.FC<RewardRedemptionCenterSimpleProps> = ({
  className
}) => {
  const [rewards] = useState(mockRewards);
  const [userPoints, setUserPoints] = useState(1250);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReward, setSelectedReward] = useState<unknown>(null);
  const [showRedemptionDialog, setShowRedemptionDialog] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionForm, setRedemptionForm] = useState({
    deliveryMethod: 'email' as 'email' | 'sms' | 'mail' | 'pickup',
    deliveryDetails: {
      email: '',
      phone: '',
      address: '',
      pickupLocation: ''
    }
  });
  const [redeemedRewards, setRedeemedRewards] = useState<unknown[]>([]);
  const { toast } = useToast();

  const filteredRewards = rewards.filter(reward => {
    const matchesCategory = filterCategory === 'all' || reward.category === filterCategory;
    const matchesSearch = reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && reward.isActive;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'discount': return 'bg-green-100 text-green-800';
      case 'voucher': return 'bg-blue-100 text-blue-800';
      case 'cash': return 'bg-yellow-100 text-yellow-800';
      case 'experience': return 'bg-purple-100 text-purple-800';
      case 'recognition': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRedeemReward = (reward: unknown) => {
    console.log('🎁 Reward button clicked!', reward);
    setSelectedReward(reward);
    setShowRedemptionDialog(true);
    // Reset form
    setRedemptionForm({
      deliveryMethod: 'email',
      deliveryDetails: {
        email: '',
        phone: '',
        address: '',
        pickupLocation: ''
      }
    });
    
    // Show immediate feedback
    toast({
      title: "Opening Redemption Dialog",
      description: `Preparing to redeem ${reward.name}`,
      duration: 2000,
    });
  };

  const handleConfirmRedemption = async () => {
    if (!selectedReward) return;

    setIsRedeeming(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Deduct points
      setUserPoints(prev => prev - selectedReward.pointsRequired);
      
      // Add to redeemed rewards
      const redeemedReward = {
        ...selectedReward,
        redeemedAt: new Date(),
        status: 'completed',
        deliveryMethod: redemptionForm.deliveryMethod,
        deliveryDetails: redemptionForm.deliveryDetails
      };
      setRedeemedRewards(prev => [redeemedReward, ...prev]);
      
      // Show success toast
      toast({
        title: "Reward Redeemed! 🎉",
        description: `You've successfully redeemed ${selectedReward.name}. Check your email for details.`,
        duration: 5000,
      });
      
      // Close dialog
      setShowRedemptionDialog(false);
      setSelectedReward(null);
      
    } catch (error) {
      toast({
        title: "Redemption Failed",
        description: "There was an error processing your reward redemption. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const getDeliveryMessage = (reward: unknown) => {
    switch (reward.deliveryMethod) {
      case 'email':
        return `Check your email at ${reward.deliveryDetails.email} for delivery details.`;
      case 'sms':
        return `SMS sent to ${reward.deliveryDetails.phone} with delivery details.`;
      case 'mail':
        return `Will be delivered to ${reward.deliveryDetails.address} within 5-7 business days.`;
      case 'pickup':
        return `Available for pickup at ${reward.deliveryDetails.pickupLocation}.`;
      default:
        return 'Please check your account for delivery details.';
    }
  };

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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
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
            {filteredRewards.map((reward) => (
              <Card key={reward.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{reward.name}</CardTitle>
                      <Badge className={cn("mt-2", getCategoryColor(reward.category))}>
                        {reward.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="w-4 h-4" />
                        <span className="font-semibold">{reward.pointsRequired}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{reward.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Value:</span>
                      <span className="font-semibold">
                        {reward.currency} {reward.value}
                        {reward.category === 'discount' && '%'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Your Points:</span>
                      <span className={cn(
                        "font-semibold",
                        userPoints >= reward.pointsRequired ? "text-green-600" : "text-red-600"
                      )}>
                        {userPoints.toLocaleString()}
                      </span>
                    </div>
                    
                    <Button 
                      className="w-full"
                      disabled={userPoints < reward.pointsRequired}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔥 Button clicked - Event:', e);
                        console.log('🔥 Reward data:', reward);
                        console.log('🔥 User points:', userPoints);
                        console.log('🔥 Points required:', reward.pointsRequired);
                        handleRedeemReward(reward);
                      }}
                      style={{ zIndex: 10, position: 'relative' }}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {userPoints >= reward.pointsRequired ? 'Redeem Now' : 'Insufficient Points'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRewards.length === 0 && (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rewards found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </TabsContent>

        {/* My Rewards Tab */}
        <TabsContent value="my-rewards" className="space-y-4">
          {redeemedRewards.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rewards redeemed yet</h3>
              <p className="text-muted-foreground">Start earning points and redeem your first reward!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {redeemedRewards.map((reward, index) => (
                <Card key={index} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-green-800">{reward.name}</CardTitle>
                        <Badge className={cn("mt-2", getCategoryColor(reward.category))}>
                          {reward.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-semibold">Redeemed</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">{reward.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Redeemed:</span>
                        <span className="font-semibold">
                          {reward.redeemedAt.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Points Spent:</span>
                        <span className="font-semibold text-yellow-600">
                          {reward.pointsRequired}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className="bg-green-100 text-green-800">
                          {reward.status}
                        </Badge>
                      </div>
                      <div className="mt-3 p-2 bg-white rounded border text-xs">
                        <strong>Delivery:</strong> {getDeliveryMessage(reward)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No redemption history</h3>
            <p className="text-muted-foreground">Your redemption history will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Redemption Dialog */}
      <Dialog open={showRedemptionDialog} onOpenChange={setShowRedemptionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-500" />
              Redeem Reward
            </DialogTitle>
            <DialogDescription>
              Complete your reward redemption for <strong>{selectedReward?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{selectedReward.name}</span>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-4 h-4" />
                    <span className="font-semibold">{selectedReward.pointsRequired}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                <div className="mt-2 text-sm">
                  <span>Value: </span>
                  <span className="font-semibold">
                    {selectedReward.currency} {selectedReward.value}
                    {selectedReward.category === 'discount' && '%'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="delivery-method">Delivery Method</Label>
                  <Select 
                    value={redemptionForm.deliveryMethod} 
                    onValueChange={(value: React.ChangeEvent<HTMLInputElement>) => setRedemptionForm(prev => ({ 
                      ...prev, 
                      deliveryMethod: value 
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

                {redemptionForm.deliveryMethod === 'email' && (
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={redemptionForm.deliveryDetails.email}
                      onChange={(e) => setRedemptionForm(prev => ({
                        ...prev,
                        deliveryDetails: { ...prev.deliveryDetails, email: e.target.value }
                      }))}
                    />
                  </div>
                )}

                {redemptionForm.deliveryMethod === 'sms' && (
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={redemptionForm.deliveryDetails.phone}
                      onChange={(e) => setRedemptionForm(prev => ({
                        ...prev,
                        deliveryDetails: { ...prev.deliveryDetails, phone: e.target.value }
                      }))}
                    />
                  </div>
                )}

                {redemptionForm.deliveryMethod === 'mail' && (
                  <div>
                    <Label htmlFor="address">Mailing Address</Label>
                    <Textarea
                      id="address"
                      placeholder="123 Main St, City, State 12345"
                      value={redemptionForm.deliveryDetails.address}
                      onChange={(e) => setRedemptionForm(prev => ({
                        ...prev,
                        deliveryDetails: { ...prev.deliveryDetails, address: e.target.value }
                      }))}
                    />
                  </div>
                )}

                {redemptionForm.deliveryMethod === 'pickup' && (
                  <div>
                    <Label htmlFor="pickup">Pickup Location</Label>
                    <Input
                      id="pickup"
                      placeholder="City Hall, 123 Main St"
                      value={redemptionForm.deliveryDetails.pickupLocation}
                      onChange={(e) => setRedemptionForm(prev => ({
                        ...prev,
                        deliveryDetails: { ...prev.deliveryDetails, pickupLocation: e.target.value }
                      }))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRedemptionDialog(false)}
              disabled={isRedeeming}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRedemption}
              disabled={isRedeeming || !selectedReward}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {isRedeeming ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Redeem for {selectedReward?.pointsRequired} Points
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
